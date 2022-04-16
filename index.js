/*
 * Primary file for the API
 *
 */

// Dependencies
const fs = require("fs");
const http = require("http");
const https = require("https");
const url = require("url");
const StringDecoder = require("string_decoder").StringDecoder;
const config = require("./config");
const handlers = require("./lib/handlers");
const helpers = require("./lib/helpers");

// Instantiate the HTTP server
const httpServer = http.createServer((req, res) => {
	unifiedServer(req, res);
});

// Starting http server
httpServer.listen(config.httpPort, () => {
	console.log("The http server is listening on port " + config.httpPort);
});

// Instantiate the HTTPS server
var httpsServerOptions = {
	key: fs.readFileSync("./https/key.pem"),
	cert: fs.readFileSync("./https/cert.pem"),
};
var httpsServer = https.createServer(httpsServerOptions, (req, res) => {
	unifiedServer(req, res);
});

// Starting https server
httpsServer.listen(config.httpsPort, () => {
	console.log("The https server is listening on port " + config.httpsPort);
});

// All the server logic for both https and https server
var unifiedServer = (req, res) => {
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

		// Choose the correct handler for request
		var chosenHandler =
			typeof router[trimmedPath] !== "undefined"
				? router[trimmedPath]
				: handlers.notFound;

		// Construct the data object to send to handler
		var data = {
			trimmedPath: trimmedPath,
			queryStringObject: queryStringObject,
			method: method,
			headers: headers,
			payload: helpers.parseJsonToObject(buffer),
		};

		// Route the request to the chosen handler
		chosenHandler(data, (statusCode, payload) => {
			// Use the status code called back by the handler or default to 200

			statusCode = typeof statusCode === "number" ? statusCode : 200;

			// Use the payload defined by handler or default to empty object
			payload = typeof payload === "object" ? payload : {};

			// Convert payload to string
			var payloadString = JSON.stringify(payload);

			//return response
			res.setHeader("Content-Type", "application/json");
			res.writeHead(statusCode);
			res.end(payloadString);

			// Log the request path
			console.log("returning response: ", statusCode, payloadString);
		});
	});
};

// Define a request router
const router = {
	ping: handlers.ping,
	users: handlers.users,
};
