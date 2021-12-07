import * as messaging from "messaging";
import { settingsStorage } from "settings";

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
			if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
				messaging.peerSocket.send(myData);
			}
		}).catch(err => console.log('[FETCH]: ' + err));
}

// helpers
function today() {
	let date = new Date();
	return  `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function restoreSettings() {
	for (let index = 0; index < settingsStorage.length; index++) {
		let key = settingsStorage.key(index);
		if (key && key === "oauth") {
			// We already have an oauth token
			let data = JSON.parse(settingsStorage.getItem(key))
		}
	}
}

function get_oath() {
	let maybe_oath = settingsStorage.getItem("oauth");
	if (maybe_oath) {
		return JSON.parse(maybe_oath);
	}
	return undefined;
}
messaging.peerSocket.onopen = () => {
	restoreSettings();
};

messaging.peerSocket.onmessage = evt => {
	let oath = get_oath();
	if (oath) {
		if ("drink" in evt.data) {
			console.log(evt.data.drink);
			drink(oath.access_token, evt.data.drink);
		}
		if ("undo" in evt.data) {
			console.log(evt.data.undo);
			delete_drink(oath.access_token, evt.data.undo);
		}
	}
}
