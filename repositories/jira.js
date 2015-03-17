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
 * @prevs : array of preceding scenes
 * @method : query method
 * @paths : array of URL paths to query in this scene
 * @data : post data
 * @pre : pre-condition
 * @post : post-condition
 * @resources : extracts the resources in the results of a single query
 */

function getScenario(conf) {
	return {
		"project" : {
			"prevs" : [],
			"method" : "GET",
			"paths" : ["/project/" + conf.project],
			"data" : [""],
			"pre" : [],
			"post" : [],
			"resources" : function(response) {
				return [{
					"uri" : response.self,
					"contents" : response
				}];
			}
		},
		"components" : {
			"prevs" : ["project"],
			"method" : "GET",
			"paths" : function(project) {
				var paths = project[0].contents.components.map(function(e) {
					return '/component/' + e.id;
				});
				return paths;
			},
			"data" : [],
			"pre" : [
				{
					"project" : function(res) {
						return (res.statusCode === 200);
					}
				}
			],
			"post" : [],
			"resources" : function(response) {
				return [{
					"uri" : response.self,
					"contents" : response
				}];
			}
		},
		"issues" : {
			"prevs" : ["project"],
			"method" : "GET",
			"paths" : ["/search?jql=project=" + conf.project + "&fields=*all"],
			"data" : [],
			"pre" : [],
			"post" : [],
			"resources" : function(response) {
				return response.issues.map(function(issue) {
					return {
						uri : issue.self,
						contents : issue
					}
				});
			}
		}
	};
}

function getSupportedVersions() {
	var versions = [/5\..+\..+/, /6\..+\..+/];

	return versions;
}


module.exports.getScenario = getScenario;
module.exports.getSupportedVersions = getSupportedVersions;