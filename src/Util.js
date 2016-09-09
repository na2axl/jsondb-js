/**
 * JSONDB - JSON Database Manager
 *
 * Manage JSON files as databases with JSON Query Language (JQL)
 *
 * This content is released under the MIT License (MIT)
 *
 * Copyright (c) 2016, Centers Technologies
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * @package	   JSONDB
 * @author	   Nana Axel
 * @copyright  Copyright (c) 2016, Centers Technologies
 * @license	   http://opensource.org/licenses/MIT MIT License
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
var Util = function () { };

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
    var Sha = require('jssha');
	var shaObj = new Sha("SHA-1", "TEXT");
	shaObj.update(string + Util.cryptSalt);
    return shaObj.getHash("HEX");
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
    var i = 0;
    for (var key in object) {
        if (object.hasOwnProperty(key)) {
            if (i > offset && i < length) {
                ret[key] = object[key];
            }
            i++;
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
        if (parent.hasOwnProperty(key)) child[key] = parent[key];
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
        ret = "[array][" + value.join(',') + "]";
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
        ret = serialized.split(',');
    } else if (type === 'object') {
        ret = JSON.parse(serialized);
    }

    return ret;
};

// Exports the module
module.exports = new Util();