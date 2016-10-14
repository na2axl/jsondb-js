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
 * Class JSONDB
 *
 * @package     JSONDB
 * @subpackage  Managers
 * @category    Server
 * @author      Nana Axel
 */
var JSONDB = (function () {
    function JSONDB() { }

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
     * Namespace for all async operations
     * @type {object}
     */
    JSONDB.prototype.async = {};

    /**
     * Creates a new server.
     * @param {string}  name     The server's name
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
        var Util = require('./Util');

        var path = _p.normalize(_p.dirname(__dirname) + '/servers/' + name);
        if (null !== path && username !== null) {
            if (Util.existsSync(path) && _f.lstatSync(path).isDirectory()) {
                throw new Error("JSONDB Error: Can't create the server at \"" + path + "\", the directory already exists.");
            }

            Util.mkdirSync(path);

            if (!_f.lstatSync(path).isDirectory()) {
                throw new Error("JSONDB Error: Can't create the server at \"" + path + "\". Maybe you don't have write access.");
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
     * Checks if a server exists
     * @param {string} name The name of the server
     * @return {boolean}
     */
    JSONDB.prototype.serverExists = function (name) {
        name = name || null;

        if (null === name) {
            return false;
        }

        var _p = require('path');
        var Util = require('./Util');

        var path = _p.normalize(_p.dirname(__dirname) + '/servers/' + name);

        return Util.existsSync(path);
    };

    /**
     * Connects to a Database
     *
     * Access to a server with an username, a password
     * and optionally a Database's name.
     *
     * @param {string}      server   The name of the server
     * @param {string}      username The username
     * @param {string}      password The password
     * @param {string|null} database The name of the Database
     * @throws {Error}
     * @return {Database}
     */
    JSONDB.prototype.connect = function (server, username, password, database) {
        return require('./Database')(server, username, password, database);
    };

    /**
     * Creates a new server asynchronously
     * @param {string}   name     The server's name
     * @param {string}   username The server's username
     * @param {string}   password The server's user password
     * @param {function} callback The callback
     */
    JSONDB.prototype.async.createServer = function (name, username, password, callback) {
        name = name || null;
        username = username || null;
        callback = callback || null;

        if (null === callback || !(typeof callback === 'function')) {
            throw new Error("JSONDB Error: Can't create a server asynchronously without a callback.");
        }

        setImmediate(function() {
            var _f = require('fs');
            var _p = require('path');
            var Util = require('./Util');

            var path = _p.normalize(_p.dirname(__dirname) + '/servers/' + name);
            if (null !== path && username !== null) {
                Util.exists(path, function (exists) {
                    if (exists && _f.lstatSync(path).isDirectory()) {
                        callback(new Error("JSONDB Error: Can't create the server at \"" + path + "\", the directory already exists."));
                    } else {
                        Util.mkdir(path, function (err) {
                            if (err) {
                                callback(new Error("JSONDB Error: Can't create the server at \"" + path + "\", the directory can't be created. " + err));
                            }
                            _f.chmod(path, 0x1ff, function (err) {
                                if (err) {
                                    callback(err);
                                } else {
                                    require('./Configuration').addUser(name, username, password);
                                    callback(null);
                                }
                            });
                        });
                    }
                });
            } else {
                callback(new Error("JSONDB Error: Can't create the server, required parameters are missing."));
            }
        }.bind(this));
    };

    /**
     * Checks if a server exists asynchronously
     * @param {string}   name     The name of the server
     * @param {function} callback The callback
     */
    JSONDB.prototype.async.serverExists = function (name, callback) {
        callback = callback || null;

        if (null === callback || !(typeof callback === 'function')) {
            throw new Error("JSONDB Error: Can't check asynchronously if a server exists without a callback.");
        }

        setImmediate(function() {
            name = name || null;

            if (null === name) {
                callback(false);
            }

            var _p = require('path');
            var Util = require('./Util');

            var path = _p.normalize(_p.dirname(__dirname) + '/servers/' + name);

            Util.exists(path, callback);
        }.bind(this));
    };

    /**
     * Connects to a Database
     *
     * Access to a server with an username, a password
     * and optionally a Database's name.
     *
     * @param {string}          server   The name of the server
     * @param {string}          username The username
     * @param {string}          password The password
     * @param {string|function} database The name of the Database
     * @param {function}        callback The callback
     */
    JSONDB.prototype.async.connect = function (server, username, password, database, callback) {
        callback = callback || null;

        if (typeof database === 'function') {
            callback = database;
            database = null;
        }

        if (null === callback || !(typeof callback === 'function')) {
            throw new Error("JSONDB Error: Can't connect to a server asynchronously without a callback.");
        }

        setImmediate(function() {
            try {
                callback(null, require('./Database')(server, username, password, database));
            } catch (e) {
                callback(e, null);
            }
        }.bind(this));
    };

    /**
     * Escapes reserved characters and quotes a value
     * @param {string} value
     * @return {string}
     */
    JSONDB.quote = function (value) {
        return require('./QueryParser').quote(value);
    };

    return JSONDB;
})();

// Exports the module
module.exports = JSONDB;
