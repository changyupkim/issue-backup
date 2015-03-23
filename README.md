# The issue backup utility

A user can download issue data from an issue repository. 


# Purposes

The issue management plays a critical role in managing a project. Various kinds of issue repositories are present and used.

One can download the issues posted into a project for later use.


# Terms

- (issue) repository : issue management system. Jira, BitBucket, GitHub, Trac, Redmine, etc.
- project : A repository usually hosts mulitple projects. A user posts an issue for a project.


# Features

- A user can download the project's issue data from a repository.
- A user need not have an admistrator's account to the repository. Only the read access to the repository/proejct is required.
- This program runs in the node.js environment.
- The backup copies are saved onto the local files in JSON format.
- The issue data is retrieved from the repository via its REST APIs.


# Usages

Download this code base. And type in the following command.

> node.js backup.js -f FILE DEST

- FILE is the configuration file (.json) in which a user sets up the repository and project to back up. See the 'Configuration file' section of this document for the details.
- DEST is the local filesystem directory to which the data in the repository is stored.

For example, the backup target is configured in 'config_jira_projA.json'. And the backup artifacts will be found under the './jira_projA' directory.

> node.js backup.js -f config_jira_projA.json ./jira_projA


# Configuration file

A user need to give information on the repository and project to back up. 

As in the 'config_example.json', it's a JSON file with the '.json' file extension.

The configuration items are as follows.

- type : a type of the repository like 'jira', 'bitbucket', 'github', 'trac', 'redmine', etc. Currently, 'jira' is only the valid value.
- protocol : 'http' or 'https'
- server : host name or IP address of the repository
- port : port number of the repository
- rest : path to the REST API of the repository
- username : user name of an account to the repository
- password : password of an account to the repository
- project : project ID


# Output

Once the backup is done. You can see the files under the DEST directory.

DEST/
	

# Debugging and reporting

When something went wrong, run the backup in the debug mode.

> node.js backup.js -f FILE -d DEST

Capture the logs and report the issue in https://github.com/changyupkim/issue-backup/issues.


# Supported repositories

Currently, Jira is supported and tested against these versions only.

- 5.0.5
- 6.3.13

Please report me if you've found something.


# Internals

For the details, see the wiki documents in https://github.com/changyupkim/issue-backup/wiki.
