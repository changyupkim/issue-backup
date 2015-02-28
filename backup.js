var path = require('path');
var http = require('http');
var https = require('https');
var fs = require('fs');
var ajax;
var jira = require('./scenarios/jira');
var config;

/* get the scenes that do not need prerequisite ones */
function getIndependentScenes(scenario) {
	var scenes = [];

	for (var scene in scenario) {
		if (scenario[scene].prevs.length === 0) {
			scenes.push(scene);
		}
	}

	console.log('independent scenes : ' + scenes);

	return scenes;
}

/*************** parser *******************/
// Scenario parser
// - repository specific

/*
 * parse the scenario into a graph 
 *
 * Refer https://gist.github.com/kevinfjbecker/1524215.
 */
function parse(scenario) {
	/* digraph representation as a adjacency list */
	var graph = {
		vertices : []
	};

	/* populate vertices in the graph */
	for (var sceneId in scenario) {
		console.log(sceneId);

		var vertex = {
			id : sceneId,
			edges : []
		};

		graph.vertices.push(vertex);
	}

	/* populate edges for the vertices */
	for (var sceneId in scenario) {
		scenario[sceneId].prevs.forEach(function(parent) {
			graph.vertices.forEach(function(v) {
				if (v.id === parent) {
					v.edges.push(sceneId);
				}
			});
		});
	}

	// console.log('%j', graph);
	console.log('graph = ' + JSON.stringify(graph, null, 2));

	return graph;
}

/********************* digraph **************************/

/*
 * Breadth-first search the graph
 *
 * @param root	array of independent scenes' IDs
 */
function bfs(graph, root, callback) {
	var output = {}; // collection of what callback returns at each vertex
	var bitmap = {}; // mark if the vertex is visited
	var queue = root;

	while(queue.length > 0) {
		var v = queue.shift();

		var o = callback(v);
		output[o.uri] = o.resource;
		bitmap[v] = true;

		var successors = getSuccessors(graph, v);
		successors.forEach(function(successor) {
			var predecessors = getPredecessors(graph, successor);
			if (predecessors.every(function(e) {
				return bitmap[e] === true;
			})) {
				queue.push(successor);
			}
		});
	}
}

/* get the predecessors of the @vertex in the directed @graph
 *
 * @param vetex ID of a vetex  
 */
function getPredecessors(graph, vertex) {
	var predecessors = [];

	graph.vertices.forEach(function(v) {
		if (v.edges.indexOf(vertex) !== -1) {
			predecessors.push(v.id);
		}
	});

	return predecessors;
}

/* get the successors of the @vertex in the directed @graph
 *
 * @param vetex ID of a vetex
 */
function getSuccessors(graph, vertex) {
	var successors = [];

	graph.vertices.forEach(function(v) {
		if (v.id === vertex) {
			successors = v.edges.slice();
		}
	});

	return successors;
}

/********************* back up **************************/


/*
 * Check the connection
 */
function checkConn(callback) {
	var options = {
		host: config.server,
        port: config.port,
        path: config.rest + "/project",
        method: "HEAD",
        auth: config.username + ':' + config.password,
	};

	var req = ajax.request(options, function(res) {
		if (res.statusCode === 200) {
			console.log('The connection to ' + options.host + ' is confirmed.');
			callback(null);
		} else {
			callback(new Error('connection eror'));
		}
	});
	req.on('error', function(e) {
		callback(e);
	});
	req.end();
}

/*
 * Run the given scene in a synchronous fashion
 */
function runScene(scene) {
}

/*
 * Run the given backup scenario
 */
function runScenario(scenario) {
	console.log('Run the scenario');

	var graph = parse(scenario);

	// var root = [];
	// for (var sceneId in scenario) {
	// 	if (scenario[sceneId].prevs.length === 0) {
	// 		root.push(sceneId);
	// 	}
	// }

	var root = getIndependentScenes(scenario);
	var output = bfs(graph, root, function(v) {
		console.log('Visit ' + v);

		var scene = scenario[v];
		var result = runScene(scene);

		return {
			uri : v,
			resource : "bar"
		};
	});

	console.log(JSON.stringify(output, null, 2));
}

/*
 * usage:
 *	backup <configuration file>
 */
function backup() {
	var argv = process.argv.splice(2);
	var argc = argv.length;

	if (argc === 0) {
		config = require('./config');
	} else if (argc === 1) {
		config = require(path.resolve(argv[0]));
	} else {
		console.error('invalid number of arguments, ' + argc);
	}

	console.log("Back up the " + config.project + ' project.');

	if (config.protocol === 'http') {
		ajax = http;
	} else if (config.protocol === 'https') {
		ajax = https;
	} else {
		console.error(config.protocol + ' is not a supported protocol.');
		process.exit(1);
	}

	checkConn(function(err) {
		if (err) {
			throw err;
		}

		runScenario(jira.scenario);
	});
}

backup();

