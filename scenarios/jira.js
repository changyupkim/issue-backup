/*
 * Jira backup scenario
 *
 *
 */

var scenario = {
	"project" : {
		"prevs" : [],
		"method" : "GET",
		"names" : ["/project/"],
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
	}
};

module.exports.scenario = scenario;