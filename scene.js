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
 * Query the URL and get the next URL from the results successivley
 *
 * This run mode is appropriate to query the paginated resources for the scene.
 */
Scene.prototype.chain = function(arg, callback) {
	var url = this.getUrl(arg);

	if (url) {
		var options = URL.parse(url);
		options.method = this.desc.method;
		options.auth = this.conf.username + ':' + this.conf.password;

		this.conf.debug &&
			console.log('at the chain, %s, in the scene', options.path);

		var that = this;
		this.conf.ajax.request(options, function(res) {
			var raw = '';

			res.on('data', function(d) {
				raw += d;
			});
			res.on('end', function() {
				var data = JSON.parse(raw);

				that.conf.debug &&
		        		console.log({url: options.path, contents: data});

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
		this.conf.debug &&
			console.log('at the end of chain in the scene');

		callback(null, this);
	}
}

/*
 * Get all the URLs for the scene and query them independently
 */
Scene.prototype.iterate = function(callback) {
	var urls = this.getUrls();

	this.conf.debug &&
		console.log('iterate %d url(s) in the scene', urls.length);

	if (urls.length === 0) {
		this.persistence.close();
		callback(null, this);
	} else {
		var nUrls = urls.length;
		var nWrittenResources = 0;

		urls.forEach(function(url, i) {
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

		        	that.conf.debug &&
		        		console.log({url: options.path, contents: data});

		        	var resources = that.desc.resources(data);
		        	that.resources.push.apply(that.resources, resources);

		        	that.persistence.write(resources);

		            if (--nUrls === 0) {
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
 * the next URL using the results of the previous visit.
 * 
 * @param callback(err, result)
 * @return the result of the scene
 */
Scene.prototype.run = function(callback) {
	console.log('run the scene, ' + this.id);

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
