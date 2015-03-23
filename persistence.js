/*
 * Persistence for the resources of a scene
 */

var path = require('path');
var fs = require('fs');

/*
 * @param scene ID of a scene
 */
function Persistence(conf, scene) {
	this.conf = conf;
	this.path = path.join(conf.dest, scene + '.json');
	this.fd = null;
	this.nResources = 0;
	this.nBytes = 0;
}

Persistence.prototype.open = function() {
	console.assert(this.fd === null, 'The file is already open.');

	this.fd = fs.openSync(this.path, 'w');
	fs.writeSync(this.fd, '[');
}

/*
 * @param resources array of resources
 */
Persistence.prototype.write = function(resources) {
	console.log('write %d resource(s) to %s', resources.length, this.path);

	console.assert(resources.length > 0, 'nothing to write');

	var toWrite = JSON.stringify(resources);

	console.assert(toWrite.indexOf('[') === 0, 'ill-formed data to write, no opening bracket');
	console.assert(toWrite.lastIndexOf(']') === (toWrite.length - 1), 'ill-formed data to write, no closing bracket');

	toWrite = toWrite.substring(toWrite.indexOf('[') + 1, toWrite.lastIndexOf(']'));

	if (this.nResources > 0) {
		toWrite = ',' + toWrite;
	}

	var bytesWritten = fs.writeSync(this.fd, toWrite);

	this.nBytes += bytesWritten;
	this.nResources += resources.length;
}

Persistence.prototype.close = function() {
	console.assert(this.fd !== null);

	fs.writeSync(this.fd, ']');
	fs.closeSync(this.fd);
}

module.exports = Persistence;