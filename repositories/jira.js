/*
 * Jira backup scenario
 *
 * A scenario has scenes to play. All scenes have previous scenes except the first scenes.
 * A scene is either plural or singular. A plural scene represents multipe resources while
 * a singular one is associated with only one resource.
 *
 * Each resource is represented as this form
 *	{ uri: (String), content: (Object)}
 * 
 * To get all the resources in this scene, one must visit/query all the URLs in @paths.
 * To construct the URLs, it might need the resources in other scenes. The dependencies
 * are described in @prevs.
 * One could discover all the URLs at once as a priori. Or, they are discovered successively
 * by visiting an URL and computing the next URL with the results of the visit.
 *
 * The @resouces function retrieves an array of resources from a query result.
 *
 * The @paths could be one of the forms.
 *	1. a static array of URLs
 *	2. a function that takes the scene dependency and returns a static array
 *	3. a function that takes the scene dependency and the response of the previous URL
 *					and returns the next URL to visit
 *
 * @prevs : array of dependent scenes
 * @method : query method
 * @paths : URLs to query to get all the resources assocated with this scene
 * @data : post data, available when @method is POST
 * @pre : pre-condition
 * @post : post-condition
 * @resources : a function to get an array of the resources from the results of a single query
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
			"paths" : function(project, response) {
				var path = "/search?jql=project=" + conf.project + "&fields=*all";
				if (response) {
					if ((response.startAt + response.maxResults) < response.total) {
						path = path + "&startAt=" + (response.startAt + response.maxResults);
					} else {
						// It was the last page.
						path = null;
					}
				}
				return path;
			},
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

/*
 * Jira versions
 */
function getSupportedVersions() {
	var versions = [/5\..+\..+/, /6\..+\..+/];

	return versions;
}


module.exports.getScenario = getScenario;
module.exports.getSupportedVersions = getSupportedVersions;