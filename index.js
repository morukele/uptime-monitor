/*
* Primary file for the API
*
*/

// Dependencies
const http = require('http');
const url = require('url');

// The server should respond to all request with a string
const server = http.createServer( (req, res) =>{

  // Get the URL and parse it
  var parsedUrl = url.parse(req.url, true)

  // Get the path

  // Send the response

  // Log the request path

  res.end('Hello World\n')
})

// Start th server, and have it listen on port 3000
server.listen(3000, () => {
  console.log("The server is listening on port 3000")
})
