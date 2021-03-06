# The issue backup utility

A user can download a project data from an issue repository. 


# Purposes

The issue management plays a critical role to manage a project. Various kinds of issue repositories are present and used.

One can download all the data of a project.


# Terms

- (issue) repository : issue management system. Jira, BitBucket, GitHub, Trac, Redmine, etc.
- project : A repository usually hosts mulitple projects. A user posts an issue for a project.


# Features

- A user can download the project data from a repository.
- A user need not have an admistrator's account to the repository. Only the read access to the repository or proejct is required.
- This program runs in the node.js environment.
- The backup copies are saved onto the local files in JSON format.
- The project data is retrieved from the repository via its REST APIs.


# Usages

Download this code base. And type this in the command line.

> node backup -f _FILE_ _DEST_

- FILE is the configuration file (.json) in which a user sets up the repository and project to back up. See the 'Configuration file' section of this document for the details.
- DEST is the local filesystem directory to which the data from the repository is stored.

For example, the backup target is configured in _config_jira_projA.json_. And the backup artifacts will be found under the _./jira_projA_ directory.

> node backup -f _config_jira_projA.json_ _./jira_projA_


# Configuration file

A user need to give information on the repository and project to back up. 

As in the 'config_example.json', it's a JSON file with the '.json' file extension.

The configuration items are as follows.

- type : a type of the repository like 'jira', 'bitbucket', 'github', 'trac', 'redmine', etc. Currently, 'jira' is only the valid value.
- protocol : 'http' or 'https'
- server : host name or IP address of the repository
- port : port number of the repository (Optional)
- rest : path to the REST API of the repository. For Jira, it's usually _/rest/api/latest_.
- username : user name of an account to the repository (Optional)
- password : password of an account to the repository (Optional)
- project : project ID

If no authentication is required to use the REST APIs, you don't need to set the _username_ and _password_.

For example, the configuration file for the Apache Spark project looks as this. No authentication is required to access the REST API.

```
{
	type : 'jira',
	protocol : 'https',
	server : 'issues.apache.org',
	rest : '/jira/rest/api/latest/',
	project : 'SPARK'
}
```


# Output

Once the backup is done, you can see the files under the DEST directory.

The files are formated in JSON. They contains different types of data - backup statistics, backup metadata, repository data, project data, and so on. Each file holds specific type of data.


```
DEST/
	server_info.json
	project.json
	issues.json
	component.json
	...
```

Some of the files contain an array of resources which are retrieved from the repository. A single resource is structured as this.

```
{
	url : (URL of the resource/data),
	contents : (data queried againt the URL)
}
```


# Debugging and reporting

When something went wrong, run the backup in the debug mode.

> node.js backup.js -f _FILE_ -d _DEST_

Capture the logs and report the issue in https://github.com/changyupkim/issue-backup/issues.


# Supported repositories

Currently, Jira is supported and tested against these versions only.

- 5.0.5
- 6.3.4
- 6.3.13

Please report me if you've found something.


# Internals

For the details, see the wiki documents in https://github.com/changyupkim/issue-backup/wiki.

# License

[MIT](LICENSE)

# Author

Changyup Kim

# Changlogs

### 0.1.0 (initial)
* The new resources includes server info, issues, project and components.