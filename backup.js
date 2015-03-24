var path = require('path');
var http = require('http');
var https = require('https');
var fs = require('fs');
var GetOpt = require('node-getopt');
var Scenario = require('./scenario');

/**
 * Check the connection to the repository
 *
 * @param callback(Error e)
 * @return Any error is returned to its caller via the @callback function.
 */
function checkConnections(conf, callback) {
	var options = {
		host: conf.server,
        port: conf.port,
        path: conf.rest + "/project",
        method: "HEAD",
        auth: conf.username && conf.username + ':' + conf.password
	};

	var req = conf.ajax.request(options, function(res) {
		if (res.statusCode === 200) {
			callback(null);
		} else {
			var e = new Error('ajax EBADRESPONSE');
			e.server = options.host;
			e.port = options.port;
			e.path = options.path;
			e.statusCode = res.statusCode;

			callback(e);
		}
	});
	req.on('error', function(e) {
		e.server = conf.server;
		e.port = conf.port;
		e.path = options.path;

		callback(e);
	});
	req.end();
}

/**
 Checks the Jira version
 */
function checkJiraVersion(conf, callback) {
	var repo = require('./repositories/jira');
	var supported = repo.getSupportedVersions();

	var options = {
		host: conf.server,
        port: conf.port,
        path: conf.rest + "/serverInfo",
        method: "GET",
        auth: conf.username && conf.username + ':' + conf.password
	};

	var data = '';
	conf.ajax.request(options, function(res) {
		res.setEncoding('utf-8');
		res.on('data', function(d) {
			data += d;
		});
		res.on('end', function() {
			var info = JSON.parse(data);
			var version = info.version;

			conf.debug && console.log({url : options.path, contents : info});

			//NOTE: The 'supported' is actually the list of tested versions.
			// If the repo is not on the list, just keep going.

			// if (true === supported.some(function(v) {
			// 	return v.test(version);
			// })) {
				var fpath = path.join(conf.dest, 'server_info.json');
				var fd = fs.openSync(fpath, 'w');
				if (fd < 0) {
					var e = new Error('could not open, ' + fpath);
					callback(e);
				} else {
					console.log('write the server information to %s', fpath);

					fs.writeSync(fd, data);
					fs.closeSync(fd);

					callback(null);
				}
			// } else {
			// 	var e = new Error('not supported version, ' + version);
			// 	callback(e);
			// }
		});
	})
	.on('error', function(e) {
		e.server = conf.server;
		e.port = conf.port;
		e.path = options.path;

		callback(e);
	})
	.end();
}

/**
 Checks the type and version of the repository
 */
function checkVersions(conf, callback) {
	if (conf.type === "jira") {
		checkJiraVersion(conf, callback);
	} else {
		// The type of the repository is checked beforehand.
		console.assert(false);
	}
}

/**
 Checks the server (repository) if it's a proper target for backup
 */
function check(conf, callback) {
	checkConnections(conf, function(err, results) {
		if (err) {
			callback(err);
		}

		checkVersions(conf, function(err, results) {
			if (err) {
				callback(err);
			}

			callback(null);
		});
	});
}

/**
 * main routine
 */
function backup() {
	var conf,
		dest,
		repo;

	/* parse the command line */

	var getopt = new GetOpt([
		['f', '=', 'configuration file'],
		['d', '', 'debug mode'],
		['h', '', 'display this help']
	]);

	getopt.setHelp(
		"USAGE: node backup.js OPTIONS DEST\n"
		+ "\tDEST\n"
		+ "\t\tdestination directory in the local filesystem where the backup copies are saved."
		+ "\t\tIt should be present to run the backup.\n"
		+ "\tOPTIONS\n"
		+ "\t\t-f FILE, configuration file\n"
		+ "\t\t-d, print debug messages\n"
		+ "\t\t-h, display this help\n"
		+ "\tEXAMPLES\n"
		+ "\t\tnode backup.js -f config.json backup\n"
		+ "\t\tnode backup.js -f config.json -d backup\n"
		+ "\t\tnode backup.js -h\n"
	);

	var opt = getopt.parseSystem();

	if (opt.options.h === true) {
		getopt.showHelp();

		return 0;
	}

	if (!opt.options.f || opt.argv.length !== 1) {
		getopt.showHelp();

		return 1;
	}

	/* preprocess the command options */

	try {
		conf = require(path.resolve(opt.options.f));
	} catch(e) {
		throw(e);
	}

	dest = path.resolve(opt.argv[0]);
	try {
		fs.mkdirSync(dest);
	} catch(e) {
		if (e.code === 'EEXIST') {
			console.assert(fs.statSync(dest).isDirectory(),
				'The DEST, %s, should be a directory.', dest);
		} else {
			throw(e);
		}
	}

	if (opt.options.d === true) {
		conf.debug = true;
	} else {
		conf.debug = false;
	}

	/* configure */

	conf.dest = dest;

	switch(conf.type) {
	case 'jira':
		break;
	default :
		console.assert(false, 'unsupported repository type, ' + conf.type);
	}

	console.log("back up the " + conf.project + ' project');

	if (conf.protocol === 'http') {
		conf.ajax = http;
	} else if (conf.protocol === 'https') {
		conf.ajax = https;
	} else {
		console.error(conf.protocol + ' is not a supported protocol.');
		return 1;
	}

	/* run the backup */

	check(conf, function(err) {
		if (err) {
			console.error(err);
			throw err;
		}

		var scenario = new Scenario(conf);
		scenario.run(function(err, results) {
			if (err) {
				console.error(err);
				throw err;
			}

			console.log('Backup is done.');
			// conf.debug && console.log(results);
		});
	});
}

backup();

