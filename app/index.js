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
}

const listDir = fs.listDirSync("/private/data");
var found = false;
var dirIter;
while((dirIter = listDir.next()) && !dirIter.done) {
	if (dirIter.value === "today.txt") {
		found = true;
	}
}

if (!found) {
	make_today();
}

let last_data  = fs.readFileSync("today.txt", "json");
let today = new Date();
let last_day = new Date(last_data["day"]);
if (last_day.getDate() !== today.getDate() || last_day.getMonth() !== today.getMonth() || last_day.getFullYear() !== today.getFullYear()) {
	fs.unlinkSync("today.txt");
	make_today();
	last_data  = fs.readFileSync("today.txt", "json");
}

function increment_drink(drink) {
	let data  = fs.readFileSync("today.txt", "json");
	data[drink] = data[drink] + 1;
	data["history"].push(drink);
	fs.writeFileSync("today.txt", data, "json");
}

function undo() {
	let data  = fs.readFileSync("today.txt", "json");
	let hist = data["history"];
	let log_history = data["log_history"];
	if (hist.length !== 0) {
		let last = hist.pop();
		data[last] = data[last] - 1;

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
		fs.writeFileSync("today.txt", data, "json");
	}
}

const to_add = []; // Just strings of drink names to send
const to_delete = []; // ids of drinks
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

for (const drink in drinks) {
	const drinkButton = document.getElementById(drink);
	const drinkText   = document.getElementById(drink + "-text");
	drinks[drink].text = drinkText;
	const api_name = drinks[drink].api_name;
	drinkText.text = last_data[drink];

	drinkButton.addEventListener("click", (evt) => {
		drinkText.text = parseInt(drinkText.text) + 1;
		increment_drink(drink);
		if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
			messaging.peerSocket.send({"drink": api_name});
		} else {
			to_add.push(api_name);
			console.log("Could not connect to phone");
		}
	});

}

messaging.peerSocket.onmessage = evt => {
	let data  = fs.readFileSync("today.txt", "json");
	console.log(evt.data.id);
	data["log_history"].push(evt.data.id);
	fs.writeFileSync("today.txt", data, "json");
}

messaging.peerSocket.onopen = function () {
	for (drink in to_add) {
		messaging.peerSocket.send({"drink": drink});
	}
	for (drink in to_delete) {
		messaging.peerSocket.send({"undo": drink});
	}
}

me.unload () => {
	// Should store to_add to_delete arrays
	// Could store data as well instead of managing it throughout program.

}
