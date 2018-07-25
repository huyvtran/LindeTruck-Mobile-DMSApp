'use strict';
var through = require('through2');
var gutil = require('gulp-util');
var cordova = require('cordova-lib').cordova.raw;
var Promise = require('pinkie-promise');

module.exports = function (plugins) {
	plugins = [].concat(plugins);

	return through.obj(function (file, enc, cb) {
		process.env.PWD = file.path;

		this.push(file);

		Promise.all(plugins.map(rm))
			.then(function () {
				cb();
			})
			.catch(function (err) {
				cb(new gutil.PluginError('gulp-cordova-plugin-remove', err.message));
			});
	});
};

function rm(plugin) {
	gutil.log('\tremove ' + plugin);

	return cordova.plugin('rm', plugin)
		.catch(function (err) {
			var regExp = new RegExp('Plugin "' + plugin + '" is not present in the project');
			if (err.name !== 'CordovaError' || !regExp.test(err.message)) {
				throw err;
			}
		});
}
