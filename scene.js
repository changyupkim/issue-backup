/*
 * Scene, Scene controller/manager
 *
 * - Repository specific
 *
 * @param scene a scene object
 */
var http = require('http');
var url = require('url');

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

/*
 * Run the scene under the scenario
 *
 * This function is synchronous. The running results will be saved in the 'resources' property.
 *
 * The result format is an array of the JSON objects
 *	{
 *		uri : ...	// String
 *		resource : ...	// JSON
 *	}
 *
 * @parma args array of results from the predecessor scenes 
 * @return the result of the scene
 */
Scene.prototype.run = function(callback) {
	console.log('Run the scene, ' + this.id);

	var uris = this.getURIs();

	if (uris.length === 0) {
		console.log('URIs = N/A');
		// callback(null, this.resources);
		callback(null, this);

		// throw new Error();
		// return;
	} else {
		console.log('URIs = ' + uris);

		uris.forEach(function(uri) {
			console.log('Get the resource, ' + uri);

			var options = url.parse(uri);
			this.desc.port && (options.port = this.desc.port);
			options.method = this.desc.method;
			options.auth = this.conf.username + ':' + this.conf.password;
			// console.log(options);

			var that = this;
		    var results = '';
		    var req = http.request(options, function(res) {
		        // console.log('The %s, responded with %j.', repo.host, res.headers);
		        res.setEncoding('utf-8');
		        res.on('data', function(data) {
		            results += data;
		        });
		        res.on('end', function() {
		        	var contents = JSON.parse(results);
		        	console.log(contents);
		            // console.log('results (%j)', results);
		            // callback(null, results);

		            // that.resources[uri] = contents;
		            that.resources.push({
		            	'uri' : uri,
		            	'contents' : contents
		            });

		            if (uris.length === that.resources.length) {
						console.log('End the scene, ' + that.id);
			            // callback(null, that.resources);
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
