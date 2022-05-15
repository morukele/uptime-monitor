/**
 * Request handlers
 *
 */

// Dependencies
const config = require("../config");
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
	var firstName = typeof data.payload.firstName === "string" && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
	var lastName = typeof data.payload.lastName === "string" && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
	var phone = typeof data.payload.phone === "string" && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : false;
	var password = typeof data.payload.password === "string" && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
	var tosAgreement = typeof data.payload.tosAgreement === "boolean" && data.payload.tosAgreement === true ? true : false;

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
handlers._users.get = (data, callback) => {
	// Check that the phone number is valid
	var phone =
		typeof data.queryStringObject.phone === "string" && data.queryStringObject.phone.trim().length === 10 ? data.queryStringObject.phone.trim() : false;
	if (phone) {
		// Get the token from the headers
		var token = typeof data.headers.token === "string" ? data.headers.token : false;
		// Verify that the token is valid for the phone number
		handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
			if (tokenIsValid) {
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
				callback(403, {
					Error: "Missing required token in header, or token is invalid",
				});
			}
		});
	} else {
		callback(400, { error: "Missing required field" });
	}
};

// Users - PUT
// Required data: phone
// Optional data: firstName, lastName, password (at least one must be specified)
handlers._users.put = (data, callback) => {
	// Check for the required field
	var phone = typeof data.payload.phone === "string" && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : false;

	// Check for the optional fields
	var firstName = typeof data.payload.firstName === "string" && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
	var lastName = typeof data.payload.lastName === "string" && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
	var password = typeof data.payload.password === "string" && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

	// Error if the phone is invalid
	if (phone) {
		if (firstName || lastName || password) {
			// Get the token from the headers
			var token = typeof data.headers.token === "string" ? data.headers.token : false;
			handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
				if (tokenIsValid) {
					// Lookup the user
					_data.read("users", phone, (err, userData) => {
						if (!err && userData) {
							// Update the fields
							if (firstName) {
								userData.firstName = firstName;
							}
							if (lastName) {
								userData.lastName = lastName;
							}
							if (password) {
								userData.hashedPassword = helpers.hash(password);
							}

							// Store the new updates
							_data.update("users", phone, userData, (err) => {
								if (!err) {
									callback(200);
								} else {
									console.log(err);
									callback(500, {
										error: "Could not update the user",
									});
								}
							});
						} else {
							callback(400, {
								error: "The specified user does not exist",
							});
						}
					});
				} else {
					callback(403, {
						Error: "Missing required token in header, or token is invalid",
					});
				}
			});
		} else {
			callback(400, { error: "Missing fields to update" });
		}
	} else {
		callback(400, { error: "Missing required field" });
	}
};

// Users - DELETE
// Required field: phone
handlers._users.delete = (data, callback) => {
	// Check that the phone number is valid
	var phone =
		typeof data.queryStringObject.phone === "string" && data.queryStringObject.phone.trim().length === 10 ? data.queryStringObject.phone.trim() : false;
	if (phone) {
		// Get the token from the headers
		var token = typeof data.headers.token === "string" ? data.headers.token : false;

		// Verify that the token is valid for the phone number
		handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
			if (tokenIsValid) {
				// lookup the user
				_data.read("users", phone, (err, userData) => {
					if (!err && userData) {
						_data.delete("users", phone, (err) => {
							if (!err) {
								// Delete each of the checks associated with the user
								var userChecks = typeof userData.checks === "object" && userData.checks instanceof Array ? userData.checks : [];
								var checksToDelete = userChecks.length;

								if (checksToDelete > 0) {
									var checksDeleted = 0;
									var deletionErrors = false;

									// Loop through the checks
									userChecks.forEach((checkId) => {
										// Delete the Check
										_data.delete("checks", checkId, (err) => {
											if (err) {
												deletionErrors = true;
											}

											checksDeleted++;
											if (checksDeleted == checksToDelete) {
												if (!deletionErrors) {
													callback(200);
												} else {
													callback(500, { Error: "Errors encountered while attempting to delete one of the user's checks" });
												}
											}
										});
									});
								} else {
									callback(200);
								}
							} else {
								callback(500, {
									error: "Could not delete the specified user",
								});
							}
						});
					} else {
						callback(400, {
							error: "Could not find the specified user",
						});
					}
				});
			} else {
				callback(403, {
					Error: "Missing required token in header, or token is invalid",
				});
			}
		});
	} else {
		callback(400, { error: "Missing required field" });
	}
};

