/*
 * Primary file for the API
 *
 */

// Dependencies
const http = require("http");
const url = require("url");
const StringDecoder = require("string_decoder").StringDecoder;

// The server should respond to all request with a string
const server = http.createServer((req, res) => {
	// Get the URL and parse it
	var parsedUrl = url.parse(req.url, true);

	// Get the path
	var path = parsedUrl.pathname;
	var trimmedPath = path.replace(/^\/+|\/+$/g, "");

	// Get the query string as an object
	var queryStringObject = parsedUrl.query;

	// Get the http method
	var method = req.method.toLowerCase();

	// Get the headers as an object
	var headers = req.headers;

	// Get the payload, if any
	// Data comes in as a stream so we decode it and save it into the buffer object
	var decoder = new StringDecoder("utf-8");
	var buffer = "";
	req.on("data", (data) => {
		buffer += decoder.write(data);
	});
	req.on("end", () => {
		buffer += decoder.end();

		// Send the response
		res.end("Hello World\n");

		// Log the request path
		console.log(buffer);
	});
});

// Start th server, and have it listen on port 3000
server.listen(3000, () => {
	console.log("The server is listening on port 3000");
});

//Define the request handlers
const handlers = {};

// Sample handler
handlers.sample = (data, callback) => {};

// Not found handler
handlers.notFound = (data, callback) => {};

// Define a request router
const router = {
	sample: handlers.sample,
};
