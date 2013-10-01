var http = require('http'),
	cluster = require('cluster'),
	static = require('./node-static'),
	file = new(static.Server)('./public', {
		gzip:true
	}),
	os = require('os'),
	util = require('util'),
	url = require('url');
	
var cache = Object.create(null);
var numCPUs = os.cpus().length;
var port = parseInt(process.argv[2] || 9000);

console.log('going...')



function _createCacheKey(request){
	try {
		return decodeURI(url.parse(request.url).pathname);
	}
	catch(e) {
		return null;
	}
}

function _needsBody(request){
	return !request.headers['if-none-match'] && !request.headers['if-modified-since'];
}

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
			var cacheKey = _createCacheKey(request),
				cacheItem = cache[cacheKey];
			 
			if (cacheKey && cacheItem){

				if (_needsBody(request)){
					if (cacheItem.hasBody){

						response.writeHead(200, cacheItem.headersFor200);
						response.write(cacheItem.body);
						response.end();
						return;
					}
				} else {
					response.writeHead(304, cacheItem.headersFor304);
					response.end();
					return;
				}
			}


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




