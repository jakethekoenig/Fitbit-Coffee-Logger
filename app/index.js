
import * as fs from "fs";
import * as document from "document";

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
		"history": []
	};
	fs.writeFileSync("today.txt", data, "json");
}

const listDir = fs.listDirSync("/private/data");
var found = false;
var dirIter;
while((dirIter = listDir.next()) && !dirIter.done) {
	console.log(dirIter.value);
	if (dirIter.value === "today.txt") {
		console.log("found");
		found = true;
	}
}

if (!found) {
	console.log("not found");
	make_today();
}


let last_data  = fs.readFileSync("today.txt", "json");
let today = new Date();
let last_day = new Date(last_data["day"]);
if (last_day.getDate() !== today.getDate() || last_day.getMonth() !== today.getMonth() || last_day.getFullYear() !== today.getFullYear()) {
	console.log("making new");
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
	if (hist.length !== 0) {
		let last = hist.pop();
		data[last] = data[last] - 1;
		drink_text_map[last].text = data[last];
		fs.writeFileSync("today.txt", data, "json");
	}
}

const undoButton = document.getElementById("undo");
undoButton.addEventListener("click", (evt) => {
	undo();
});

const coffeeButton = document.getElementById("coffee");
const coffeeText = document.getElementById("coffee-text");
coffeeText.text = last_data["coffee"];

coffeeButton.addEventListener("click", (evt) => {
	coffeeText.text = parseInt(coffeeText.text) + 1;
	increment_drink("coffee");
});


const teaButton = document.getElementById("tea");
const teaText = document.getElementById("tea-text");
teaText.text = last_data["tea"];

teaButton.addEventListener("click", (evt) => {
	teaText.text = parseInt(teaText.text) + 1;
	increment_drink("tea");
});


const energyButton = document.getElementById("energy");
const energyText = document.getElementById("energy-text");
energyText.text = last_data["energy"];

energyButton.addEventListener("click", (evt) => {
	energyText.text = parseInt(energyText.text) + 1;
	increment_drink("energy");
});

const drink_text_map = {
	"coffee": coffeeText,
	"tea": teaText,
	"energy": energyText,
};
