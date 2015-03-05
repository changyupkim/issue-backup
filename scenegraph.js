/*
 * Scene Graph
 *
 * It's a digraph.
 * - The vertices of the graph are the Scene objects. 
 * - The edges of a vertex are embedded in the Scene object.
 */
 function SceneGraph(conf, scenes) {
 	this.conf = conf;
 	this.scenes = scenes;

	/* populate edges for the vertices */
	this.scenes.forEach(function(scene) {		
		scene.desc.prevs.forEach(function(prev) {
			prev.edges.push(scene);
		});
	});

	/*
	 * traverse the graph in a breadth-first manner
	 *
	 * The @visit function is of the form, visit(vertex, callback).
	 *	vertex : the vertex object
	 *	callback : The visit function calls when its business is done.
	 * 
	 * The @visit function passes the array of resources obtained from a scene to its callback.
	 * A resource format is as follows.
	 *	{
	 *		uri : (String),
	 *		contents : (JSON) 
	 *	}
	 *
	 * The @callback is passed in two arguments.
	 *	err
	 *	result : collection of all the resources that the @visit function has found
	 *
	 * @param from	array of vertices to start traversing from
	 * @param visit function to execute on a each vertex
	 * @param callback function to be called when the traversal finishes
	 */
	this.traverse = function(from, visit, callback) {
		var results = [];
		var queue = from.slice();

		console.log('traversal queue length = ' + queue.length);
		console.assert(queue.length > 0);

		var scene = queue.shift();
		console.log('queue lenth = ' + queue.length);
		
		visit(scene, function cb(err, result) {
			if (err) {
				throw err;
			}

			console.log('The scene, ' + result.id + ', is done.');

			result.resources.forEach(function(resource) {
				results.push(resource);
			});

			result.visited = true;

			result.edges.forEach(function(successor) {
				var predecessors = successor.desc.prevs;
				if (predecessors.every(function(predecessor) {
					return predecessor.visited === true;
				})) {
					queue.push(successor);
				}
			});

			console.log(queue.length);

			if (queue.length > 0) {
				var next = queue.shift();
				visit(next, cb);
			} else {
				console.log('No more scene is left in the queue.');
				callback(err, results);
			}
		});
	}

	this.traverse2 = function(from, visit, callback) {
		var results = [];
		var queue = from.slice();

		console.log('queue lenth = ' + queue.length);
		console.assert(queue.length > 0);

		var scene = queue.shift();
		console.log('queue lenth = ' + queue.length);
		
		visit(scene, function cb(err, result) {
			if (err) {
				throw err;
			}

			console.log('The scene, ' + scene.id + ', is done.');

			results.push(result);

			scene.visited = true;

			scene.edges.forEach(function(successor) {
				var predecessors = successor.desc.prevs;
				if (predecessors.every(function(predecessor) {
					return predecessor.visited === true;
				})) {
					queue.push(successor);
				}
			});

			console.log(queue.length);

			if (queue.length > 0) {
				var next = queue.shift();
				console.log('dequeued ' + next.id);
				console.log(queue.length);
				// visit(queue.shift(), cb);
				visit(next, cb);
			} else {
				console.log('No more scene is left in the queue.');
				callback(err, results);
			}
		});
	}

	this.traverse1 = function(from, visit, callback) {
		var results = {}; // collection of what the visitor returns at each vertex
		var queue = from;
		
		while (queue.length > 0) {
			var scene = queue.shift();	// first vertex to visit

			visit(scene);
			scene.visited = true;

			scene.edges.forEach(function(successor) {
				var predecessors = successor.desc.prevs;
				if (predecessors.every(function(predecessor) {
					return predecessor.visited === true;
				})) {
					queue.push(successor);
				}
			});
		}

		// visit(first, function _callback(err, resources) {
		// 	if (err) {
		// 		throw err;
		// 	}

		// 	first.visited = true;
		// 	resources.forEach(function(resource) {
		// 		results[resource.uri] = resource.contents;
		// 	});

		// 	first.edges.forEach(function(successor) {
		// 		var predecessors = search(from, function(v) {
		// 			if (v.edges.indexOf(successor) === -1) {
		// 				return false;
		// 			} else {
		// 				console.assert(v.edges.indexOf(successor) >= 0);
		// 				return true;
		// 			}
		// 		});

		// 		if (predecessors.every(function(predecessor) {
		// 			return predecessor.visited === true;
		// 		})) {
		// 			queue.push(successor);
		// 		}

		// 		if (queue.length > 0) {
		// 			var next = queue.shift();
		// 			visit(next, _callback);
		// 		} else {
		// 			callback(err, results);
		// 		}
		// 	});
		// });
	}
 }

 module.exports = SceneGraph;