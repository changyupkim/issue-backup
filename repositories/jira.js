/*
 * Jira backup scenario
 *
 * A scenario has scenes to play. All scens have previous scenes except the first scenes.
 * A scene is either plural or singular. A plural scene represents multipe resources while
 * a singular one is associated with only one resource.
 *
 * To query a resource in a scene, one need to know its URI, query method and parameter.
 * To construct the query, it might depend on other resources. The dependency is specified
 * by the @prevs property.
 *
 * The @prevs has an array of the dependent scenes. The resources found in the dependent scens 
 * are utilized to construct the query in a scene.
 *
 * @method : query method
 * @names : array of resrouce names
 * @params : array of query parameters
 */

// var scenario = {
function getScenario(conf) {
	return {
		"project" : {
			"prevs" : [],
			"method" : "GET",
			"names" : ["/project/" + conf.project],
			"params" : [""],
			"pre" : [],
			"post" : []
		},
		"components" : {
			"prevs" : ["project"],
			"method" : "GET",
			"names" : function(project) {
				// var uris = Object.keys(project);
				// var apis = project[uris[0]].components.map(function(elm) {
				// 	return "/component/" + elm.id;
				// });
				var names = project[0].contents.components.map(function(e) {
					return '/component/' + e.id;
				});
				return names;
			},
			"params" : function(project) {
				// var uris = Object.keys(project);
				// var params = project[uris[0]].components.map(function(elm) {
				// 	return "";
				// });
				var params = project[0].contents.components.map(function(e) {
					return '';
				});
				return params;
			},
			"pre" : [
				{
					"project" : function(res) {
						return (res.statusCode === 200);
					}
				}
			],
			"post" : [],
		},
		// "issues" : {
		// 	"prevs" : ["project"],
		// 	"method" : "GET",
		// 	"names" : ["/search?jql=project=" + conf.project],
		// 	"params" : [],
		// 	"pre" : [],
		// 	"post" : []
		// }
	};
}
// };

// module.exports.scenario = scenario;
module.exports.getScenario = getScenario;