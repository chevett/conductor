var http = require("http"),
	cluster = require("cluster"),
	static = require('node-static'),
	file = new(static.Server)('./public');

var numCPUs = require("os").cpus().length;
var port = parseInt(process.argv[2] || 3000);

console.log('going...')

if (cluster.isMaster) {
	for (var i = 0; i < numCPUs; i++) {
		cluster.fork();
	}

	cluster.on("exit", function(worker, code, signal) {
		cluster.fork();
	});
} else {
	console.log('gone.');
	http.createServer(function (request, response) {
		request.addListener('end', function () {
			file.serve(request, response);
		}).resume();
	}).listen(port);
}




