#!/usr/bin/env node

var fs = require('fs');
var Path = require('path');
var mkpath = require('yow').mkpath;
var sprintf = require('yow').sprintf;
var redirectLogs = require('yow').redirectLogs;
var prefixLogs = require('yow').prefixLogs;
var cmd = require('commander');


var App = function() {
	cmd.version('1.0.0');
	cmd.option('-l --log', 'redirect logs to file');
	cmd.option('-p --port <port>', 'listens to specified port', 3000);
	cmd.option('-t --tellstick <port>', 'listens to specified tellstick port', 3001);
	cmd.parse(process.argv);

	prefixLogs();

	if (cmd.log) {
		var date = new Date();
		var path = sprintf('%s/logs', __dirname);
		var name = sprintf('%04d-%02d-%02d-%02d-%02d-%02d.log', date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds());

		mkpath(path);
		redirectLogs(Path.join(path, name));
	}

	console.log('Listening to ports %d and %d...', cmd.port, cmd.tellstick);

	var io = require('socket.io').listen(cmd.port);
	var telldus = require('socket.io').listen(cmd.tellstick);

	telldus.on('connection', function(socket) {

		console.log('A TellStick connected.');

		socket.on('disconnect', function(data) {
			console.log('Lost my TellStick...');
		});

		socket.on('tellstick', function(data) {
			io.emit('tellstick', data);
		});

		socket.emit('hello');
	});

	io.on('connection', function(socket) {

		console.log('A TellStick-listener connected.');

		socket.on('turnOn', function(data) {
			console.log('Turning on', data);
			telldus.emit('turnOn', data);
		});

		socket.on('turnOff', function(data) {
			console.log('Turning off', data);
			telldus.emit('turnOff', data);
		});

		socket.emit('hello');
	});

};

new App();
