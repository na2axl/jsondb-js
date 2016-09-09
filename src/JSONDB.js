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
 * Class JSONDB
 *
 * @package		JSONDB
 * @author		Nana Axel
 */
var JSONDB = function () { };

/**
 * Parse value to string
 * @type {number}
 */
JSONDB.PARAM_STRING = 0;

/**
 * Parse value to integer
 * @type {number}
 */
JSONDB.PARAM_INT = 1;

/**
 * Parse value to boolean
 * @type {number}
 */
JSONDB.PARAM_BOOL = 2;

/**
 * Parse value to null
 * @type {number}
 */
JSONDB.PARAM_NULL = 3;

/**
 * Parse value to array for
 * prepared queries.
 * @type {number}
 */
JSONDB.PARAM_ARRAY = 7;

/**
 * Fetch results as array
 * @type {number}
 */
JSONDB.FETCH_ARRAY = 4;

/**
 * Fetch results as object
 * @type {number}
 */
JSONDB.FETCH_OBJECT = 4;

/**
 * Fetch results with class mapping
 * @type {number}
 */
JSONDB.FETCH_CLASS = 6;

/**
 * Creates a new server.
 * @param {string}  name The server's name
 * @param {string}  username The server's username
 * @param {string}  password The server's user password
 * @param {boolean} connect If JSONDB connects directly to the server after creation
 * @return {JSONDB|Database}
 * @throws {Error}
 */
JSONDB.prototype.createServer = function (name, username, password, connect) {
    name = name || null;
    username = username || null;
    connect = connect || false;

    var _f = require('fs');
    var _p = require('path');

    var path = _p.normalize(_p.dirname(__dirname) + '/servers/' + name);
    if (null !== path && username !== null) {
        if (_f.existsSync(path) && _f.lstatSync(path).isDirectory()) {
            throw new Error("JSONDB Error: Can't create server \"" + path + "\", the directory already exists.");
        }

        if (!_f.mkdirSync(path, 0x1ff) && !_f.lstatSync(path).isDirectory()) {
            throw new Error("JSONDB Error: Can't create the server \"" + path + "\". Maybe you don't have write access.");
        }

        _f.chmodSync(path, 0x1ff);

        require('./Configuration').addUser(name, username, password);

        if (connect) {
            return this.connect(name, username, password, null);
        }
    } else {
        throw new Error("JSONDB Error: Can't create the server, required parameters are missing.");
    }

    return this;
};

/**
 * Connects to a database
 *
 * Access to a server with an username, a password
 * and optionally a database's name.
 *
 * @param {string} server   The name of the server
 * @param {string} username The username
 * @param {string} password The password
 * @param {string|null} database The name of the database
 * @throws {Error}
 * @return {Database}
 */
JSONDB.prototype.connect = function (server, username, password, database) {
    return require('./Database')(server, username, password, database);
};

/**
 * Escapes reserved characters and quotes a value
 * @param {string} value
 * @return {string}
 */
JSONDB.prototype.quote = function (value) {
    return require('./QueryParser').quote(value);
};

// Exports the module
module.exports = JSONDB;