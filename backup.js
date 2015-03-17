var path = require('path');
var http = require('http');
var https = require('https');
var fs = require('fs');
var GetOpt = require('node-getopt');

var Scenario = require('./scenario');

/*
 * Check the connection
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
        auth: conf.username + ':' + conf.password,
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

/*
 * Check the Jira version
 *
 * TODO: Verify that the Jira version is supported
 *	- needs to persist the serverInfo into server_info.json
 */
function checkJiraVersion(conf, callback) {
	var repo = require('./repositories/jira');
	var supported = repo.getSupportedVersions();

	var options = {
		host: conf.server,
        port: conf.port,
        path: conf.rest + "/serverInfo",
        method: "GET",
        auth: conf.username + ':' + conf.password,
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

			console.info(info);

			if (true === supported.some(function(v) {
				return v.test(version);
			})) {
				console.info('supported version, ' + version);

				var fpath = path.join(conf.dest, 'server_info.json');
				console.info(fpath);

				var fd = fs.openSync(fpath, 'w');
				if (fd < 0) {
					var e = new Error('could not open, ' + fpath);
					callback(e);
				} else {
					fs.writeSync(fd, data);
					fs.closeSync(fd);

					callback(null);
				}
			} else {
				var e = new Error('not supported version, ' + version);
				callback(e);
			}
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

/*
 * Check the repository version
 */
function checkVersions(conf, callback) {
	if (conf.type === "jira") {
		checkJiraVersion(conf, callback);
	} else {
		// The type of the repository is checked beforehand.
		console.assert(false);
	}
}

/*
 * check the server
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
		})
	});
}

/*
 * usage:
 *	node backup -c <configuration file> DEST
 */
function backup() {
	var conf,
		dest,
		repo;

	/* parse the command line */

	var getopt = new GetOpt([
		['c', '=', 'configuration file'],
		['h', '', 'display this help']
	]);

	getopt.setHelp(
		"USAGE: node backup.js OPTIONS DEST\n"
		+ "\tDEST\n"
		+ "\t\tdestination directory in the local filesystem where the backup copies are saved."
		+ "\t\tIt should be present to run the backup.\n"
		+ "\tOPTIONS\n"
		+ "\t\t-c FILE, configuration file (mandatory)\n"
		+ "\t\t-h, display this help\n"
		+ "\tEXAMPLES\n"
		+ "\t\tnode backup.js -c config.json backup\n"
		+ "\t\tnode backup.js -h\n"
	);

	var opt = getopt.parseSystem();

	if (opt.options.h === true) {
		getopt.showHelp();

		return 0;
	}

	if (!opt.options.c || opt.argv.length !== 1) {
		getopt.showHelp();

		return 1;
	}

	conf = require(path.resolve(opt.options.c));
	dest = path.resolve(opt.argv[0]);

	/* configure */

	conf.dest = dest;

	switch(conf.type) {
	case 'jira':
		repo = require('./repositories/jira');
		break;
	default :
		console.assert(false, 'unsupported repository type, ' + conf.type);
	}

	console.log("Back up the " + conf.project + ' project');

	if (conf.protocol === 'http') {
		conf.ajax = http;
	} else if (conf.protocol === 'https') {
		conf.ajax = https;
	} else {
		console.error(conf.protocol + ' is not a supported protocol.');
		return;
	}

	/* run the backup */

	check(conf, function(err) {
		if (err) {
			throw err;
		}

		var scenario = new Scenario(conf, repo.getScenario(conf));
		scenario.run(function(err, results) {
			if (err) {
				throw err;
			}

			console.log('Backup is done.');
			console.log(results);
		});
	});
}

backup();

