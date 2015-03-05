/*
 * Scene, Scene controller/manager
 *
 * - Repository specific
 *
 * @param scene a scene object
 */
var http = require('http');
var URL = require('url');

function Scene(conf, scenario, id, description) {
	this.conf = conf;
	this.scenario = scenario;

	this.id = id;
	this.desc = description;
	this.resources = []; //{};

	// digraph representation as a adjacency list
	this.edges = [];
	this.visited = false;
}

/*
 * get the previous scenes
 *
 * @return the array of the previous scene
 */
Scene.prototype.getPreviousScenes = function() {
	return this.desc.prevs;
}

/* Get the URI of the scene
 *
 * It returns the array of URIs in the scene.
 * An empty array is returned when no resource is assocaited
 * with the scene.
 */
/*
Scene.prototype.getURIs = function() {
	var uris;

	// construct the base part of the URI

	var base = this.conf.protocol + "://" + this.conf.server;
	if (this.conf.port) {
		base = base + ":" + this.conf.port;
	}
	base += this.conf.rest;

	// construct the resource name part of the URI

	var names;

	if (typeof this.desc.names === 'function') {
		var args = this.getPreviousScenes().map(function(scene) {
			return scene.resources;
		});
		// console.log(args);

		names = this.desc.names.apply(null, args);
	} else if (this.desc.names instanceof Array) {
		names = this.desc.names.slice();
	} else {
		throw new Error('Scene[names] is not a function nor an array');
	}
	// console.log(names);

	// construct the query param part or the URI

	uris = names.map(function(api, i) {
		var uri = base + api;

		if (this.desc.params[i]) {
			uri = uri + "?" + this.desc.params[i];
		}

		return uri;
	}, this);
	// console.log(uris);

	return uris;
}
*/

Scene.prototype.getURLs = function() {
	var urls,
		base,
		paths;

	// construct the base part

	base = this.conf.protocol + "://" + this.conf.server;
	if (this.conf.port) {
		base = base + ":" + this.conf.port;
	}
	base += this.conf.rest;

	// construct the path part

	if (typeof this.desc.paths === 'function') {
		var args = this.getPreviousScenes().map(function(scene) {
			return scene.resources;
		});
		console.log(args);

		paths = this.desc.paths.apply(null, args);
	} else if (this.desc.paths instanceof Array) {
		paths = this.desc.paths.slice();
	} else {
		throw new Error('Scene[paths] is not a function nor an array');
	}

	// concatenate 'base' + 'location'

	urls = paths.map(function(loc) {
		return (base + loc);
	});

	return urls;
}

/*
 * Run the scene under the scenario
 *
 * This function is asynchronous. When the scene is played out, the @callback is invoked.
 * The 'result' parameter is the scene itself.
 *
 * @param callback(err, result)
 * @return the result of the scene
 */
// Scene.prototype.run = function(callback) {
// 	console.log('Run the scene, ' + this.id);

// 	var uris = this.getURIs();

// 	if (uris.length === 0) {
// 		console.log('URIs = N/A');
// 		callback(null, this);

// 		// throw new Error();
// 		// return;
// 	} else {
// 		console.log('URIs = ' + uris);

// 		uris.forEach(function(uri) {
// 			console.log('Get the resource, ' + uri);

// 			var options = url.parse(uri);
// 			this.desc.port && (options.port = this.desc.port);
// 			options.method = this.desc.method;
// 			options.auth = this.conf.username + ':' + this.conf.password;
// 			// console.log(options);

// 			var that = this;
// 		    var results = '';
// 		    var req = http.request(options, function(res) {
// 		        // console.log('The %s, responded with %j.', repo.host, res.headers);
// 		        res.setEncoding('utf-8');
// 		        res.on('data', function(data) {
// 		            results += data;
// 		        });
// 		        res.on('end', function() {
// 		        	var contents = JSON.parse(results);
// 		        	console.log(contents);
// 		            // console.log('results (%j)', results);

// 		            that.resources.push({
// 		            	'uri' : uri,
// 		            	'contents' : contents
// 		            });

// 		            if (uris.length === that.resources.length) {
// 						console.log('End the scene, ' + that.id);
// 			            callback(null, that);
// 		        	}
// 		        });
// 		    })
// 	 		.on('error', function(e) {
// 		    	// throw e;
// 		    	callback(e);
// 		    })
// 		    .end();
// 		}, this);
// 	}
// }

Scene.prototype.run = function(callback) {
	console.log('Run the scene, ' + this.id);

	var urls = this.getURLs();

	if (urls.length === 0) {
		console.log('URLs = N/A');
		callback(null, this);

		// throw new Error();
		// return;
	} else {
		console.log('URLs = ' + urls);

		var cnt = urls.length;

		urls.forEach(function(url, i) {
			console.log('query ' + url);

			var options = URL.parse(url);
			options.method = this.desc.method;
			options.auth = this.conf.username + ':' + this.conf.password;

			var that = this;
		    var results = '';
		    var req = that.conf.ajax.request(options, function(res) {
		        res.setEncoding('utf-8');
		        res.on('data', function(data) {
		            results += data;
		        });
		        res.on('end', function() {
		        	var d = JSON.parse(results);

		        	that.resources.push(that.desc.resources(d));

		            if (--cnt === 0) {
						console.log('End the scene, ' + that.id);
			            callback(null, that);
		        	}
		        });
		    })
	 		.on('error', function(e) {
		    	// throw e;
		    	callback(e);
		    })
		    .end();
		}, this);
	}
}
module.exports = Scene;