// Tokens
handlers.tokens = (data, callback) => {
	var acceptableMethods = ["post", "get", "put", "delete"];
	if (acceptableMethods.indexOf(data.method) > -1) {
		handlers._tokens[data.method](data, callback);
	} else {
		callback(405);
	}
};

// Container for all the token methods
handlers._tokens = {};

// Tokens - post
// Required data: phone, password
// Optional data: none
handlers._tokens.post = (data, callback) => {
	// Check that all required fields are filled out
	var phone = typeof data.payload.phone === "string" && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : false;
	var password = typeof data.payload.password === "string" && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

	if (phone && password) {
		// Lookup the user who matches the phone number
		_data.read("users", phone, (err, userData) => {
			if (!err && userData) {
				// Hash the sent password and compare it to the password stored in the user object
				var hashedPassword = helpers.hash(password);
				if (hashedPassword === userData.hashedPassword) {
					// if valid, create a new token with a random name
					// set expiration date 1 hour in the future
					var tokenId = helpers.createRandomString(20);
					var expires = Date.now() + 1000 * 60 * 60;
					var tokenObject = {
						phone: phone,
						id: tokenId,
						expires: expires,
					};

					_data.create("tokens", tokenId, tokenObject, (err) => {
						if (!err) {
							callback(200, tokenObject);
						} else {
							callback(500, {
								Error: "Could not create new token",
							});
						}
					});
				} else {
					callback(400, { Error: "Password incorrect" });
				}
			} else {
				callback(400, { Error: "Could not find the specified user" });
			}
		});
	} else {
		callback(400, { Error: "Missing required fields" });
	}
};

// Tokens - get
// Required data: id
// Optional data: none
handlers._tokens.get = (data, callback) => {
	//Check that the id is valid
	var id = typeof data.queryStringObject.id === "string" && data.queryStringObject.id.trim().length === 21 ? data.queryStringObject.id.trim() : false;

	if (id) {
		// lookup the user
		_data.read("tokens", id, (err, tokenData) => {
			if (!err && tokenData) {
				callback(200, tokenData);
			} else {
				callback(404);
			}
		});
	} else {
		callback(400, { error: "Missing required field" });
	}
};

// Tokens - put
// Required data: id, extend(boolen)
// Optional data: none
handlers._tokens.put = (data, callback) => {
	var id = typeof data.payload.id === "string" && data.payload.id.trim().length == 21 ? data.payload.id.trim() : false;
	var extend = typeof data.payload.extend === "boolean" && data.payload.extend === true ? true : false;

	if (id && extend) {
		// lookup the token
		_data.read("tokens", id, (err, tokenData) => {
			if (!err && tokenData) {
				// Check to make sure the token isn't already expired
				if (tokenData.expires > Date.now()) {
					tokenData.expires = Date.now() + 1000 * 60 * 60;

					// Store the new updates
					_data.update("tokens", id, tokenData, (err) => {
						if (!err) {
							callback(200);
						} else {
							callback(500, {
								Error: "Could not update the token's expiration",
							});
						}
					});
				} else {
					callback(400, {
						Error: "The token has already expired, and cannot be extended",
					});
				}
			} else {
				callback(400, { Error: "Specified token does not exisit" });
			}
		});
	} else {
		callback(400, {
			Error: "Missing required field(s) or field(s) are invalid",
		});
	}
};

// Tokens - delete
// Users - DELETE
// Required field: id
// TODO: only let an authenticated user delete only their object
// TODO: cleanup (delete) any other files associated with this user
handlers._tokens.delete = (data, callback) => {
	// Check that the id is valid
	var id = typeof data.queryStringObject.id === "string" && data.queryStringObject.id.trim().length === 21 ? data.queryStringObject.id.trim() : false;
	if (id) {
		// lookup the user
		_data.read("tokens", id, (err, data) => {
			if (!err && data) {
				_data.delete("tokens", id, (err) => {
					if (!err) {
						callback(200);
					} else {
						callback(500, {
							error: "Could not delete the specified token",
						});
					}
				});
			} else {
				callback(400, { error: "Could not find the specified token" });
			}
		});
	} else {
		callback(400, { error: "Missing required field" });
	}
};

