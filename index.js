#!/usr/bin/env node

const express = require('express');
const app = express();
const execFile = require('child_process').execFile;
const fs = require('fs');
const EventEmitter = require('events');
const util = require('util');
const program = require('commander');
const querystring = require('querystring');
const https = require('https');
const url = require('url');

function MupAutodeployEmitter() {
    EventEmitter.call(this);
}
util.inherits(MupAutodeployEmitter, EventEmitter);

const mupAutoDeployEmitter = new MupAutodeployEmitter();

function executeCommand(cmd, options) {
    return new Promise(function (resolve, reject) {
        execFile(cmd, options, function (err, stdout, stderr) {
            if (err) {
                reject(err);
            } else {
                resolve(stdout);
            }
        });
    });
}

function sendHttpsPostRequest(protocol, hostname, path, postData) {
    var options = {
        protocol: protocol,
        host: hostname,
        path: path,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    var req = https.request(options);
    req.write(postData);
    req.end();
}

function sendSlackNotification(text) {
    var dataString = 'payload=' + encodeURI('{"text": "' + text + '"}');
    sendHttpsPostRequest(program.slack.protocol, program.slack.hostname, program.slack.path, dataString);
}

function emitLog(logTxt) {
    mupAutoDeployEmitter.emit('log', logTxt);
}

function commandError(error) {
    emitLog(error);
}

function locationExists(locationPath) {
    return new Promise(function (resolve, reject) {
        fs.access(locationPath, fs.F_OK, function (err) {
            if (err) {
                resolve(false);
            } else {
                resolve(true);
            }
        });
    });
}

function deployProject() {
    return new Promise(function (resolve, reject) {
        emitLog('Starting deployment process....');
        executeCommand('mup', ['deploy']).then(function (stdout) {
            emitLog(stdout);
            emitLog('Deployment process done.');
        }, commandError);
    });
}

app.post('/deploy', function (req, res) {
    if (program.token && (!req.query.token || (req.query.token !== program.token))) {
        return res.sendStatus(403);
    } else {
        res.sendStatus(200);
        emitLog('Deployment triggered!');
        var projectNameStartingIndex = program.gitUrl.lastIndexOf('/') + 1;
        var projectNameEndingIndex = program.gitUrl.lastIndexOf('.git');
        var branch = program.branch || 'master';
        var projectName = program.gitUrl.substr(projectNameStartingIndex, projectNameEndingIndex - projectNameStartingIndex);
        locationExists(projectName).then(function (exists) {
            if (!exists) {
                emitLog('Project has not been cloned yet. Cloning....');
                executeCommand('git', ['clone', program.gitUrl]).then(function (stdout) {
                    emitLog(stdout);
                    emitLog('Done cloning');
                    emitLog('Checking out branch ' + branch + '....');
                    executeCommand('git', ['-C', projectName, 'checkout', 'origin/' + branch]).then(function () {
                        emitLog(stdout);
                        emitLog('Checked out branch ' + branch);
                        deployProject();
                    }, commandError);
                }, commandError);
            } else {
                emitLog('Checking out branch ' + branch + '....');
                executeCommand('git', ['-C', projectName, 'checkout', 'origin/' + branch]).then(function (stdout) {
                    emitLog(stdout);
                    emitLog('Checked out branch ' + branch);
                    emitLog('Pulling changes...');
                    executeCommand('git', ['-C', projectName, 'pull', 'origin', branch]).then(function () {
                        emitLog(stdout);
                        emitLog('Pulled changes');
                        deployProject();
                    }, commandError);
                }, commandError);
            }
        });
    }
});

function onMupAutoDeployLog(logTxt) {
    if (program.verbose) {
        console.log(logTxt);
    }
    if (program.slack) {
        sendSlackNotification(logTxt);
    }
}

program
    .version('0.0.1')
    .arguments('<git-url>')
    .option('-t --token <secret-token>', 'application access token')
    .option('-p, --port <port-number>', 'port to listen')
    .option('-b, --branch <branch-name>', 'branch to checkout')
    .option('-v, --verbose', 'display deployment information on standard output')
    .option('-s, --slack <slack-hook-url>', 'send log to the given <slack-hook-url>')
    .action(function (gitUrl) {
        var port = program.port || 80;
        program.gitUrl = gitUrl;
        mupAutoDeployEmitter.on('log', onMupAutoDeployLog);
        if (program.slack) {
            program.slack = url.parse(program.slack);
        }
        app.listen(port);
    })
    .parse(process.argv);

if (!process.argv.slice(2).length) {
    program.outputHelp();
}