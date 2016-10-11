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
 * Class Database
 *
 * @package    JSONDB
 * @subpackage Managers
 * @category   Database
 * @author     Nana Axel
 */
var Database = (function () {
    /**
     * The current Database instance
     * @type {Database}
     */
    var instance;

    function Database(server, username, password, database) {
        server = server || null;
        username = username || null;
        database = database || null;

        if (null === server || null === username || null === password) {
            throw new Error('Database Error: Can\'t connect to the server, missing parameters.');
        }

        this.config = require('./Configuration');
        this.benchmark = require('./Benchmark');

        this.benchmark.mark('Database_(connect)_start');
        var Util = require('./Util');
        var _p = require('path');
        var config = this.config.getConfig('users');

        if (!config.hasOwnProperty(server)) {
            this.benchmark.mark('Database_(connect)_end');
            throw new Error("Database Error: There is no registered server with the name \"" + server + "\".");
        }

        if (config[server].username !== Util.crypt(username) || config[server].password !== Util.crypt(password)) {
            this.benchmark.mark('Database_(connect)_end');
            throw new Error("Database Error: User's authentication failed for user \"" + username + "\" and password \"" + password + "\" on server \"" + server + "\". Access denied.");
        }

        this.server = _p.normalize(_p.dirname(__dirname) + '/servers/' + server);
        this.database = database;
        this.username = username;
        this.password = password;
        this.benchmark.mark('Database_(connect)_end');

        instance = this;
    }

    /**
     * The path to databases directories
     * @type {string|null}
     */
    Database.prototype.server = null;

    /**
     * The name of the current used database
     * @type {string|null}
     */
    Database.prototype.database = null;

    /**
     * The current logged in username
     * @type {string}
     */
    Database.prototype.username = '';

    /**
     * The current logged in user password
     * @type {string}
     */
    Database.prototype.password = '';

    /**
     * Config manager
     * @type {Configuration}
     */
    Database.prototype.config = null;

    /**
     * Namespace for asynchronous operations
     * @type {object}
     */
    Database.prototype.async = {};

    /**
     * Benchmark
     * @type {Benchmark}
     */
    Database.prototype.benchmark = null;

    /**
     * Change the currently used database
     * @param {string} database The database's name
     * @throws {Error}
     * @return {Database}
     */
    Database.prototype.setDatabase = function (database) {
        if (null === this.server) {
            throw new Error("Database Error: Can't use the database \"" + database + "\", there is no connection established with a server.");
        }
        var Util = require('./Util');
        var path = Util._getDatabasePath(this.server, database);
        if (!(Util.existsSync(path))) {
            throw new Error("Database Error: Can't use the database \"" + database + "\", the database doesn't exist in the server.");
        }
        this.database = database;
        return this;
    };

    /**
     * Returns the path to the server.
     * @return string
     */
    Database.prototype.getServer = function () {
        return this.server;
    };

    /**
     * Returns the currently used database.
     * @return {string}
     */
    Database.prototype.getDatabase = function () {
        return this.database;
    };

    /**
     * Returns the current benchmark instance.
     * @return {Benchmark}
     */
    Database.prototype.bench = function () {
        return this.benchmark;
    };

    /**
     * Checks if a database exists
     * @param {string} name The name of the database
     * @return {boolean}
     */
    Database.prototype.databaseExists = function (name) {
        name = name || null;
        if (null === name) {
            return false;
        }
        var Util = require('./Util');
        return Util.existsSync(Util._getDatabasePath(this.server, name));
    };

    /**
     * Checks if a database exists asynchronously
     * @param {string}   name     The name of the database
     * @param {function} callback The callback
     * @throws {Error}
     */
    Database.prototype.async.databaseExists = function (name, callback) {
        callback = callback || null;

        if (null === callback || !(typeof callback === 'function')) {
            throw new Error("JSONDB Error: Can't check asynchronously if a database exists without a callback.");
        }

        var Util = require('./Util');

        setImmediate(function() {
            name = name || null;
            if (null === name) {
                callback(false);
            }
            Util.exists(Util._getDatabasePath(instance.server, name), callback);
        }.bind(this));
    };

    /**
     * Creates a new database
     *
     * The new database will be a folder in the
     * server directory.
     *
     * @param {string} name The name of the database
     * @throws {Error}
     * @return {Database}
     */
    Database.prototype.createDatabase = function (name) {
        name = name || null;

        this.benchmark.mark('Database_(createDatabase)_start');
        if (null === name) {
            this.benchmark.mark('Database_(createDatabase)_end');
            throw new Error("Database Error: Can't create the database, the database's name is missing.");
        }
        if (null === this.server) {
            this.benchmark.mark('Database_(createDatabase)_end');
            throw new Error("Database Error: Can't create the database \"" + name + "\", there is no connection established with a server.");
        }

        var _f = require('fs');
        var Util = require('./Util');
        var mkdirp = require('mkdirp');
        var path = Util._getDatabasePath(this.server, name);

        if (Util.existsSync(path)) {
            this.benchmark.mark('Database_(createDatabase)_end');
            throw new Error("Database Error: Can't create the database \"" + name + "\" in the server \"" + this.server + "\", the database already exist.");
        }

        mkdirp.sync(path);

        if (!_f.lstatSync(path).isDirectory()) {
            this.benchmark.mark('Database_(createDatabase)_end');
            throw new Error("Database Error: Can't create the database \"" + name + "\" in the server \"" + this.server + "\".");
        }

        _f.chmodSync(path, 0x1ff);

        this.benchmark.mark('Database_(createDatabase)_end');

        return this;
    };

    /**
     * Creates a new database asynchronously
     *
     * The new database will be a folder in the
     * server directory.
     *
     * @param {string}   name     The name of the database
     * @param {function} callback The callback
     */
    Database.prototype.async.createDatabase = function (name, callback) {
        callback = callback || null;

        if (null === callback || !(typeof callback === 'function')) {
            throw new Error("Database Error: Can't create a database asynchronously without a callback.");
        }

        instance.benchmark.mark('Database_(createDatabase)_start');
        if (null === name) {
            instance.benchmark.mark('Database_(createDatabase)_end');
            callback(new Error("Database Error: Can't create the database, the database's name is missing."));
        }
        if (null === instance.server) {
            instance.benchmark.mark('Database_(createDatabase)_end');
            callback(new Error("Database Error: Can't create the database \"" + name + "\", there is no connection established with a server."));
        }

        var _f = require('fs');
        var Util = require('./Util');
        var mkdirp = require('mkdirp');
        var path = Util._getDatabasePath(instance.server, name);

        setImmediate(function() {
            Util.exists(path, function (exists) {
                if (exists) {
                    instance.benchmark.mark('Database_(createDatabase)_end');
                    callback(new Error("Database Error: Can't create the database \"" + name + "\" in the server \"" + instance.server + "\", the database already exist."));
                } else {
                    mkdirp(path, function (err) {
                        if (err || !_f.lstatSync(path).isDirectory()) {
                            instance.benchmark.mark('Database_(createDatabase)_end');
                            callback(new Error("Database Error: Can't create the database \"" + name + "\" in the server \"" + instance.server + "\"."));
                        }
                        _f.chmod(path, 0x1ff, function (err) {
                            if (err) {
                                callback(err);
                            } else {
                                instance.benchmark.mark('Database_(createDatabase)_end');
                                callback(null);
                            }
                        });
                    });
                }
            });
        }.bind(this));
    };

    /**
     * Disconnects to a server
     */
    Database.prototype.disconnect = function () {
        this.benchmark.mark('Database_(disconnect)_start');
        this.server = null;
        this.database = null;
        this.username = '';
        this.password = '';
        this.benchmark.mark('Database_(disconnect)_end');
    };

    /**
     * Checks if a table exists
     * @param {string} name The name of the table
     * @return {boolean}
     */
    Database.prototype.tableExists = function (name) {
        name = name || null;
        if (null === name) {
            return false;
        }
        return require('./Util').existsSync(this.server + "/" + this.database + "/" + name + ".json");
    };

    /**
     * Checks if a table exists asynchronously
     * @param {string}   name     The name of the table
     * @param {function} callback The callback
     * @throws {Error}
     */
    Database.prototype.async.tableExists = function (name, callback) {
        callback = callback || null;
        if (null === callback || !(typeof callback === 'function')) {
            throw new Error("Database Error: Can't check asynchronously if a database exist without a callback.");
        }

        var Util = require('./Util');

        setImmediate(function () {
            name = name || null;
            if (null === name) {
                callback(false);
            }
            Util.exists(this.server + "/" + this.database + "/" + name + ".json", callback);
        }.bind(this));
    };

    /**
     * Creates a new table in the current database
     *
     * The new table will be a .json file in the folder
     * which represent the current selected database.
     *
     * @param {string} name      The name of the table
     * @param {object} prototype The prototype of the table.
     *                            An array of string which
     *                            represents field names.
     * @throws {Error}
     * @return {Database}
     */
    Database.prototype.createTable = function (name, prototype) {
        name = name || null;
        prototype = prototype || null;

        if (null === name || null === prototype) {
            throw new Error('Database Error: Can\'t create table, missing parameters.');
        }

        this.benchmark.mark('Database_(createTable)_start');
        if (null === this.database) {
            this.benchmark.mark('Database_(createTable)_end');
            throw new Error('Database Error: Trying to create a table without using a database.');
        }

        var table_path = this.server + "/" + this.database + "/" + name + ".json";
        var _f = require('fs');
        var Util = require('./Util');

        if (Util.existsSync(table_path)) {
            this.benchmark.mark('Database_(createTable)_end');
            throw new Error("Database Error: Can't create the table \"" + name + "\" in the database \"" + this.database + "\". The table already exist.");
        }

        var fields = [];
        var properties = {'last_insert_id': 0, 'last_valid_row_id': 0, 'last_link_id': 0, 'primary_keys': [], 'unique_keys': []};
        var ai_exist = false;
        for (var field in prototype) {
            if (prototype.hasOwnProperty(field)) {
                var prop = prototype[field];
                var has_ai = prop.hasOwnProperty('auto_increment');
                var has_pk = prop.hasOwnProperty('primary_key');
                var has_uk = prop.hasOwnProperty('unique_key');
                var has_tp = prop.hasOwnProperty('type');
                if (ai_exist && has_ai) {
                    this.benchmark.mark('Database_(createTable)_end');
                    throw new Error("Database Error: Can't use the \"auto_increment\" property on more than one field.");
                } else if (!ai_exist && has_ai) {
                    ai_exist = true;
                    prototype[field].unique_key = true;
                    prototype[field].not_null = true;
                    prototype[field].type = 'int';
                    has_tp = true;
                    properties.unique_keys.push(field);
                }
                if (has_pk) {
                    prototype[field].not_null = true;
                    properties.primary_keys.push(field);
                }
                if (has_uk) {
                    prototype[field].not_null = true;
                    properties.unique_keys.push(field);
                }
                if (has_tp) {
                    if (/link\((.+)\)/.test(prop.type)) {
                        var link = prop.type.match(/link\((.+)\)/);
                        var link_info = link[1].split('.');
                        var link_table_path = this.server + "/" + this.database + "/" + link_info[0] + ".json";

                        if (!Util.existsSync(link_table_path)) {
                            throw new Error("Database Error: Can't create the table \"" + name + "\". An error occur when linking the column \"" + field + "\" with the column \"" + link[1] + "\", the table \"" + link_info[0] + "\" doesn't exist in the database \"" + this.database + "\".");
                        }

                        var link_table_data = Util.getTableData(link_table_path);
                        if (!~link_table_data['prototype'].indexOf(link_info[1])) {
                            throw new Error("Database Error: Can't create the table \"" + name + "\". An error occur when linking the column \"" + field + "\" with the column \"" + link[1] + "\", the column \"" + link_info[1] + "\" doesn't exist in the table \"" + link_info[0] + "\" .");
                        }
                        if ((link_table_data.properties.hasOwnProperty('primary_keys') && !~link_table_data.properties.primary_keys.indexOf(link_info[1])) || (link_table_data.properties.hasOwnProperty('unique_keys') && !~link_table_data.properties.unique_keys.indexOf(link_info[1]))) {
                            throw new Error("Database Error: Can't create the table \"" + name + "\". An error occur when linking the column \"" + field + "\" with the column \"" + link[1] + "\", the column \"" + link_info[1] + "\" is not a PRIMARY KEY or an UNIQUE KEY in the table \"" + link_info[0] + "\" .");
                        }
                    }
                } else {
                    prototype[field].type = 'string';
                }

                fields.push(field);
            }
        }

        properties = Util.concat(properties, prototype);
        fields.unshift('#rowid');
        var data = {
            'prototype': fields,
            'properties': properties,
            'data': {}
        };

        if (_f.openSync(table_path, 'w')) {
            _f.chmodSync(table_path, 0x1ff);
            _f.writeFileSync(table_path, JSON.stringify(data));
            this.benchmark.mark('Database_(createTable)_end');
            return this;
        }

        this.benchmark.mark('Database_(createTable)_end');
        throw new Error("Database Error: Can't create file \"" + table_path + "\".");
    };

    /**
     * Creates a new table in the current database asynchronously
     *
     * The new table will be a .json file in the folder
     * which represent the current selected database.
     *
     * @param {string}   name      The name of the table
     * @param {object}   prototype The prototype of the table.
     *                             An array of string which
     *                             represents field names.
     * @param {function} callback  The callback
     */
    Database.prototype.async.createTable = function (name, prototype, callback) {
        callback = callback || null;

        if (null === callback || !(typeof callback === 'function')) {
            throw new Error("Database Error: Can't create a table without a callback.");
        }

        name = name || null;
        prototype = prototype || null;

        if (null === name || null === prototype) {
            callback(new Error('Database Error: Can\'t create table, missing parameters.'));
        }

        instance.benchmark.mark('Database_(createTable)_start');
        if (null === instance.database) {
            instance.benchmark.mark('Database_(createTable)_end');
            callback(new Error('Database Error: Trying to create a table without using a database.'));
        }

        var table_path = instance.server + "/" + instance.database + "/" + name + ".json";
        var _f = require('fs');
        var Util = require('./Util');

        setImmediate(function () {
            Util.exists(table_path, function (exists) {
                if (exists) {
                    instance.benchmark.mark('Database_(createTable)_end');
                    callback(new Error("Database Error: Can't create the table \"" + name + "\" in the database \"" + instance.database + "\". The table already exist."));
                } else {
                    var fields = [];
                    var properties = {
                        'last_insert_id': 0,
                        'last_valid_row_id': 0,
                        'last_link_id': 0,
                        'primary_keys': [],
                        'unique_keys': []
                    };
                    var ai_exist = false;
                    for (var field in prototype) {
                        if (prototype.hasOwnProperty(field)) {
                            var prop = prototype[field];
                            var has_ai = prop.hasOwnProperty('auto_increment');
                            var has_pk = prop.hasOwnProperty('primary_key');
                            var has_uk = prop.hasOwnProperty('unique_key');
                            var has_tp = prop.hasOwnProperty('type');
                            if (ai_exist && has_ai) {
                                instance.benchmark.mark('Database_(createTable)_end');
                                callback(new Error("Database Error: Can't use the \"auto_increment\" property on more than one field."));
                            } else if (!ai_exist && has_ai) {
                                ai_exist = true;
                                prototype[field].unique_key = true;
                                prototype[field].not_null = true;
                                prototype[field].type = 'int';
                                has_tp = true;
                                properties.unique_keys.push(field);
                            }
                            if (has_pk) {
                                prototype[field].not_null = true;
                                properties.primary_keys.push(field);
                            }
                            if (has_uk) {
                                prototype[field].not_null = true;
                                properties.unique_keys.push(field);
                            }
                            if (has_tp) {
                                if (/link\((.+)\)/.test(prop.type)) {
                                    var link = prop.type.match(/link\((.+)\)/);
                                    var link_info = link[1].split('.');
                                    var link_table_path = instance.server + "/" + instance.database + "/" + link_info[0] + ".json";

                                    Util.exists(link_table_path, (function (link_table_path, link_info) {
                                        return function (exists) {
                                            if (!exists) {
                                                callback(new Error("Database Error: Can't create the table \"" + name + "\". An error occur when linking the column \"" + field + "\" with the column \"" + link[1] + "\", the table \"" + link_info[0] + "\" doesn't exist in the database \"" + instance.database + "\"."));
                                            } else {
                                                var link_table_data = Util.getTableData(link_table_path);
                                                if (!~link_table_data['prototype'].indexOf(link_info[1])) {
                                                    callback(new Error("Database Error: Can't create the table \"" + name + "\". An error occur when linking the column \"" + field + "\" with the column \"" + link[1] + "\", the column \"" + link_info[1] + "\" doesn't exist in the table \"" + link_info[0] + "\" ."));
                                                }
                                                if ((link_table_data.properties.hasOwnProperty('primary_keys') && !~link_table_data.properties.primary_keys.indexOf(link_info[1])) || (link_table_data.properties.hasOwnProperty('unique_keys') && !~link_table_data.properties.unique_keys.indexOf(link_info[1]))) {
                                                    callback(new Error("Database Error: Can't create the table \"" + name + "\". An error occur when linking the column \"" + field + "\" with the column \"" + link[1] + "\", the column \"" + link_info[1] + "\" is not a PRIMARY KEY or an UNIQUE KEY in the table \"" + link_info[0] + "\" ."));
                                                }
                                            }
                                        };
                                    })(link_table_path, link_info));
                                }
                            } else {
                                prototype[field].type = 'string';
                            }
                            fields.push(field);
                        }
                    }

                    properties = Util.concat(properties, prototype);
                    fields.unshift('#rowid');
                    var data = {
                        'prototype': fields,
                        'properties': properties,
                        'data': {}
                    };

                    if (_f.openSync(table_path, 'w')) {
                        _f.chmod(table_path, 0x1ff, function (err) {
                            if (err) {
                                callback(err);
                            } else {
                                _f.writeFile(table_path, JSON.stringify(data), function (err) {
                                    if (err) {
                                        callback(err);
                                    } else {
                                        instance.benchmark.mark('Database_(createTable)_end');
                                        callback(null);
                                    }
                                });
                            }
                        });
                    } else {
                        instance.benchmark.mark('Database_(createTable)_end');
                        callback(new Error("Database Error: Can't create file \"" + table_path + "\"."));
                    }
                }
            }.bind(this));
        }.bind(this));
    };

    /**
     * Sends a Database query.
     * @param {string} query The query.
     * @throws {Error}
     * @return {*}
     */
    Database.prototype.query = function (query) {
        return (require('./Query')(query, this))._query();
    };

    /**
     * Sends a Database query asynchronously
     * @param {string}   query    The query.
     * @param {function} callback The callback
     */
    Database.prototype.async.query = function (query, callback) {
        callback = callback || null;

        if (null === callback || !(typeof callback === 'function')) {
            throw new Error("Database Error: Can't send a query asynchronously without a callback.");
        }

        setImmediate(function() {
            (require('./Query')(query, instance)).async._query(callback);
        }.bind(this));
    };

    /**
     * Sends a prepared query.
     * @param {string} query The query
     * @return {PreparedQueryStatement}
     */
    Database.prototype.prepare = function (query) {
        return (require('./Query')(query, this))._prepare();
    };

    /**
     * Sends a prepared query asynchronously
     * @param {string}   query    The query
     * @param {function} callback The callback
     */
    Database.prototype.async.prepare = function (query, callback) {
        callback = callback || null;

        if (null === callback || !(typeof callback === 'function')) {
            throw new Error("Database Error: Can't prepare a query asynchronously without a callback.");
        }

        setImmediate(function() {
            var q = require('./Query')(query, instance);
            callback(null, q._prepare());
        });
    };

    return Database;
})();

// Exports the module
module.exports = function(server, username, password, database) {
    return new Database(server, username, password, database);
};
