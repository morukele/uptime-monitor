/**
 * Request handlers
 *
 */

// Dependencies
const _data = require("./data");
const helpers = require("./helpers");

// Define the request handlers
const handlers = {};

// Ping handler
handlers.ping = (data, callback) => {
	callback(200);
};

// Not found handler
handlers.notFound = (data, callback) => {
	callback(404);
};

handlers.users = (data, callback) => {
	var acceptableMethods = ["post", "get", "put", "delete"];
	if (acceptableMethods.indexOf(data.method) > -1) {
		handlers._users[data.method](data, callback);
	} else {
		callback(405);
	}
};

// Container for users sub methods
handlers._users = {};

// Users - POST
// Required data: firstName, lastName, phone, password, tosAgreement
// Optional data; none
handlers._users.post = (data, callback) => {
	// Check that all required fields are filled out
	var firstName =
		typeof data.payload.firstName === "string" &&
		data.payload.firstName.trim().length > 0
			? data.payload.firstName.trim()
			: false;
	var lastName =
		typeof data.payload.lastName === "string" &&
		data.payload.lastName.trim().length > 0
			? data.payload.lastName.trim()
			: false;
	var phone =
		typeof data.payload.phone === "string" &&
		data.payload.phone.trim().length === 10
			? data.payload.phone.trim()
			: false;
	var password =
		typeof data.payload.password === "string" &&
		data.payload.password.trim().length > 0
			? data.payload.password.trim()
			: false;
	var tosAgreement =
		typeof data.payload.tosAgreement === "boolean" &&
		data.payload.tosAgreement === true
			? true
			: false;

	if (firstName && lastName && phone && password && tosAgreement) {
		// Make sure that the user doesn't already exist
		_data.read("user", phone, (err, data) => {
			if (err) {
				// Hash the password
				var hashedPassword = helpers.hash(password);

				// Create the user object
				if (hashedPassword) {
					var userObject = {
						firstName: firstName,
						lastName: lastName,
						phone: phone,
						hashedPassword: hashedPassword,
						tosAgreement: true,
					};
				} else {
					callback(500, { error: "Could not hash user's password" });
				}

				// Store the user
				_data.create("users", phone, userObject, (err) => {
					if (!err) {
						callback(200);
					} else {
						console.log(err);
						callback(500, {
							error: "could not create the new user",
						});
					}
				});
			} else {
				// User already exists
				callback(400, {
					error: "A user with that phone number already exist",
				});
			}
		});
	} else {
		callback(400, { error: "Missing required fields" });
	}
};

// Users - GET
// Required data: phone
// Optional data: none
// @TODO: Only let an authenticated user access their object only.
handlers._users.get = (data, callback) => {
	// Check that the phone number is valid
	var phone =
		typeof data.queryStringObject.phone === "string" &&
		data.queryStringObject.phone.trim().length === 10
			? data.queryStringObject.phone.trim()
			: false;
	if (phone) {
		// lookup the user
		_data.read("users", phone, (err, data) => {
			if (!err && data) {
				// remove the hashed password from the user object
				delete data.hashedPassword;
				callback(200, data);
			} else {
				callback(404);
			}
		});
	} else {
		callback(400, { error: "Missing required field" });
	}
};

// Users - PUT
handlers._users.put = (data, callback) => {};

// Users - DELETE
handlers._users.delete = (data, callback) => {};

module.exports = handlers;
