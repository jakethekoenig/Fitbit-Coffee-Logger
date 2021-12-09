import * as fs from "fs";
import * as document from "document";
import * as messaging from "messaging";
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

function save_state(data, to_add, to_delete) {
	let today = new Date();
	fs.writeFileSync("to_add", {data: to_add, date: today}, "json");
	fs.writeFileSync("to_delete", {data: to_delete, date: today}, "json");
	fs.writeFileSync("today.txt", data, "json");
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

	const to_add = []; // Just strings of drink names to send
	if (fs.existsSync("to_add")) {
		let last_add = fs.readFileSync("to_add", "json");
		if (today.getDate() === (new Date(last_add["date"])).getDate()) { // I won't persist overnight
			to_add = last_add["data"];
		}
	}

	const to_delete = []; // ids of drinks
	if (fs.existsSync("to_delete")) {
		let last_delete = fs.readFileSync("to_delete", "json");
		if (today.getDate() === (new Date(last_delete["date"])).getDate()) { // I won't persist overnight
			to_delete = last_delete["data"];
		}
	}
	return {data: last_data, to_add: to_add, to_delete: to_delete};
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
	let to_add = state["to_add"];
	let to_delete = state["to_delete"];

	let hist = data["history"];
	let log_history = data["log_history"];
	if (hist.length !== 0) {
		let last = hist.pop();
		data[last] = data[last] - 1;
		drinks[last].text.text = data[last];

		if (to_add.length !== 0) {
			to_add.pop();
		} else {
			let last_id = log_history.pop();

			if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
				messaging.peerSocket.send({"undo": last_id});
			} else {
				console.log("Could not connect to phone");
				to_delete.push(last_id);
			}
		}
	}
	save_state(data, to_add, to_delete);
}


const undoButton = document.getElementById("undo");
undoButton.addEventListener("click", (evt) => {
	undo();
});

const coffee = { name: "coffee", api_name: "Coffee" };
const tea    = { name: "tea",    api_name: "Green Tea, Unsweetened" };
const energy = { name: "energy", api_name: "Red Bull, Sugarfree" };
const drinks = {
	coffee: coffee, 
	tea: tea, 
	energy: energy
};

const state = load_state();
for (const drink in drinks) {
	const drinkButton = document.getElementById(drink);
	const drinkText   = document.getElementById(drink + "-text");
	drinks[drink].text = drinkText;
	const api_name = drinks[drink].api_name;
	drinkText.text = state["data"][drink];

	drinkButton.addEventListener("click", (evt) => {
		increment_drink(drink);
		if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
			messaging.peerSocket.send({"drink": api_name});
		} else {
			let state = load_state();
			state["to_add"].push(api_name);
			save_state(state["data"], state["to_add"], state["to_delete"]);
			console.log("Could not connect to phone");
		}
	});

}

messaging.peerSocket.onmessage = evt => {
	console.log(JSON.stringify(evt));
	if ("id" in evt.data) {
		let data  = fs.readFileSync("today.txt", "json");
		console.log(evt.data.id);
		data["log_history"].push(evt.data.id);
		fs.writeFileSync("today.txt", data, "json");
	}
	if ("key" in evt.data) {
		if (evt.data.value === "false") {
			document.getElementById(evt.data.key).style.display = "none";
			document.getElementById(evt.data.key+"-text").style.display = "none";
		} else {
			document.getElementById(evt.data.key).style.display = "inline";
			document.getElementById(evt.data.key+"-text").style.display = "inline";
		}

	}
}

messaging.peerSocket.onopen = function () {
	console.log("socket opened");
	const state = load_state();
	for (drink in state["to_add"]) {
		console.log(JSON.stringify(drink));
		messaging.peerSocket.send({"drink": drink});
	}
	for (drink in state["to_delete"]) {
		console.log(JSON.stringify(drink));
		messaging.peerSocket.send({"undo": drink});
	}
	save_state(state["data"], [], []);
}

