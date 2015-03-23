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

		console.assert(queue.length > 0);

		var scene = queue.shift();
		
		visit(scene, function cb(err, result) {
			if (err) {
				throw err;
			}

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

			if (queue.length > 0) {
				var next = queue.shift();
				visit(next, cb);
			} else {
				callback(err, results);
			}
		});
	}
 }

 module.exports = SceneGraph;