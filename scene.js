/*
 * SceneCon, Scene controller/manager
 *
 * - Repository specific
 */

function SceneCon(conf) {
	this.conf = conf;

	/* Run the scene asynchronously
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
	this.run = function(scene, args) {
		var uris = this.getUri(scene, args);

		
	}

	/* Get the URI of the scene
	 *
	 * returns the array of URIs
	 */
	this.getUri = function(scene, args) {
		var uris;

		// construct the base part of the URI

		var base = this.conf.protocol + "://" + this.conf.server;
		if (this.conf.port) {
			base = base + ":" + this.conf.port;
		}
		base += this.conf.rest;


		// construct the API part of the URI

		var apis;

		if (typeof scene.apis === 'function') {
			apis = scene.apis(args);
		} else if (scene.apis instanceof Array) {
			apis = scene.apis.slice();
		} else {
			throw new Error('Scene[apis] is not a function nor an array');
		}

		uris = apis.map(function(api, i) {
			var uri = base + api;
			if (scene.params[i]) {
				uri = uri + "?" + scene.params[i];
			}

			return uri;
		});

		return uris;
	}
}

// moduile.exports.run = run;
moduile.exports.SceneCon = SceneCon;
