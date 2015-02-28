//
// Jira backup scenario
//

var scenario = {
	"project" : {
		"prevs" : [],
		"method" : "GET",
		"apis" : ["/project/KEY"],
		"params" : [""],
		"pre" : [],
		"post" : []
	},
	"components" : {
		"prevs" : ["project"],
		"method" : "GET",
		"apis" : function(project) {
			var apis = project.components.map(function(elm) {
				return "/component/" + elm.id;
			});
			return apis;
		},
		"params" : function(project) {
			var params = project.components.map(function(elm) {
				return "";
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