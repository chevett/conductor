var http = require('http'),
	cluster = require('cluster'),
	static = require('./node-static.js'),
	file = new(static.Server)('./public', {
		gzip:true
	}),
	os = require('os'),
	util = require('util')



var numCPUs = os.cpus().length;
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
			process.stdout.write(".");
			file.serve(request, response, function (err, result) {
				if (err){
					if (err.status === 404 || err.status === 500) {
						file.serveFile(util.format('/%d.html', err.status), err.status, {}, request, response);
					} else {
						response.writeHead(err.status, err.headers);
						response.end();
					}
				}
			});
		}).resume();
	}).listen(port);
}