// Verify if a given token id is currently valid for a given user
handlers._tokens.verifyToken = (id, phone, callback) => {
	// Lookup the token
	_data.read("tokens", id, (err, tokenData) => {
		if (!err && tokenData) {
			// Check that the token is for the given user and has not expired
			if (tokenData.phone == phone && tokenData.expires > Date.now()) {
				callback(true);
			} else {
				callback(false);
			}
		} else {
			callback(false);
		}
	});
};

// Checks
handlers.checks = (data, callback) => {
	var acceptableMethods = ["post", "get", "put", "delete"];
	if (acceptableMethods.indexOf(data.method) > -1) {
		handlers._checks[data.method](data, callback);
	} else {
		callback(405);
	}
};

// Container for all the checks methods
handlers._checks = {};

// Checks - post
// Required data: protocol, url, method, successCodes, timeoutSeconds
// Optional data: none
handlers._checks.post = (data, callback) => {
	// Validate inputs
	var protocol = typeof data.payload.protocol === "string" && ["https", "http"].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
	var url = typeof data.payload.url === "string" && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
	var method = typeof data.payload.method === "string" && ["post", "get", "put", "delete"].indexOf(data.payload.method) > -1 ? data.payload.method : false;
	var successCodes =
		typeof data.payload.successCodes === "object" && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0
			? data.payload.successCodes
			: false;
	var timeoutSeconds =
		typeof data.payload.timeoutSeconds === "number" &&
		data.payload.timeoutSeconds % 1 === 0 &&
		data.payload.timeoutSeconds >= 1 &&
		data.payload.timeoutSeconds <= 5
			? data.payload.timeoutSeconds
			: false;

	if (protocol && url && method && successCodes && timeoutSeconds) {
		// Get the token from the headers
		var token = typeof data.headers.token === "string" ? data.headers.token : false;

		// Lookup user with token
		_data.read("tokens", token, (err, tokenData) => {
			if (!err && tokenData) {
				var userPhone = tokenData.phone;

				// Look up the user data
				_data.read("users", userPhone, (err, userData) => {
					if (!err && userData) {
						var userChecks = typeof userData.checks === "object" && userData.checks instanceof Array ? userData.checks : [];
						// Verufy that the user has less than number of max check per user
						if (userChecks.length < config.maxChecks) {
							// Create a random id for the check
							var checkId = helpers.createRandomString(20);

							// Create the check object and include the user's phone
							var checkObject = {
								id: checkId,
								userPhone: userPhone,
								protocol: protocol,
								url: url,
								method: method,
								successCodes: successCodes,
								timeoutSeconds: timeoutSeconds,
							};

							// Save object
							_data.create("checks", checkId, checkObject, (err) => {
								if (!err) {
									// Add check id to the user object
									userData.checks = userChecks;
									userData.checks.push(checkId);

									// Save the new user data
									_data.update("users", userPhone, userData, (err) => {
										if (!err) {
											callback(200, checkObject);
										} else {
											callback(500, {
												Error: "Could not updat the user with the new check",
											});
										}
									});
								} else {
									callback(500, {
										Error: "Could not create the new check",
									});
								}
							});
						} else {
							callback(400, {
								Error: "User already has maximum number of checks " + config.maxChecks,
							});
						}
					} else {
						callback(403);
					}
				});
			} else {
				callback(403);
			}
		});
	} else {
		callback(400, {
			Error: "Missing required input(s) or input(s) invalid",
		});
	}
};

// Checks - get
// Required data: id
// Optional data: none
handlers._checks.get = (data, callback) => {
	// Check that the phone number is valid
	var id = typeof data.queryStringObject.id === "string" && data.queryStringObject.id.trim().length === 21 ? data.queryStringObject.id.trim() : false;
	if (id) {
		// lookup the check
		_data.read("checks", id, (err, checkData) => {
			if (!err && checkData) {
				// Get the token from the headers
				var token = typeof data.headers.token === "string" ? data.headers.token : false;
				// Verify that the token is valid for the user who created the check
				handlers._tokens.verifyToken(token, checkData.userPhone, (tokenIsValid) => {
					if (tokenIsValid) {
						// Return the check data
						callback(200, checkData);
					} else {
						callback(403);
					}
				});
			} else {
				callback(404);
			}
		});
	} else {
		callback(400, { error: "Missing required field" });
	}
};

