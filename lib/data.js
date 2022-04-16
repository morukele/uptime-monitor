/**
 * Library for storing and editing data
 *
 */

// Dependencies
const fs = require("fs");
const path = require("path");
const helpers = require("./helpers");

// Container for the module
const lib = {};

// Base directory of data folder
lib.baseDir = path.join(__dirname, "/../.data/");

// Write data to a file
lib.create = (dir, filename, data, callback) => {
	// Open the file for writing
	fs.open(
		lib.baseDir + dir + "/" + filename + ".json",
		"wx",
		(err, fileDescriptor) => {
			if (!err && fileDescriptor) {
				// Convert data to string
				var stringData = JSON.stringify(data);

				// Write to file and close it
				fs.writeFile(fileDescriptor, stringData, (err) => {
					if (!err) {
						fs.close(fileDescriptor, (err) => {
							if (!err) {
								callback(false);
							} else {
								callback("Error closing new file");
							}
						});
					} else {
						callback("Error writing to new file ");
					}
				});
			} else {
				callback("Could not create new file, it may already exist");
			}
		}
	);
};

// Read data from a file
lib.read = (dir, fileName, callback) => {
	fs.readFile(
		lib.baseDir + dir + "/" + fileName + ".json",
		"utf8",
		(err, data) => {
			if (!err && data) {
				var parsedData = helpers.parseJsonToObject(data);
				callback(false, parsedData);
			} else {
				callback(err, data);
			}
		}
	);
};

// Update existing file with new data
lib.update = (dir, fileName, data, callback) => {
	fs.open(
		lib.baseDir + dir + "/" + fileName + ".json",
		"r+",
		(err, fileDescriptor) => {
			if (!err && fileDescriptor) {
				var stringData = JSON.stringify(data);

				// Truncate the file
				fs.ftruncate(fileDescriptor, (err) => {
					if (!err) {
						// Write to file and close it
						fs.writeFile(fileDescriptor, stringData, (err) => {
							if (!err) {
								fs.close(fileDescriptor, (err) => {
									if (!err) {
										callback(false);
									} else {
										callback("Error closing the file");
									}
								});
							} else {
								callback("Error writing to existing file");
							}
						});
					} else {
						callback("Error truncating file");
					}
				});
			} else {
				callback(
					"Could not open the file for updating, it may not exist yet"
				);
			}
		}
	);
};

//Deleting existing file
lib.delete = (dir, fileName, callback) => {
	// Unlink the file
	fs.unlink(lib.baseDir + dir + "/" + fileName + ".json", (err) => {
		if (!err) {
			callback(false);
		} else {
			callback("Error deleting file");
		}
	});
};

// Export the module
module.exports = lib;
