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

// Export the modules
module.exports = helpers;
