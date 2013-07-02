// This test will hit localhost:8080 with 20 concurrent connections for 10 minutes.
var http = require('http'),
	nl = require('nodeload');

http.createServer(function (req, res) { res.writeHead(200); res.end(); }).listen(8080);
console.log("Server to load test listening on 8080.");

var loadtest = nl.run({
	name: 'conductor',
	host: 'mydevbox',
	port: 3000,
	numClients: 5,
	timeLimit: 60,
	targetRps: 200,
	stats: ['latency', 'result-codes', { name: 'http-errors', successCodes: [200], log: 'http-errors.log' }],
	requestGenerator: function(client) {
		return client.request('GET', "/test.html");
	}
});
loadtest.on('end', function() { process.exit(0); });