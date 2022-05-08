import * as fs from "fs";
import * as document from "document";
import * as messaging from "messaging";
import { encode } from "cbor";
import { inbox, outbox } from "file-transfer";
import { me } from "appbit";

// On start up check for "today" file. Open it and if it has today property
// equal to today. If it is before today delete it and make a new one with all
// zeros.
// initialize the texts to the numbers in the file. 
// Every time a button is clicked update the number in the file.
// Keep an array with the ordered list of clicks and implement an undo button.
//
// The screen is 336x336 and the large icons are 96x96

function make_today() {
	let today = new Date();
	let data  = {
		"day": today,
		"coffee": 0,
		"tea": 0,
		"energy": 0,
		"history": [],
		"log_history": []
	};
	fs.writeFileSync("today.txt", data, "json");
	return data;
}

function load_state() {
	if (!fs.existsSync("today.txt")) {
		let last_data = make_today();
	} else {
		let last_data  = fs.readFileSync("today.txt", "json");
	}

	let today = new Date();
	let last_day = new Date(last_data["day"]);
	if (today.getDate() !== last_day.getDate() || today.getMonth() !== last_day.getMonth()) {
		fs.unlinkSync("today.txt");
		last_data = make_today();
	}

 
  let default_setting = {coffee: "true", tea: "false", energy: "false", color: "orange"};
  let use_defaults = false;
  
	if (!fs.existsSync("settings")) {
    use_defaults = true;
  } 
  else if (fs.readFileSync("settings", "json").length == undefined) {
    use_defaults = true;
  }
  if (use_defaults == true) {
    console.log("defaults used");
		
		fs.writeFileSync("settings", default_setting, "json");
		outbox.enqueueFile("settings")
			.then(ft => {
				console.log(`Transfer of ${ft.name} successfully queued.`);
			})
			.catch(err => {
				console.log(`Failed to schedule transfer: ${err}`);
			});
	} else {
    console.log("no defaults");
  }
	const settings = fs.readFileSync("settings", "json");
	return {data: last_data, settings: settings};
}


function increment_drink(drink) {
	let data  = fs.readFileSync("today.txt", "json");
	data[drink] = data[drink] + 1;
	data["history"].push(drink);
	drinks[drink].text.text = data[drink];
	fs.writeFileSync("today.txt", data, "json");
}

function undo() {
	let state = load_state();
	let data  = state["data"];

	let hist = data["history"];
	let log_history = data["log_history"];
	if (hist.length !== 0) {
		let last = hist.pop();
		data[last] = data[last] - 1;
		drinks[last].text.text = data[last];

		let last_id = log_history.pop();
		if (last_id) {
			outbox.enqueue("undo", {"undo": last_id}, {encoding: "json"})
				.then(ft => {
					console.log(`Transfer of ${ft.name} ${last_id} successfully queued.`);
				})
				.catch(err => {
					console.log(`Failed to schedule transfer: ${err}`);
				});
		}
	}
	fs.writeFileSync("today.txt", data, "json");
}


const undoButton = document.getElementById("undo");
undoButton.addEventListener("click", (evt) => {
	undo();
});

const coffee = { name: "coffee", api_name: "Coffee"};
const tea    = { name: "tea",    api_name: "Green Tea, Unsweetened"};
const energy = { name: "energy", api_name: "Red Bull, Sugarfree"};
const drinks = {
	coffee: coffee, 
	tea: tea, 
	energy: energy
};

function render() {
	let count = 0;
	let settings = fs.readFileSync("settings", "json");
  let settings_color = "";
  if(settings["color"].length == undefined) {
    settings_color = "orange";
  } else {
    settings_color = settings["color"];
  }
	for (const drink in drinks) {
		if (settings[drink]==="true") {
			count += 1;
		}
	}
	let found = 1;
	let button_class = "large-button application-fill "; 
	if (count<3) {
		button_class = "extra-large-button application-fill "; 
	}
	for (const drink in drinks) {
		if (settings[drink]==="true") {
			drinks[drink].button.style.display = "inline";
			drinks[drink].button.style.fill = settings_color;
			drinks[drink].button.class = button_class  + " " + `button-${found}-${count}`;
			drinks[drink].text.style.display = "inline";
			drinks[drink].text.style.fill = settings_color;
			drinks[drink].text.class = `text-${found}-${count}`;
			found += 1;
		} else {
			drinks[drink].button.style.display = "none";
			drinks[drink].text.style.display = "none";
		}
	}  
	document.getElementById("undo").style.fill = settings_color;
}

function processAllFiles() {
	let fileName;
	while (fileName = inbox.nextFile()) {
		if (fileName === "drink_key") {
			let data  = fs.readFileSync("today.txt", "json");
			let data_in = fs.readFileSync(fileName, "cbor");
			data["log_history"].push(data_in["value"]);
			fs.writeFileSync("today.txt", data, "json");
		} else {
			let data = fs.readFileSync(fileName, "cbor");
			let settings = fs.readFileSync("settings", "json");
			settings[fileName] = data["value"];
			fs.writeFileSync("settings", settings, "json");
		}
	}
	render();
}

const state = load_state();
for (const drink in drinks) {
	const drinkButton = document.getElementById(drink);
	const drinkText   = document.getElementById(drink + "-text");
	drinks[drink].text = drinkText;
	drinks[drink].button = drinkButton;
	const api_name = drinks[drink].api_name;
	drinkText.text = state["data"][drink];

	drinkButton.addEventListener("click", (evt) => {
		increment_drink(drink);
		outbox.enqueue("drink", {"drink": api_name}, {encoding: "json"})
			.then(ft => {
				console.log(`Transfer of ${ft.name}, ${api_name} successfully queued.`);
			})
			.catch(err => {
				console.log(`Failed to schedule transfer: ${err}`);
			});
	});
}

inbox.addEventListener("newfile", processAllFiles);

processAllFiles();
// Removal of redundant render call.
// render();