// Checks - put
// Required data: id
// Optional data: protocol, url, method, successCodes, timeoutSeconds
handlers._checks.put = (data, callback) => {
	// Check for the required field
	var id = typeof data.payload.id === "string" && data.payload.id.trim().length === 21 ? data.payload.id.trim() : false;

	// Check for the optional fields
	var protocol = typeof data.payload.protocol === "string" && ["https", "http"].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
	var url = typeof data.payload.url === "string" && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
	var method = typeof data.payload.method === "string" && ["post", "get", "put", "delete"].indexOf(data.payload.method) > -1 ? data.payload.method : false;
	var successCodes =
		typeof data.payload.successCodes === "object" && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0
			? data.payload.successCodes
			: false;
	var timeoutSeconds =
		typeof data.payload.timeoutSeconds === "number" &&
		data.payload.timeoutSeconds % 1 === 0 &&
		data.payload.timeoutSeconds >= 1 &&
		data.payload.timeoutSeconds <= 5
			? data.payload.timeoutSeconds
			: false;

	// Check if id is valid
	if (id) {
		// Check to make sure at least on optional field is sent
		if (protocol || url || method || successCodes || timeoutSeconds) {
			// Lookup the check
			_data.read("checks", id, (err, checkData) => {
				if (!err && checkData) {
					// Get the token from the headers
					var token = typeof data.headers.token === "string" ? data.headers.token : false;
					// Verify that the token is valid for the user who created the check
					handlers._tokens.verifyToken(token, checkData.userPhone, (tokenIsValid) => {
						if (tokenIsValid) {
							// Update the check object
							if (protocol) {
								checkData.protocol = protocol;
							}
							if (url) {
								checkData.url = url;
							}
							if (method) {
								checkData.method = method;
							}
							if (successCodes) {
								checkData.successCodes = successCodes;
							}
							if (timeoutSeconds) {
								checkData.timeoutSeconds = timeoutSeconds;
							}

							// Save the updates
							_data.update("checks", id, checkData, (err) => {
								if (!err) {
									callback(200);
								} else {
									callback(500, {
										Error: "Could not update the checks",
									});
								}
							});
						} else {
							callback(403);
						}
					});
				} else {
					callback(400, { Error: "check id does not exisit" });
				}
			});
		} else {
			callback(400, { Error: "Missing fields to update" });
		}
	} else {
		callback(400, { Error: "Missing required field" });
	}
};

// Checks - delete
// Required data: id
// Optional data: none
handlers._checks.delete = (data, callback) => {
	// Check that the id is valid
	var id = typeof data.queryStringObject.id === "string" && data.queryStringObject.id.trim().length === 21 ? data.queryStringObject.id.trim() : false;
	if (id) {
		// Lookup the check
		_data.read("checks", id, (err, checkData) => {
			if (!err && checkData) {
				// Get the token from the headers
				var token = typeof data.headers.token === "string" ? data.headers.token : false;

				// Verify that the token is valid for the phone number
				handlers._tokens.verifyToken(token, checkData.userPhone, (tokenIsValid) => {
					if (tokenIsValid) {
						// Delete the check data
						_data.delete("checks", id, (err) => {
							if (!err) {
								// lookup the user
								_data.read("users", checkData.userPhone, (err, userData) => {
									if (!err && userData) {
										var userChecks = typeof userData.checks === "object" && userData.checks instanceof Array ? userData.checks : [];

										// Remove the delete check from the list of check
										var checkPosition = userChecks.indexOf(id);
										if (checkPosition > -1) {
											userChecks.splice(checkPosition, 1);

											// Re-save the user's data
											_data.update("users", checkData.userPhone, userData, (err) => {
												if (!err) {
													callback(200);
												} else {
													callback(500, { Error: "Could not update the user" });
												}
											});
										} else {
											callback(500, { Error: "Could not find the check on the users object so could not delete it" });
										}
									} else {
										callback(500, {
											error: "Could not find the user who created the check, so could not remove check from list in user object",
										});
									}
								});
							} else {
								callback(500, {
									Error: "Could not delete the check data",
								});
							}
						});
					} else {
						callback(403, {
							Error: "Missing required token in header, or token is invalid",
						});
					}
				});
			} else {
				callback(400, { Error: "Specified check id does not exist" });
			}
		});
	} else {
		callback(400, { error: "Missing required field" });
	}
};

module.exports = handlers;
