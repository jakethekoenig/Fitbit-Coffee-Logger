import * as messaging from "messaging";
import { encode } from "cbor";
import { settingsStorage } from "settings";
import { inbox, outbox } from "file-transfer";

// Coffee
// id=17222
// unitid=147
// grams (100)

// Green Tea, Unsweetened
// id=22791773
// unitId=128
// fl oz (8)

// Red Bull, Sugarfree
// id=692780412
// unitId=43
// can (1)

function delete_drink(accessToken, log_id) {
	fetch(`https://api.fitbit.com/1/user/-/foods/log/${log_id}.json`,
		{
			method: "DELETE",
				headers: {
					"Authorization": `Bearer ${accessToken}`
				}
		}).then(function(res) {
			console.log(JSON.stringify(res));
		}).catch(err => console.log('[FETCH]: ' + err));
}

function drink(accessToken, drink_name) {
	let todayDate = today();
	// TODO: time of day not always 7
	fetch(`https://api.fitbit.com/1/user/-/foods/log.json?date=${todayDate}&foodName=${drink_name}&mealTypeId=7&unitId=147&amount=100.00`, {
		method: "POST",
		headers: {
			"Authorization": `Bearer ${accessToken}`
		}
})
		.then(function(res) {
			return res.json();
		}).then(function(data) {
			console.log(data.foodLog.logId);
			let myData = {
				id: data.foodLog.logId
			}
			outbox.enqueue("drink_key", encode({value: data.foodLog.logId}))
				.then((ft) => {
					console.log(`Transfer of ${ft.name} successfully queued.`);
				})
				.catch((error) => {
					console.log(`Failed to queue ${evt.key}: ${error}`);
				});
		}).catch(err => console.log('[FETCH]: ' + err));
}

// helpers
function today() {
	let date = new Date();
	return  `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function get_oath() {
	let maybe_oath = settingsStorage.getItem("oauth");
	if (maybe_oath) {
		return JSON.parse(maybe_oath);
	}
	return undefined;
}

async function processAllFiles() {
	let file;
	let oath = get_oath();
	while ((file = await inbox.pop())) {
		if (file.name === "settings") {
			// The only reason this is sent is to initialize the defaults so I don't need to read the sent data.
		// let data = await file.json();
			settingsStorage.setItem("coffee", true);
		}
		if (file.name === "undo" && oath) {
			let data = await file.json();
			console.log(JSON.stringify(data));
			delete_drink(oath.access_token, data["undo"]);
		}
		if (file.name === "drink" && oath) {
			let data = await file.json();
			console.log(JSON.stringify(data));
			drink(oath.access_token, data["drink"]);
		}
	}
}

settingsStorage.addEventListener("change", evt => {
	console.log(JSON.stringify(evt));
	if (evt.oldValue !== evt.newValue && evt.key !== "oath") {
		outbox.enqueue(`${evt.key}`, encode({value: evt.newValue}))
			.then((ft) => {
				console.log(`Transfer of ${ft.name} successfully queued.`);
			})
			.catch((error) => {
				console.log(`Failed to queue ${evt.key}: ${error}`);
			})
	}
});

inbox.addEventListener("newfile", processAllFiles);
processAllFiles();
