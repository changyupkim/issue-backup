/*
 * ScenarioCon, Scenario controller/manager
 *
 * - repository specific
 */

function ScenarioCon(conf, scenario) {
	this.conf = conf;
	this.scenario = scenario;
	this.sceneCon = new SceneCone(conf);
	this.graph = new SceneGraph(conf, scenario);

	/* get the scenes that do not have predecessors
	 *
	 * returns the array of scene IDs
	 */
	function getIndependentScenes {
		var scenes = [];

		for (var scene in this.scenario) {
			if (this.scenario[scene].prevs.length === 0) {
				scenes.push(scene);
			}
		}

		console.log('independent scenes : ' + scenes);

		return scenes;
	}

	/* get the scene of @sceneId ID */
	// this.getScene = function(sceneId) {
	// 	return this.scenario[sceneId];
	// }

	/* run the scenario */
	this.run = function() {
		console.log('Run the scenario');

		var root = getIndependentScenes(this.scenario);
		var output = bfs(graph, root, function(v) {
			console.log('Visit ' + v);

			var scene = this.scenario[v];
			var pred = this.sceneCon.getPrecessors(scene);
			// var uris = this.sceneCon.getUri(scene, );
			var result = this.sceneCon.run(scene);

			return {
				uri : v,
				resource : "bar"
			};
		});

		console.log(JSON.stringify(output, null, 2));

		return output;
	}
}

// module.exports.getIndependentScenes = getIndependentScenes;
// module.exports.getScene = getScene; = getIndependentScenes;
module.exports.ScenarioCon = ScenarioCon;