/*
 * Scene Graph
 *
 */

 function SceneGraph(conf, scenario) {
 	this.conf = conf;
 	this.scenario = scenario;
 	this.vertices = [];

	/* conver the scenario into a scene digraph */
	(function parse() {
		/* digraph representation as a adjacency list */
		var graph = {
			vertices : []
		};

		/* populate vertices in the graph */
		for (var sceneId in this.scenario) {
			console.log(sceneId);

			var vertex = {
				id : sceneId,
				edges : [],
				visited : false
			};

			this.vertices.push(vertex);
		}

		/* populate edges for the vertices */
		for (var sceneId in this.scenario) {
			this.scenario[sceneId].prevs.forEach(function(predecessor) {
				this.vertices.forEach(function(vertex) {
					if (vertex.id === predecessor) {
						vertex.edges.push(sceneId);
					}
				});
			});
		}

		// console.log('%j', graph);
		console.log('graph = ' + JSON.stringify(this.graph, null, 2));
	}());

	/* set the result of a scene playing */
	function setResult(result) {}

	/* get the result of a scene playing */
	function getResult(sceneId) {}

	/* search the graph and return the matched vertex */
	function search(from, match) {
		return ;
	}

	/*
	 * traverse the graph in a breadth-first manner
	 *
	 * The @visit function passes the array of resources obtained from a scene to its callback.
	 * A resource is {
	 *	uri : (String),
	 *	contents : (JSON) 
	 * }
	 *
	 * @param from	array of vertices to start traversing from
	 * @param visit function to execute on a each vertex
	 * @param callback function to be called when the traversal finishes
	 */
	function traverse(from, visit, callback) {
		var results = {}; // collection of what the visitor returns at each vertex
		var queue = from;

		
		var first = queue.shift();	// first vertex to visit

		visit(first, function _callback(err, resources) {
			if (err) {
				throw err;
			}

			first.visited = true;
			resources.forEach(function(resource) {
				results[resource.uri] = resource.contents;
			});

			first.edges.forEach(function(successor) {
				var predecessors = search(from, function(v) {
					if (v.edges.indexOf(successor) === -1) {
						return false;
					} else {
						console.assert(v.edges.indexOf(successor) >= 0);
						return true;
					}
				});

				if (predecessors.every(function(predecessor) {
					return predecessor.visited === true;
				})) {
					queue.push(successor);
				}

				if (queue.length > 0) {
					var next = queue.shift();
					visit(next, _callback);
				} else {
					callback();
				}
			});
		});

	}
 }

 module.exports.SceneGraph = SceneGraph;