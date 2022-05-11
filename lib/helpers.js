/**
 * Helpers for various tasks
 *
 */

// Dependencies
const crypto = require("crypto");
const config = require("../config");

// Container for all the helpers
const helpers = {};

// A function to hash a string (SHA256)
helpers.hash = (string) => {
	if (typeof string === "string" && string.length > 0) {
		const hash = crypto
			.createHmac("sha256", config.hashingSecret)
			.update(string)
			.digest("hex");
		return hash;
	} else {
		return false;
	}
};

// A function that takes in a string and returns a json or false
helpers.parseJsonToObject = (string) => {
	try {
		var obj = JSON.parse(string);
		return obj;
	} catch (error) {
		return {};
	}
};

// A function that takes in an input lenght and creates a random string to match that lenght
helpers.createRandomString = (strLength) => {
	strLength =
		typeof strLength === "number" && strLength > 0 ? strLength : false;
	if (strLength) {
		// Define all the possible characters that could go into a string
		var possibleCharacters = "abcdefghijklmnopqrstuvwxyz0123456789";

		// Start the final string
		var str = "";

		for (let i = 0; i <= strLength; i++) {
			// Get a random character from the possible characters string
			var randChar = possibleCharacters.charAt(
				Math.floor(Math.random() * possibleCharacters.length)
			);
			// Append character to the final string
			str += randChar;
		}

		// Return the final string
		return str;
	} else {
		return false;
	}
};

// Export the modules
module.exports = helpers;
