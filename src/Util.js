/**
 * JSONDB - JSON Database Manager
 *
 * Manage JSON files as databases with JSONDB Query Language (JQL)
 *
 * This content is released under the GPL License (GPL-3.0)
 *
 * Copyright (c) 2016, Centers Technologies
 *
 * @package	   JSONDB
 * @author	   Nana Axel
 * @copyright  Copyright (c) 2016, Centers Technologies
 * @license	   http://spdx.org/licenses/GPL-3.0 GPL License
 * @filesource
 */

/**
 * Class Util
 *
 * @package		JSONDB
 * @subpackage  Utilities
 * @category    Utilities
 * @author		Nana Axel
 */
var Util = (function () {
    function Util() { }

    /**
     * String encryption salt
     * @static {string}
     */
    Util.cryptSalt = '<~>:q;axMw|S01%@yu*lfr^Q#j)OG<Z_dQOvzuTZsa^sm0K}*u9{d3A[ekV;/x[c';

    /**
     * Encrypt a string
     * @param {string} string
     * @return {string}
     */
    Util.prototype.crypt = function (string) {
        var shasum = require('crypto').createHash('sha1');
        shasum.update(string + Util.cryptSalt);
        return shasum.digest("HEX");
    };

    /**
     * Concatenates two or more objects
     * @param {...object}
     * @return {object}
     */
    Util.prototype.concat = function () {
        var ret = {};
        for (var i = 0, l = arguments.length; i < l; i++) {
            for (var p in arguments[i]) {
                if (arguments[i].hasOwnProperty(p)) {
                    ret[p] = arguments[i][p];
                }
            }
        }
        return ret;
    };

    /**
     * Returns an array of values
     * @param {Array} array
     * @return {Array}
     */
    Util.prototype.values = function (array) {
        var ret = [];
        for (var i = 0, l = array.length; i < l; i ++) {
            if (array[i]) ret.push(array[i]);
        }
        return ret;
    };

    /**
     * Returns an array of values
     * @param {object} object
     * @return {Array}
     */
    Util.prototype.objectToArray = function (object) {
        var ret = [];
        for (var key in object) {
            if (object.hasOwnProperty(key)) {
                ret.push(object[key]);
            }
        }
        return ret;
    };

    /**
     * Returns the length of an object
     * @param {object} object
     * @return {number}
     */
    Util.prototype.count = function (object) {
        var ret = 0;
        for (var key in object) {
            if (object.hasOwnProperty(key)) {
                ret++;
            }
        }
        return ret;
    };

    /**
     * Creates an array with given keys and values
     * @param {Array} key
     * @param {Array} values
     * @return {object}
     */
    Util.prototype.combine = function (key, values) {
        var ret = {};

        for (var i = 0, l = key.length; i < l; i++) {
            ret[key[i]] = values[i];
        }

        return ret;
    };

    /**
     * Computes the difference between two arrays
     * @param {Array} array1
     * @param {Array} array2
     * @return {Array}
     */
    Util.prototype.diff = function (array1, array2) {
        var ret = [];
        for (var i = 0, l = array1.length; i < l; i++) {
            if (!~array2.indexOf(array1[i])) {
                ret.push(array1[i]);
            }
        }
        return ret;
    };

    /**
     * Computes the difference between keys of two objects
     * @param {object} object1
     * @param {object} object2
     * @return {object}
     */
    Util.prototype.diff_key = function (object1, object2) {
        var ret = {};
        for (var key in object1) {
            if (!(object1.hasOwnProperty(key) && object2.hasOwnProperty(key))) {
                ret[key] = object1[key];
            }
        }
        return ret;
    };

    /**
     * Computes the intersection between two arrays
     * @param {Array} array1
     * @param {Array} array2
     * @return {Array}
     */
    Util.prototype.intersect = function (array1, array2) {
        var ret = [];
        for (var i = 0, l = array1.length; i < l; i++) {
            if (!!~array2.indexOf(array1[i])) {
                ret.push(array1[i]);
            }
        }
        return ret;
    };

    /**
     * Computes the intersection between keys of two objects
     * @param {object} object1
     * @param {object} object2
     * @return {object}
     */
    Util.prototype.intersect_key = function (object1, object2) {
        var ret = {};
        for (var key in object1) {
            if (!(object1.hasOwnProperty(key) && !object2.hasOwnProperty(key))) {
                ret[key] = object1[key];
            }
        }
        return ret;
    };

    /**
     * Flips the key->value pairs of an object
     * @param {object} object
     * @return {object}
     */
    Util.prototype.flip = function (object) {
        var ret = {};
        for (var key in object) {
            if (object.hasOwnProperty(key)) {
                ret[object[key]] = key;
            }
        }
        return ret;
    };

    /**
     * Sorts an object by a defined function
     * @param {object} object
     * @param {function} func
     * @return {object}
     */
    Util.prototype.usort = function (object, func) {
        func = func || function (after, now) {
            return now > after;
        };
        var ret = {};
        var tmp = [];
        for (var key in object) {
            if (object.hasOwnProperty(key)) {
                tmp.push(object[key]);
            }
        }
        for (var i = 0, l = tmp.length; i < l-1; i++) {
            for (var j = 1; j < l; j++) {
                if (func(tmp[j], tmp[i])) {
                    var k = tmp[i];
                    tmp[i] = tmp[j];
                    tmp[j] = k;
                }
            }
        }
        for (i = 0, l = tmp.length; i < l; i++) {
            for (key in object) {
                if (object.hasOwnProperty(key)) {
                    if (tmp[i] === object[key]) {
                        ret[key] = object[key];
                        break;
                    }
                }
            }
        }
        return ret;
    };

    /**
     * Sorts keys of an object by a defined function
     * @param {object} object
     * @param {function} func
     * @return {object}
     */
    Util.prototype.uksort = function (object, func) {
        func = func || function (after, now) {
                return now > after;
            };
        var ret = {};
        var tmp = [];
        for (var key in object) {
            if (object.hasOwnProperty(key)) {
                tmp.push(key);
            }
        }
        for (var i = 0, l = tmp.length; i < l-1; i++) {
            for (var j = 1; j < l; j++) {
                if (func(tmp[j], tmp[i])) {
                    var k = tmp[i];
                    tmp[i] = tmp[j];
                    tmp[j] = k;
                }
            }
        }
        for (i = 0, l = tmp.length; i < l; i++) {
            for (key in object) {
                if (object.hasOwnProperty(key)) {
                    if (tmp[i] === key) {
                        ret[key] = object[key];
                        break;
                    }
                }
            }
        }
        return ret;
    };

    /**
     * Merges two objects
     * @param {object} object1
     * @param {object} object2
     * @return {object}
     */
    Util.prototype.merge = function (object1, object2) {
        object1 = object1 || {};
        object2 = object2 || {};
        var ret = object1;
        for (var key in object2) {
            if (object2.hasOwnProperty(key)) {
                ret[key] = object2[key];
            }
        }
        return ret;
    };

    /**
     * Slices an object
     * @param {object} object
     * @param {number} offset
     * @param {number} length
     * @return {object}
     */
    Util.prototype.slice = function (object, offset, length) {
        var l = this.count(object);
        offset = offset || 0;
        length = length || l;

        var ret = {};
        var i = j = 0;
        for (var key in object) {
            if (object.hasOwnProperty(key)) {
                if (i >= offset && j < length) {
                    ret[key] = object[key];
                    ++j;
                }
                ++i;
            }
        }
        return ret;
    };

    /**
     * Extends two classes
     * @param {*} child
     * @param {*} parent
     * @return {*}
     */
    Util.prototype.extends = function (child, parent) {
        for (var key in parent) {
            if (parent.hasOwnProperty(key)) {
                child[key] = parent[key];
            }
        }
        function Ctor() {
            this.constructor = child;
        }
        Ctor.prototype = parent.prototype;
        child.prototype = new Ctor();
        child.__super__ = parent.prototype;
        return child;
    };

    Util.prototype.serialize = function (value) {
        var ret;
        if (Array.isArray(value)) {
            ret = "[array][" + value.join(':||:') + "]";
        } else if (typeof value === 'object') {
            ret = "[object][" + JSON.stringify(value) + "]";
        }
        return ret;
    };

    /**
     * Returns the value of a serialized string
     * @param {string} string
     * @return {object|Array}
     */
    Util.prototype.unserialize = function (string) {
        var ret;
        var regexp = string.match(/^\[(\w+)]\[(.+)]$/);
        var type = regexp[1];
        var serialized = regexp[2];

        if (type === 'array') {
            ret = serialized.split(':||:');
        } else if (type === 'object') {
            ret = JSON.parse(serialized);
        }

        return ret;
    };

    /**
     * Checks if the given path exists
     * @param {string} path
     * @return {boolean}
     */
    Util.prototype.existsSync = function (path) {
        var _f = require('fs');
        try {
            _f.statSync(path);
            return true;
        } catch (e) {
            return false;
        }
    };

    /**
     * Checks if the given path exists and execute the given callback
     * @param {string}   path
     * @param {function} cb
     */
    Util.prototype.exists = function (path, cb) {
        cb(this.existsSync(path));
    };

    /**
     * Have to throw or call a function with an error ?
     * @param {function} cb
     * @param {Error}    thr
     */
    Util.prototype.throwOrCall = function (cb, thr) {
        cb = cb || null;
        if (null === cb || !(typeof cb === 'function')) {
            throw thr;
        }
        var slice = [].slice;

        var args = slice.call(arguments, 2);
        args.unshift(thr);

        cb.apply(null, args);
    };

    /**
     * Waits for a number of milliseconds before continue execution
     * @param {number} milliSeconds
     * @return {boolean}
     */
    Util.prototype.waitFor = function(milliSeconds) {
        var d = new Date();
        var startTime = d.getTime();
        var endTime = startTime + milliSeconds;
        var currentTime;
        while (true) {
            d = new Date();
            currentTime = d.getTime();

            if(currentTime >= endTime) {
                break;
            }
        }
        return true;
    };

    /**
     * Returns the path to a table
     * @param {null|string} table The table name
     * @return {string}
     */
    Util.prototype._getTablePath = function (server, database, table) {
        return server + '/' + database + '/' + table + ".json";
    };

    /**
     * Returns a table's data
     * @param {string|null} path The path to the table
     * @return {object}
     */
    Util.prototype.getTableData = function (path) {
        path = path || this._getTablePath();
        var _f = require('fs');
        var lockFile = require('lockfile');
        var ret;

        var checkIfLocked = (function (_this) {
            return function () {
                if (lockFile.checkSync(_this._getTablePath() + '.lock')) {
                    _this.waitFor(100);
                    checkIfLocked();
                } else {
                    lockFile.lockSync(path + '.lock');
                    ret = JSON.parse(_f.readFileSync(path));
                    lockFile.unlockSync(path + '.lock');
                }
            };
        })(this);

        checkIfLocked();

        return ret;
    };

    /**
     * Gets the path to a database
     * @param {string} server
     * @param {string} database
     * @return {string}
     */
    Util.prototype._getDatabasePath = function (server, database) {
        return server + '/' + database;
    };

    /**
     * Add 0 to a number lower than 10
     * @param {number|string} number
     * @return {string}
     */
    Util.prototype.zeropad = function (number) {
        number = parseInt(number);
        if (number < 10 && number >= 0) {
            number = '0' + number;
        }
        return number;
    };

    /**
     * Asynchronous while
     * @param {function} condition The while condition
     * @param {function} bridge    The function used for recursion
     * @param {function} callback  The callback function
     */
    Util.prototype.whilst = function(condition, bridge, callback) {
        try {
            if (condition() === false) {
                return callback(null);
            }
            return bridge(function() {
                this.whilst(condition, bridge, callback);
            }.bind(this));
        }
        catch (e) {
            return callback(e);
        }
    };

    /**
     * Create a new directory synchronously
     * @param {string} path      The path of the new directory
     * @throws {Error}
     * @return {boolean}
     */
    Util.prototype.mkdirSync = function (path) {
        var _f = require('fs');
        var _p = require('path');

        path = _p.normalize(path);

        if (!this.existsSync(_p.dirname(path))) {
            this.mkdirSync(_p.dirname(path));
        }

        if (_f.mkdirSync(path, 0x1ff) === false) {
            throw new Error('Cannot create directory "' + path + '"');
        }
        else {
            _f.chmodSync(path, 0x1ff);
            return true;
        }
    };

    /**
     * Create a new directory asynchronously
     * @param {string}   path      The path of the new directory
     * @param {function} callback  The callback
     * @throws {Error}
     * @return {boolean}
     */
    Util.prototype.mkdir = function (path, callback) {
        var _f = require('fs');
        var _p = require('path');

        path = _p.normalize(path);
        callback = callback || function() {};

        this.exists(path, function(exists) {
            if (!exists) {
                this.mkdir(_p.dirname(path));
            }

            _f.mkdir(path, 0x1ff, function(error) {
                if (error) {
                    callback(error);
                }
                _f.chmod(path, 0x1ff, function(error) {
                    if (error) {
                        callback(error);
                    }
                    callback(null);
                });
            })
        }.bind(this));

    };

    return Util;
})();

// Exports the module
module.exports = new Util();
