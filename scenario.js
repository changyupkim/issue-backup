/*
 * Scenario, Scenario controller/manager
 *
 * - repository specific
 */

var Scene = require('./scene');
var SceneGraph = require('./sceneGraph');

function Scenario(conf, scenario) {
	this.conf = conf;
	this.scenes = loadScenes.call(this, scenario);
	this.sceneGraph = new SceneGraph(conf, this.scenes);

	function findScene(scenes, sceneId) {
		for (var i=0; i < scenes.length; i++) {
			if (scenes[i].id === sceneId) {
				return scenes[i];
			}
		}

		console.assert(false, 'The scene, ' + sceneId + ', is not found.');
	}

	/*
	 * Load the scenes described in the @scenario into the Scene objects
	 */
	function loadScenes(scenario) {
		var scenes = [];

		// construct the scene objects
		for (var sceneId in scenario) {
			// console.log('Load the scene, ' + sceneId);

			var scene = new Scene(this.conf, this, sceneId, scenario[sceneId]);
			scenes.push(scene);
		}

		// use the object references instead of IDs
		scenes.forEach(function(scene, i, _scenes) {
			scene.desc.prevs.forEach(function(id, i, _prevs) {
				_prevs[i] = findScene(_scenes, id);
			});
		});

		console.log(scenes.length + ' scenes are loaded.');

		return scenes;
	}

	/*
	 * get the scenes that do not have predecessors
	 *
	 */
	function getIndependentScenes(scenes) {
		var results = [];

		scenes.forEach(function(scene) {
			if (scene.desc.prevs.length === 0) {
				results.push(scene);
			}
		});

		return results;
	}

	/*
	 * run the scenario
	 */
	this.run = function(callback) {
		console.log('Run the scenario');

		var from = getIndependentScenes(this.scenes);

		// from[0].run();
		// return;

		this.sceneGraph.traverse(from, function(scene, _callback) {
			console.log('Visit the scene, ' + scene.id);

			scene.run(_callback);
		}, function(err, results) {
			console.log('End the traversal');
			
			callback(err, results);
		});
	}
}

module.exports = Scenario;