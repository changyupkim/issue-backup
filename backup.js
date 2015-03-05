var path = require('path');
var http = require('http');
var https = require('https');
var fs = require('fs');
var Scenario = require('./scenario');

/*
 * Check the connection
 *
 * @param callback(Error e)
 * @return Any error is returned to its caller via the @callback function.
 */
function checkConn(conf, callback) {
	var options = {
		// host: '192.168.0.16',
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
 * usage:
 *	backup <configuration file>
 */
function backup() {
	var conf,
		repo;

	/* set up for backup */

	var argv = process.argv.splice(2);
	var argc = argv.length;

	if (argc === 0) {
		conf = require('./conf');
	} else if (argc === 1) {
		conf = require(path.resolve(argv[0]));
	} else {
		console.error('invalid number of arguments, ' + argc);
	}

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

	checkConn(conf, function(err) {
		if (err) {
			console.log('Access to the project in the issue repository is not verified.');
			console.log(err);
			return;
		}

		console.log('Access to the project in the issue repository is verified.');

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

