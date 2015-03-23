/*
 * Scenario, Scenario controller/manager
 *
 * - repository specific
 */

var Scene = require('./scene');
var SceneGraph = require('./sceneGraph');

function Scenario(conf) {
	this.conf = conf;

	var repo = require('./repositories/' + conf.type);
	var scenario = repo.getScenario(conf); 

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
			var scene = new Scene(this.conf, this, sceneId, scenario[sceneId]);
			scenes.push(scene);
		}

		// use the object references instead of IDs
		scenes.forEach(function(scene, i, _scenes) {
			scene.desc.prevs.forEach(function(id, i, _prevs) {
				_prevs[i] = findScene(_scenes, id);
			});
		});

		this.conf.debug &&
			console.log('The %d scenes are loaded from the scenario.', scenes.length);

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
		console.log('run the scenario');

		var from = getIndependentScenes(this.scenes);

		this.sceneGraph.traverse(from, function(scene, _callback) {
			scene.run(_callback);
		}, function(err, results) {
			callback(err, results);
		});
	}
}

module.exports = Scenario;