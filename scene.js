/*
 * Scene, Scene controller/manager
 *
 * - Repository specific
 *
 * @param scene a scene object
 */
var http = require('http');
var URL = require('url');
var path = require('path');
var fs = require('fs');
var Persistence = require('./persistence');

function Scene(conf, scenario, id, description) {
	this.conf = conf;
	this.scenario = scenario;

	this.id = id;
	this.desc = description;
	this.resources = []; //{};

	// digraph representation as a adjacency list
	this.edges = [];
	this.visited = false;

	// persistence
	this.persistence = new Persistence(conf, id);
}

/*
 * get the previous scenes
 *
 * @return the array of the previous scenes
 */
Scene.prototype.getPreviousScenes = function() {
	return this.desc.prevs;
}

Scene.prototype.getBase = function() {
	var base;

	base = this.conf.protocol + "://" + this.conf.server;
	if (this.conf.port) {
		base = base + ":" + this.conf.port;
	}
	base += this.conf.rest;

	return base;
}

/*
 * Get all the URIs of the scene
 *
 * It returns the array of URIs in the scene.
 * An empty array is returned when no resource is assocaited
 * with the scene.
 */
Scene.prototype.getUrls = function() {
	var urls,
		base,
		paths;

	// construct the base part

	base = this.getBase();

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
		console.assert(false, 'Scene[paths] is not a function nor an array');
	}

	// concatenate 'base' + 'location'

	urls = paths.map(function(loc) {
		return (base + loc);
	});

	return urls;
}

/*
 * Get the URL of the next page
 *
 * When a scene is composed of multiple pages, the URLs to the resources
 * are not a priori. Each URL is computed from the resuls of the previous page.
 *
 * @param response This is passed as a last argument to the paths function of the scene.
 */
Scene.prototype.getUrl = function(response) {
	var url = null,
		base,
		path;

	// construct the base part

	base = this.getBase();

	// construct the path part

	var args = this.getPreviousScenes().map(function(scene) {
		return scene.resources;
	});

	if (response) {
		args.push(response);
	}

	path = this.desc.paths.apply(null, args);

	// concatenate 'base' + 'location'

	if (path) {
		url = base + path;
	}

	return url;
}

/*
 * Visit the scene URLs chaining one after another
 */
Scene.prototype.chain = function(arg, callback) {
	var url = this.getUrl(arg);

	console.log('chain : ' + url);

	if (url) {
		var that = this;

		var options = URL.parse(url);
		options.method = this.desc.method;
		options.auth = this.conf.username + ':' + this.conf.password;

		this.conf.ajax.request(options, function(res) {
			var raw = '';

			res.on('data', function(d) {
				raw += d;
			});
			res.on('end', function() {
				var data = JSON.parse(raw);

				var resources = that.desc.resources(data);
				resources.forEach(function(resource) {
		        	that.resources.push(resource);
	        	});

				that.persistence.write(resources);

				that.chain(data, callback);
			});
		})
		.on('error', function(e) {
			callback(e);
		})
		.end();
	} else {
		callback(null, this);
	}
}

/*
 * Visit the scene URLs one by one independently
 */
Scene.prototype.iterate = function(callback) {
	var urls = this.getUrls();

	if (urls.length === 0) {
		console.log('URLs = N/A');

		this.persistence.close();
		callback(null, this);
	} else {
		console.log('URLs = ' + urls);

		var nUrls = urls.length;
		var nWrittenResources = 0;

		urls.forEach(function(url, i) {
			console.log('query ' + url);

			var options = URL.parse(url);
			options.method = this.desc.method;
			options.auth = this.conf.username + ':' + this.conf.password;

			var that = this;
		    var raw = '';
		    
		    that.conf.ajax.request(options, function(res) {
		        res.setEncoding('utf-8');
		        res.on('data', function(d) {
		            raw += d;
		        });
		        res.on('end', function() {
		        	var data = JSON.parse(raw);

		        	var resources = that.desc.resources(data);
		        	that.resources.push.apply(that.resources, resources);

		        	that.persistence.write(resources);

		            if (--nUrls === 0) {
						console.log('End the scene, ' + that.id);
			            callback(null, that);
		        	}
		        });
		    })
	 		.on('error', function(e) {
		    	callback(e);
		    })
		    .end();
		}, this);
	}
}

/*
 * Run the scene under the scenario
 *
 * It visits all the URLs for the scene.
 *
 * This function is asynchronous. When the scene is played out, the @callback is invoked.
 * The 'result' parameter is the scene itself.
 *
 * The two run modes are supported, Chain and Iterate.
 * If all the URLs be constructed independently, visit them in an iteration mode.
 * Or, if the resources are paginated, a chaining mode comes into play. Visit an URL and construct
 * the next URL using the results of the visit.
 * 
 * @param callback(err, result)
 * @return the result of the scene
 */
Scene.prototype.run = function(callback) {
	console.log('Run the scene, ' + this.id);

	var that = this;

	if (typeof this.desc.paths === 'function'
		&& this.desc.paths.length > this.desc.prevs.length) {
		this.persistence.open();

		this.chain(null, function(err, res) {
			that.persistence.close();
			callback(err, res);
		});
	} else {
		this.persistence.open();

		this.iterate(function(err, res) {
			that.persistence.close();
			callback(err, res);
		});
	}
}

module.exports = Scene;
