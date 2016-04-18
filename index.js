"use strict";
const fs = require('fs');
const g = require('genery');
const ncp = require('ncp').ncp;
const path = require('path');

const DEFAULT_PRIVATE_NODE_MODULE = 'private_node_modules';
const child_process = require("child_process");
ncp.limit = 16;

let exec = function(cmd, cwd) {
    return new Promise(function(resolve, reject) {

        child_process.exec(cmd, {
            cwd: cwd
        }, function(err, stdout, stderr) {
            if (err) return reject(err);
            if (stdout) console.log(stdout)
            if (stderr) console.log(stderr)
            resolve();
        })
    });
};
/**
 * copy all dependencies from private node module to node module for production
 */
function copyFromPrivate(module) {
    var cwd = process.cwd();

    return new Promise(function(resolve, reject) {
        let source = DEFAULT_PRIVATE_NODE_MODULE + '/' + module;
        let dest = 'node_modules/' + module;
        console.log('copy from ' + source + ' to ' + dest);
        ncp(source, dest, {
            filter: function(name) {
                name = name.slice(cwd.length + 2 + source.length)
                return !(name.startsWith('node_modules'));
            }
        }, function(err) {
            if (err)
                return reject(err)
            resolve()
        });
    });
}

/**
 * copy local module in the private node module area
 */
function copyFromLocal(module) {


    return new Promise(function(resolve, reject) {

        let dest = DEFAULT_PRIVATE_NODE_MODULE + '/' + module;
        let source = '../' + module;
        console.log('copy from ' + source + ' to ' + dest);
        var indexOfSource = path.join(process.cwd(), source).length + 1;

        ncp(source, dest, {
            filter: function(name) {
                name = name.slice(indexOfSource)
                return !(name.startsWith('node_modules'));
            }
        }, function(err) {
            if (err)
                return reject(err)
            resolve()
        });
    });
}

let readDependencies = function() {
    let dependencies = fs.readFileSync('./private_package.json');
    dependencies = JSON.parse(dependencies);
    console.log('process private package ' + dependencies);
    return dependencies;
}

let createPrivateDir = function() {
    if (fs.existsSync(DEFAULT_PRIVATE_NODE_MODULE) === false)
        fs.mkdirSync(DEFAULT_PRIVATE_NODE_MODULE)
}

g(function * () {
    let dependencies = readDependencies();

    createPrivateDir();

    if (process.env.VCAP_APPLICATION === undefined) {
        console.log('********** DEVLOPMENT ***********')
        
        // link private packqge
        for (let name in dependencies) {
            yield copyFromLocal(name);
            yield exec('npm install ', dependencies[name]);
            yield exec('npm link '+ dependencies[name]);
        }
    } else {
        console.log('********** STAGING ***********')
        // copy private package
        for (let name in dependencies) {
            yield copyFromPrivate(name);
            yield exec('npm install', 'node_modules/' + name);
        }
    }

    console.log('done');

}).catch(function(err) {
    console.log(err)
    console.log(err.stack)
});
