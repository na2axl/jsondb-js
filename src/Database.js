/**
 * Class Database
 *
 * @package    Database
 * @subpackage Database
 * @category   Database
 * @author     Nana Axel
 */
var Database = function (server, username, password, database) {
    server = server || null;
    username = username || null;
    database = database || null;

    if (null === server || null === username || null === password) {
        throw new Error('Database Error: Can\'t connect to the server, missing parameters.');
    }

    this.cache = require('./Cache')(this);
    this.queryParser = require('./QueryParser');
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
};

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
 * The name of the current used table
 * @type {string|null}
 */
Database.prototype.table = null;

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
 * The query is prepared ?
 * @type {boolean}
 */
Database.prototype.queryPrepared = false;

/**
 * The prepared query is executed ?
 * @type {boolean}
 */
Database.prototype.queryExecuted = false;

/**
 * The query string
 * @type {string|null}
 */
Database.prototype.queryString = null;

/**
 * The parsed query
 * @type {object}
 */
Database.prototype.parsedQuery = {};

/**
 * The parsed query
 * @type {object}
 */
Database.prototype.queryResults = {};

/**
 * Cache manager
 * @type {Cache}
 */
Database.prototype.cache = null;

/**
 * Query parser
 * @type {QueryParser}
 */
Database.prototype.queryParser = null;

/**
 * Config manager
 * @type {Configuration}
 */
Database.prototype.config = null;

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
    this.database = database;
    return this;
};

/**
 * Change the currently used table
 * @param {string} table The table's name
 * @throws {Error}
 * @return {Database}
 */
Database.prototype.setTable = function (table) {
    if (null === this.database) {
        throw new Error("Database Error: Can't use the table \"" + table + "\", there is no database selected.");
    }
    this.table = table;
    return this;
};

/**
 * Gets the current query string
 * @return {string}
 */
Database.prototype.getQueryString = function () {
    return this.queryString;
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
 * Returns the currently used table.
 * @return {string}
 */
Database.prototype.getTable = function () {
    return this.table;
};

/**
 * Returns the current benchmark instance.
 * @return {Benchmark}
 */
Database.prototype.bench = function () {
    return this.benchmark;
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
    var path = this._getDatabasePath(name);

    if (_f.existsSync(path)) {
        this.benchmark.mark('Database_(createDatabase)_end');
        throw new Error("Database Error: Can't create the database \"" + name + "\" in the server \"" + this.server + "\", the database already exist.");
    }

    if (!_f.mkdirSync(path, 0x1ff) && !_f.lstatSync(path).isDirectory()) {
        this.benchmark.mark('Database_(createDatabase)_end');
        throw new Error("Database Error: Can't create the database \"" + name + "\" in the server \"" + this.server + "\".");
    }

    _f.chmodSync(path, 0x1ff);

    this.benchmark.mark('Database_(createDatabase)_end');

    return this;
};

/**
 * Disconnnects to a server
 */
Database.prototype.disconnect = function () {
    this.benchmark.mark('Database_(disconnect)_start');
    this.server = null;
    this.database = null;
    this.table = null;
    this.username = '';
    this.password = '';
    this.benchmark.mark('Database_(disconnect)_end');
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

    var table_path = this._getTablePath(name);
    var _f = require('fs');

    if (_f.existsSync(table_path)) {
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
                    var link_table_path = this._getTablePath(link_info[0]);

                    if (!_f.existsSync(link_table_path)) {
                        throw new Error("Database Error: Can't create the table \"" + name + "\". An error occur when linking the column \"" + field + "\" with the column \"" + link[1] + "\", the table \"" + link_info[0] + "\" doesn't exist in the database \"" + this.database + "\".");
                    }

                    var link_table_data = this.getTableData(link_table_path);
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

    properties = require('./Util').concat(properties, prototype);
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
 * Sends a Database query.
 * @param {string} query The query.
 * @throws {Error}
 * @return {*}
 */
Database.prototype.query = function (query) {
    try {
        this.parsedQuery = this.queryParser.parse(query);
    } catch (e) {
        throw e;
    }

    this.queryString = query;
    this.queryExecuted = false;
    this.queryPrepared = false;

    return this._execute();
};

/**
 * Sends a prepared query.
 * @param {string} query The query
 * @return {PreparedQueryStatement}
 */
Database.prototype.prepare = function (query) {
    this.queryString = query;
    this.queryPrepared = true;

    return new require('./PreparedQueryStatement')(query, this);
};

/**
 * Executes a query
 * @return mixed
 * @throws Exception
 * @private
 */
Database.prototype._execute = function () {
    if (!this.queryIsExecuted()) {
        if (null === this.database || null === this.parsedQuery) {
            throw new Error("Database Error: Can't execute the query. No database/table selected or internal error.");
        }

        this.setTable(this.parsedQuery.table);

        var table_path = this._getTablePath();
        var _f = require('fs');

        if (!_f.existsSync(table_path)) {
            throw new Error("Database Error: Can't execute the query. The table \"" + this.table + "\" doesn't exists in database \"" + this.database + "\" or file access denied.");
        }

        var json_array = this.cache.get(table_path);
        var method = "_" + this.parsedQuery.action;

        this.benchmark.mark('Database_(query)_start');
        var result = this[method](json_array);
        this.benchmark.mark('Database_(query)_end');

        this.queryExecuted = true;

        return result;
    } else {
        throw new Error('Database Error: There is no query to execute, or the query is already executed.');
    }
};

/**
 * Returns a table's data
 * @param {string|null} path The path to the table
 * @return {object}
 */
Database.prototype.getTableData = function (path) {
    path = path || null;
    var _f = require('fs');
    return JSON.parse(_f.readFileSync(null !== path ? path : this._getTablePath()));
};

/**
 * Checks if the query is prepared.
 * @return {boolean}
 */
Database.prototype.queryIsPrepared = function () {
    return this.queryPrepared === true;
};

/**
 * Checks if the query is executed.
 * @return {boolean}
 */
Database.prototype.queryIsExecuted = function () {
    return this.queryExecuted === true;
};

/**
 * @param data
 * @param {boolean} min
 * @return {int|*}
 * @private
 */
Database.prototype._getLastValidRowID = function (data, min) {
    var last_valid_row_id = 0;
    for (var index in data) {
        if (data.hasOwnProperty(index)) {
            var line = data[index];
            if (last_valid_row_id === 0) {
                last_valid_row_id = line['#rowid'];
            } else {
                last_valid_row_id = (true === min) ? Math.min(last_valid_row_id, line['#rowid']) : Math.max(last_valid_row_id, line['#rowid']);
            }
        }
    }
    return last_valid_row_id;
};

/**
 * Gets the path to a database
 *
 * @param {string} database
 * @return {string}
 * @private
 */
Database.prototype._getDatabasePath = function (database) {
    database = database || null;
    return (null !== database) ? this.server + "/" + database : this.server + "/" + this.database;
};

/**
 * Returns the path to a table
 * @param {null|string} table The table name
 * @return {string}
 * @private
 */
Database.prototype._getTablePath = function (table) {
    table = table || null;
    return (null !== table) ? this.server + "/" + this.database + "/" + table + ".json" : this.server + "/" + this.database + "/" + this.table + ".json";
};

/**
 * Gets a table's content
 * @param {null|string} table The table's name
 * @return {object}
 * @private
 */
Database.prototype._getTableContent = function (table) {
    table = table || null;
    var filename = this._getTablePath(this.table);
    var _f = require('fs');

    if (null !== table) {
        filename = this._getTablePath(table);
    }

    return JSON.parse(_f.readFileSync(filename));
};

/**
 * Parses a value
 *
 * @param {*} value
 * @param {object} properties
 * @return {float|number|string}
 * @throws {Error}
 * @private
 */
Database.prototype._parseValue = function (value, properties) {
    if (null !== value || (properties.hasOwnProperty('not_null') && true === properties.not_null)) {
        if (properties.hasOwnProperty('type')) {
            if (/link\((.+)\)/.test(properties.type)) {
                var link = properties.type.match(/link\((.+)\)/);
                var link_info = link[1].split('.');
                var link_table_path = this._getTablePath(link_info[0]);
                var link_table_data = this.getTableData(link_table_path);
                value = this._parseValue(value, link_table_data.properties[link_info[1]]);
                for ( var linkID in link_table_data.data ) {
                    if (link_table_data.data.hasOwnProperty(linkID)) {
                        var data = link_table_data.data[linkID];
                        if (data[link_info[1]] === value) {
                            return linkID;
                        }
                    }
                }
                throw new Error("JSONDB Error: There is no value \"" + value + "\" in any rows of the table \"" + link_info[0] + "\" at the column \"" + link_info[1] + "\".");
            } else {
                switch (properties.type) {
                    case 'int':
                    case 'integer':
                    case 'number':
                        value = parseInt(value);
                        break;

                    case 'decimal':
                    case 'float':
                        value = parseFloat(value);
                        if (properties.hasOwnProperty('max_length')) {
                            value = value.toFixed(properties.max_length);
                        }
                        break;

                    case 'string':
                        value = value.toString();
                        if (properties.hasOwnProperty('max_length') && value.length > properties.max_length) {
                            value = value.substr(0, properties.max_length);
                        }
                        break;

                    case 'char':
                        value = value.toString()[0];
                        break;

                    case 'bool':
                    case 'boolean':
                        value = !!value;
                        break;

                    case 'array':
                        // Do nothing...
                        break;

                    default:
                        throw new Error("JSONDB Error: Trying to parse a value with an unsupported type \"{$properties['type']}\"");
                }
            }
        }
    } else if (properties.hasOwnProperty('default')) {
        value = this._parseValue(properties.default, properties);
    }

    return value;
};

/**
 * The select() query
 * @param {object} data
 * @return {QueryResult}
 * @throws {Error}
 */
Database.prototype._select = function (data) {
    var result = data.data;
    var field_links = [];
    var column_links = [];

    var Util = require('./Util');

    for (var name in this.parsedQuery.extensions) {
        if (this.parsedQuery.extensions.hasOwnProperty(name)) {
            var parameters = this.parsedQuery.extensions[name];
            switch (name) {
                case 'order':
                    var order_by = parameters[0];
                    var order_method = parameters[1];

                    Util.usort(result, (function (order_method, order_by) {
                        return function (after, now) {
                            if (order_method === 'desc') {
                                return now[order_by] > after[order_by];
                            } else {
                                return now[order_by] < after[order_by];
                            }
                        };
                    })(order_method, order_by));
                    break;

                case 'where':
                    if (parameters.length > 0) {
                        var out = [];
                        for (var i = 0, l = parameters.length; i < l; i++) {
                            out = out.concat(this._filter(result, parameters[i]));
                        }
                        result = out;
                    }
                    break;

                case 'limit':
                    result = result.slice(parameters[0], parameters[1]);
                    break;

                case 'on':
                    if (parameters.length > 0) {
                        for (i = 0, l = parameters.length; i < l; i++) {
                            field_links.push(parameters[i]);
                        }
                    }
                    break;

                case 'link':
                    if (parameters.length > 0) {
                        for (i = 0, l = parameters.length; i < l; i++) {
                            column_links.push(parameters[i]);
                        }
                    }
                    break;
            }
        }
    }

    if (field_links.length === column_links.length) {
        var links = Util.combine(field_links, column_links);
    } else {
        throw new Error('JSONDB Error: Invalid numbers of links. Given "' + field_links.length + '" columns to link but receive "' + column_links.length + '" links');
    }

    if (!(typeof links === 'undefined')) {
        for (var index in result) {
            if (result.hasOwnProperty(index)) {
                var result_p = result[index];
                for (var field in links) {
                    if (links.hasOwnProperty(field)) {
                        var columns = links[field];
                        if (/link\((.+)\)/.test(data.properties[field].type)) {
                            var link = data.properties[field].type.match(/link\((.+)\)/);
                            var link_info = link[1].split('.');
                            var link_table_path = this._getTablePath(link_info[0]);
                            var link_table_data = this.getTableData(link_table_path);
                            for (var linkID in link_table_data.data) {
                                if (link_table_data.data.hasOwnProperty(linkID)) {
                                    var value = link_table_data.data[linkID];
                                    if (linkID === result_p[field]) {
                                        if (!!~columns.indexOf('*')) {
                                            columns = Util.diff(link_table_data.prototype, ['#rowid']);
                                        }
                                        result[index][field] = Util.intersect_key(value, Util.flip(columns));
                                    }
                                }
                            }
                        } else {
                            throw new Error("JSONDB Error: Can't link tables with the column \"" + field + "\". The column is not of type link.");
                        }
                    }
                }
            }
        }
    }

    var temp = [];
    if (!!~this.parsedQuery.parameters.indexOf('last_insert_id')) {
        temp.last_insert_id = data.properties.last_insert_id;
    } else if (!~this.parsedQuery.parameters.indexOf('*')) {
        for (linkID in result) {
            if (result.hasOwnProperty(linkID)) {
                var line = result[linkID];
                temp.push(Util.intersect_key(line, Util.flip(this.parsedQuery.parameters)));
            }
        }
        if (this.parsedQuery.extensions.hasOwnProperty('as')) {
            for (i = 0, max = this.parsedQuery.parameters.length - this.parsedQuery.extensions.as.length; i < max; ++i) {
                this.parsedQuery.extensions.as.push('null');
            }
            var replace = Util.combine(this.parsedQuery.parameters, this.parsedQuery.extensions.as);
            for (i = 0, l = temp.length; i < l; i++) {
                for (var o in replace) {
                    if (replace.hasOwnProperty(o)) {
                        var n = replace[o];
                        if (n.toLowerCase() === 'null') {
                            continue;
                        }
                        temp[i][n] = temp[i][o];
                        delete temp[i][o];
                    }
                }
            }
        }
    } else {
        for (linkID in result) {
            if (result.hasOwnProperty(linkID)) {
                line = result[linkID];
                temp.push(Util.diff_key(line, {'#rowid': '#rowid'}));
            }
        }
    }

    this.queryResults = temp;

    return require('./QueryResult')(this.queryResults, this);
};

/**
 * The insert() query
 * @param {object} data
 * @return {boolean}
 * @throws {Error}
 */
Database.prototype._insert = function (data) {
    var Util = require('./Util');
    var rows = Util.values(Util.diff(data.prototype, ['#rowid']));

    if (this.parsedQuery.extensions.hasOwnProperty('in')) {
        rows = this.parsedQuery.extensions.in;
        for (var i = 0, l = rows.length; i < l; i++) {
            if (!~data.prototype.indexOf(rows[i])) {
                throw new Error("JSONDB Error: Can't insert data in the table \"" + this.table + "\". The column \"" + rows[i] + "\" doesn't exist.");
            }
        }
    }

    var values_nb = Util.count(this.parsedQuery.parameters);
    var rows_nb = rows.length;
    if (values_nb !== rows_nb) {
        throw new Error("JSONDB Error: Can't insert data in the table \"" + this.table + "\". Invalid number of parameters (given \"" + values_nb + "\" values to insert in \"" + rows_nb + "\" columns).");
    }
    var current_data = data.data;
    var ai_id = parseInt(data.properties.last_insert_id);
    var lk_id = parseInt(data.properties.last_link_id) + 1;
    var insert = {};
    insert['#'+lk_id] = {
        '#rowid' : parseInt(data.properties.last_valid_row_id) + 1
    };
    for (var key in this.parsedQuery.parameters) {
        if (this.parsedQuery.parameters.hasOwnProperty(key)) {
            var value = this.parsedQuery.parameters[key];
            insert['#'+lk_id][rows[key]] = this._parseValue(value, data.properties[rows[key]]);
        }
    }

    if (this.parsedQuery.extensions.hasOwnProperty('and')) {
        for (i = 0, l = this.parsedQuery.extensions.and.length; i < l; i++) {
            var values = this.parsedQuery.extensions.and[i];
            values_nb = values.length;
            if (values_nb !== rows_nb) {
                throw new Error("JSONDB Error: Can't insert data in the table \"" + this.table + "\". Invalid number of parameters (given \"" + values_nb + "\" values to insert in \"" + rows_nb + "\" columns).");
            }
            var to_add = {'#rowid' : this._getLastValidRowID(Util.merge(current_data, insert), false) + 1};
            for (var k = 0, vl = values.length; k < vl; k++) {
                var v = values[k];
                to_add[rows[k]] = this._parseValue(v, data.properties[rows[k]]);
            }
            insert['#' + (++lk_id)] = to_add;
        }
    }

    for (var field in data.properties) {
        if (data.properties.hasOwnProperty(field)) {
            var property = data.properties[field];
            if (typeof property === 'object' && property.hasOwnProperty('auto_increment') && property.auto_increment) {
                for (var lid in insert) {
                    if (insert.hasOwnProperty(lid)) {
                        if (insert[lid][field]) {
                            continue;
                        }
                        insert[lid][field] = ++ai_id;
                    }
                }
                break;
            }
        }
    }

    for (i = 0, l = data.prototype.length; i < l; i++) {
        var column = data.prototype[i];
        for (lid in insert) {
            if (insert.hasOwnProperty(lid)) {
                if (!~insert[lid].hasOwnProperty(column)) {
                    insert[lid][column] = this._parseValue(null, data.properties[column]);
                }
            }
        }
    }

    insert = Util.merge(current_data, insert);

    var pk_error = false;
    var non_pk = Util.flip(Util.diff(data.prototype, data.properties.primary_keys));
    i = 0;
    for (lid in insert) {
        if (insert.hasOwnProperty(lid)) {
            var array_data = Util.diff_key(insert[lid], non_pk);
            for (var slid in Util.slice(insert, i + 1)) {
                if (insert.hasOwnProperty(slid)) {
                    value = Util.diff_key(insert[slid], non_pk);
                    pk_error = !!(pk_error || ((JSON.stringify(value) === JSON.stringify(array_data)) && (Util.count(array_data) > 0)));
                    if (pk_error) {
                        values = Util.objectToArray(value).join(', ');
                        var keys = data.properties.primary_keys.join(', ');
                        throw new Error("JSONDB Error: Can't insert value. Duplicate values \"" + values + "\" for primary keys \"" + keys + "\".");
                    }
                }
            }
            i++;
        }
    }

    var uk_error = false;
    i = 0;
    for (key = 0, l = data.properties.unique_keys.length; key < l; key++) {
        var uk = data.properties.unique_keys[key];
        for (lid in insert) {
            if (insert.hasOwnProperty(lid)) {
                array_data = Util.intersect_key(insert[lid], Util.combine([uk], [uk]));
                for (slid in Util.slice(insert, i + 1)) {
                    if (insert.hasOwnProperty(slid)) {
                        value = Util.intersect_key(insert[slid], Util.combine([uk], [uk]));
                        uk_error = !!(uk_error || ((null !== value[uk]) && (JSON.stringify(value) === JSON.stringify(array_data))));
                        if (uk_error) {
                            throw new Error("JSONDB Error: Can't insert value. Duplicate values \""+ value[uk] + "\" for unique key \"" + uk + "\".");
                        }
                    }
                }
                i++;
            }
        }
    }

    for (lid in insert) {
        if (insert.hasOwnProperty(lid)) {
            Util.uksort(insert[lid], (function (data) {
                return function (after, now) {
                    return data.prototype.indexOf(now) < data.prototype.indexOf(after);
                };
            })(data));
        }
    }

    Util.uksort(insert, (function (insert) {
        return function (after, now) {
            return insert[now]['#rowid'] < insert[after]['#rowid'];
        };
    })(insert));

    var last_ai = 0;
    for (field in data.properties) {
        if (data.properties.hasOwnProperty(field)) {
            property = data.properties[field];
            if (typeof property === 'object' && property.hasOwnProperty('auto_increment') && true === property.auto_increment) {
                for (lid in insert) {
                    if (insert.hasOwnProperty(lid)) {
                        last_ai = Math.max(insert[lid][field], last_ai);
                    }
                }
                break;
            }
        }
    }

    data['data'] = insert;
    data['properties']['last_valid_row_id'] = this._getLastValidRowID(insert, false);
    data['properties']['last_insert_id'] = last_ai;
    data['properties']['last_link_id'] = lk_id;

    this.cache.update(this._getTablePath(), data);

    return !!require('fs').writeFileSync(this._getTablePath(), JSON.stringify(data));
};

/**
 * The replace() query
 * @param {object} data
 * @return {boolean}
 * @throws {Error}
 */
Database.prototype._replace = function (data) {
    var Util = require('./Util');
    var rows = Util.values(Util.diff(data.prototype, ['#rowid']));

    if (this.parsedQuery.extensions.hasOwnProperty('in')) {
        rows = this.parsedQuery.extensions.in;
        for (var i = 0, l = rows.length; i < l; i++) {
            if (!~data.prototype.indexOf(rows[i])) {
                throw new Error("JSONDB Error: Can't insert data in the table \"" + this.table + "\". The column \"" + rows[i] + "\" doesn't exist.");
            }
        }
    }

    var values_nb = Util.count(this.parsedQuery.parameters);
    var rows_nb = rows.length;
    if (values_nb !== rows_nb) {
        throw new Error("JSONDB Error: Can't insert data in the table \"" + this.table + "\". Invalid number of parameters (given \"" + values_nb + "\" values to insert in \"" + rows_nb + "\" columns).");
    }
    var current_data = data.data;
    var insert = [{}];
    for (var key in this.parsedQuery.parameters) {
        if (this.parsedQuery.parameters.hasOwnProperty(key)) {
            var value = this.parsedQuery.parameters[key];
            if (!(null === value && data.properties[rows[key]].hasOwnProperty('auto_increment') && true === data.properties[rows[key]]['auto_increment'])) {
                insert[0][rows[key]] = this._parseValue(value, data.properties[rows[key]])
            }
        }
    }

    if (this.parsedQuery.extensions.hasOwnProperty('and')) {
        for (i = 0, l = this.parsedQuery.extensions.and.length; i < l; i++) {
            var values = this.parsedQuery.extensions.and[i];
            var to_add = {};
            for (var k = 0, vl = values.length; k < vl; k++) {
                var v = values[k];
                if (!(null === value && data.properties[rows[key]].hasOwnProperty('auto_increment') && true === data.properties[rows[key]]['auto_increment'])) {
                    to_add[rows[k]] = this._parseValue(v, data.properties[rows[k]]);
                }
            }
            insert.push(to_add);
        }
    }

    i = 0;
    for (var field in current_data) {
        if (current_data.hasOwnProperty(field)) {
            current_data[field] = !(typeof insert[i] === 'undefined') ? Util.merge(current_data[field], insert[i]) : current_data[field];
            i++;
        }
    }

    insert = current_data;

    var pk_error = false;
    var non_pk = Util.flip(Util.diff(data.prototype, data.properties.primary_keys));
    i = 0;
    for (lid in insert) {
        if (insert.hasOwnProperty(lid)) {
            var array_data = Util.diff_key(insert[lid], non_pk);
            for (var slid in Util.slice(insert, i + 1)) {
                if (insert.hasOwnProperty(slid)) {
                    value = Util.diff_key(insert[slid], non_pk);
                    pk_error = !!(pk_error || ((JSON.stringify(value) === JSON.stringify(array_data)) && (Util.count(array_data) > 0)));
                    if (pk_error) {
                        values = Util.objectToArray(value).join(', ');
                        var keys = data.properties.primary_keys.join(', ');
                        throw new Error("JSONDB Error: Can't insert value. Duplicate values \"" + values + "\" for primary keys \"" + keys + "\".");
                    }
                }
            }
            i++;
        }
    }

    var uk_error = false;
    i = 0;
    for (key = 0, l = data.properties.unique_keys.length; key < l; key++) {
        var uk = data.properties.unique_keys[key];
        for (lid in insert) {
            if (insert.hasOwnProperty(lid)) {
                array_data = Util.intersect_key(insert[lid], Util.combine([uk], [uk]));
                for (slid in Util.slice(insert, i + 1)) {
                    if (insert.hasOwnProperty(slid)) {
                        value = Util.intersect_key(insert[slid], Util.combine([uk], [uk]));
                        uk_error = !!(uk_error || ((null !== value[uk]) && (JSON.stringify(value) === JSON.stringify(array_data))));
                        if (uk_error) {
                            throw new Error("JSONDB Error: Can't insert value. Duplicate values \""+ value[uk] + "\" for unique key \"" + uk + "\".");
                        }
                    }
                }
                i++;
            }
        }
    }

    for (lid in insert) {
        if (insert.hasOwnProperty(lid)) {
            Util.uksort(insert[lid], (function (data) {
                return function (after, now) {
                    return data.prototype.indexOf(now) < data.prototype.indexOf(after);
                };
            })(data));
        }
    }

    Util.uksort(insert, (function (insert) {
        return function (after, now) {
            return insert[now]['#rowid'] < insert[after]['#rowid'];
        };
    })(insert));

    var last_ai = 0;
    for (field in data.properties) {
        if (data.properties.hasOwnProperty(field)) {
            var property = data.properties[field];
            if (typeof property === 'object' && property.hasOwnProperty('auto_increment') && true === property.auto_increment) {
                for (var lid in insert) {
                    if (insert.hasOwnProperty(lid)) {
                        last_ai = Math.max(insert[lid][field], last_ai);
                    }
                }
                break;
            }
        }
    }

    data['data'] = insert;
    data['properties']['last_insert_id'] = last_ai;

    this.cache.update(this._getTablePath(), data);

    return !!require('fs').writeFileSync(this._getTablePath(), JSON.stringify(data));
};

/**
 * The delete() query
 * @param {object} data
 * @return {boolean}
 * @throws {Error}
 */
Database.prototype._delete = function (data) {
    var Util = require('./Util');
    var current_data = data.data;
    var to_delete = current_data;

    if (this.parsedQuery.extensions.hasOwnProperty('where')) {
        var out = {};
        for (var i = 0, l = this.parsedQuery.extensions.where.length; i < l; i++) {
            out = Util.concat(out, this._filter(to_delete, this.parsedQuery.extensions.where[i]));
        }
        to_delete = out;
    }

    for (var key in to_delete) {
        if (to_delete.hasOwnProperty(key)) {
            if (current_data.hasOwnProperty(key)) {
                delete current_data[key];
            }
        }
    }

    for (var lid in current_data) {
        if (current_data.hasOwnProperty(lid)) {
            Util.uksort(current_data[lid], (function (data) {
                return function (after, now) {
                    return data.prototype.indexOf(now) < data.prototype.indexOf(after);
                };
            })(data));
        }
    }

    Util.uksort(current_data, (function (insert) {
        return function (after, now) {
            return insert[now]['#rowid'] < insert[after]['#rowid'];
        };
    })(current_data));

    data['data'] = current_data;
    (Util.count(to_delete) > 0) ? data['properties']['last_valid_row_id'] = this._getLastValidRowID(to_delete) - 1 : null;

    this.cache.update(this._getTablePath(), data);

    return !!require('fs').writeFileSync(this._getTablePath(), JSON.stringify(data));
};

/**
 * The update() query
 * @param {object} data
 * @return {boolean}
 * @throws {Error}
 */
Database.prototype._update = function (data) {
    var Util = require('./Util');
    var result = data['data'];

    if (this.parsedQuery.extensions.hasOwnProperty('where')) {
        var out = {};
        for (var i = 0, l = this.parsedQuery.extensions.where.length; i < l; i++) {
            out = Util.concat(out, this._filter(result, this.parsedQuery.extensions.where[i]));
        }
        result = out;
    }

    if (!this.parsedQuery.extensions.hasOwnProperty('with')) {
        throw new Error("JSONDB Error: Can't execute the \"update()\" query without values. The \"with()\" extension is required.");
    }

    var fields_nb = this.parsedQuery.parameters.length;
    var values_nb = this.parsedQuery.extensions.with.length;
    if (fields_nb !== values_nb) {
        throw new Error("JSONDB Error: Can't execute the \"update()\" query. Invalid number of parameters (trying to update \"" + fields_nb + "\" columns with \"" + values_nb + "\" values).");
    }

    var values = Util.combine(this.parsedQuery.parameters, this.parsedQuery.extensions.with);

    var pk_error = false;
    var non_pk = Util.flip(Util.diff(data.prototype, data.properties.primary_keys));
    for (var lid in data.data) {
        if (data.data.hasOwnProperty(lid)) {
            var array_data = Util.diff_key(data.data[lid], non_pk);
            pk_error = !!(pk_error || ((JSON.stringify(Util.diff_key(values, non_pk)) === JSON.stringify(array_data)) && (Util.count(array_data) > 0)));
            if (pk_error) {
                var v = Util.objectToArray(array_data).join(', ');
                var k = data.properties.primary_keys.join(', ');
                throw new Error("JSONDB Error: Can't insert value. Duplicate values \"" + v + "\" for primary keys \"" + k + "\".");
            }
        }
    }

    var uk_error = false;
    for (var key = 0, ul = data.properties.unique_keys.length; key < ul; key++) {
        var uk = data.properties.unique_keys[key];
        var item = Util.intersect_key(values, Util.combine([uk], [uk]));
        for (lid in data.data) {
            if (data.data.hasOwnProperty(lid)) {
                array_data = Util.intersect_key(data.data[lid], Util.combine([uk], [uk]));
                uk_error = !!(uk_error || ((null !== item[uk]) && (JSON.stringify(item) === JSON.stringify(array_data))));
                if (uk_error) {
                    throw new Error("JSONDB Error: Can't insert value. Duplicate values \"" + item[uk] + "\" for unique key \"" + uk + "\".");
                }
            }
        }
    }

    for (var id in result) {
        if (result.hasOwnProperty(id)) {
            var res_line = result[id];
            for (var row in values) {
                if (values.hasOwnProperty(row)) {
                    result[id][row] = this._parseValue(values[row], data.properties[row]);
                }
            }
            for (key in data.data) {
                if (data.data.hasOwnProperty(key)) {
                    var data_line = data.data[key];
                    if (data_line['#rowid'] === res_line['#rowid']) {
                        data.data[key] = result['#rowid'];
                        break;
                    }
                }
            }
        }
    }

    for (lid in data.data) {
        if (data.data.hasOwnProperty(lid)) {
            Util.uksort(data.data[lid], (function (data) {
                return function (after, now) {
                    return data.prototype.indexOf(now) < data.prototype.indexOf(after);
                };
            })(data));
        }
    }

    Util.uksort(data.data, (function (insert) {
        return function (after, now) {
            return insert[now]['#rowid'] < insert[after]['#rowid'];
        };
    })(data.data));

    var last_ai = 0;
    for (var field in data.properties) {
        if (data.properties.hasOwnProperty(field)) {
            var property = data.properties[field];
            if (typeof property === 'object' && property.hasOwnProperty('auto_increment') && true === property.auto_increment) {
                for (lid in data.data) {
                    if (data.data.hasOwnProperty(lid)) {
                        last_ai = Math.max(data.data[lid][field], last_ai);
                    }
                }
                break;
            }
        }
    }

    data['properties']['last_insert_id'] = last_ai;

    this.cache.update(this._getTablePath(), data);

    return !!require('fs').writeFileSync(this._getTablePath(), JSON.stringify(data));
};

/**
 * The truncate() query
 * @param {object} data
 * @return {boolean}
 */
Database.prototype._truncate = function (data) {
    data['properties']['last_insert_id'] = 0;
    data['properties']['last_valid_row_id'] = 0;
    data['data'] = {};

    this.cache.update(this._getTablePath(), data);

    return !!require('fs').writeFileSync(this._getTablePath(), JSON.stringify(data));
};

/**
 * The count() query
 * @param {object} data
 * @return {QueryResult}
 * @throws Exception
 */
Database.prototype._count = function (data) {
    var Util = require('./Util');
    var rows = Util.values(Util.diff(data['prototype'], ['#rowid']));
    if (!~this.parsedQuery.parameters.indexOf('*')) {
        rows = this.parsedQuery['parameters'];
    }

    if (this.parsedQuery.extensions.hasOwnProperty('where')) {
        var out = {};
        for (var i = 0, l = this.parsedQuery.extensions.where.length; i < l; i++) {
            out = Util.concat(out, this._filter(data.data, this.parsedQuery.extensions.where[i]));
        }
        data.data = out;
    }

    var result = [];
    if (this.parsedQuery.extensions.hasOwnProperty('group')) {
        var used = [];
        for (var lid in data.data) {
            if (data.data.hasOwnProperty(lid)) {
                var array_data_p = data.data[lid];
                var current_column = this.parsedQuery.extensions.group[0];
                var current_data = array_data_p[current_column];
                var current_counter = 0;
                if (!~used.indexOf(current_data)) {
                    for (var cid in data.data) {
                        if (data.data.hasOwnProperty(cid)) {
                            var array_data_c = data.data[cid];
                            if (array_data_c[current_column] === current_data) {
                                ++current_counter;
                            }
                        }
                    }
                    var add = {};
                    if (this.parsedQuery.extensions.hasOwnProperty('as')) {
                        add[this.parsedQuery.extensions.as[0]] = current_counter;
                        add[current_column] = current_data;
                        result.push(add);
                    } else {
                        add['count(' + this.parsedQuery.parameters.join(',') + ')'] = current_counter;
                        result.push(add);
                    }
                    used.push(current_data);
                }
            }
        }
    } else {
        var counter = {};
        for (lid in data.data) {
            if (data.data.hasOwnProperty(lid)) {
                var array_data = data.data[lid];
                for (i = 0, l = rows.length; i < l; i++) {
                    var row = rows[i];
                    if (null !== array_data[row]) {
                        counter.hasOwnProperty(row) ? ++counter[row] : counter[row] = 1;
                    }
                }
            }
        }
        var count = Util.count(counter) > 0 ? Math.max(Util.objectToArray(counter)) : 0;

        if (this.parsedQuery.extensions.hasOwnProperty('as')) {
            result[this.parsedQuery.extensions.as[0]] = count;
        } else {
            result['count(' + this.parsedQuery.parameters.join(',') + ')'] = count;
        }

        result = [result];
    }

    return require('./QueryResult')(result, this);
};

/**
 * Iterates over each values of data and test them using conditions in filters
 *
 * If a value of data don't pass each condition of filters, it will be removed.
 *
 * @param {object} data The data to iterate over
 * @param {object} filters Conditions used to remove data which not correspond
 * @return {Array}
 * @throws {Error}
 */
Database.prototype._filter = function (data, filters) {
    var Util = require('./Util');
    var result = data;
    var temp = [];

    for (var i = 0, l = filters.length; i < l; i++) {
        var filter = filters[i];
        if (filter.value.toString().toLowerCase() === 'last_insert_id') {
            filter.value = data.properties.last_insert_id;
        }
        for (var lid in result) {
            if (result.hasOwnProperty(lid)) {
                var line = result[lid];
                if (!line.hasOwnProperty(filter.field)) {
                    throw new Error("JSONDB Error: The field \"" + filter.field + "\" doesn't exists in the table \"" + this.table + "\".");
                }
                switch (filter['operator']) {
                    case '<':
                        if (line[filter['field']] < filter['value']) {
                            temp[line['#rowid']] = line;
                        }
                        break;

                    case '<=':
                        if (line[filter['field']] <= filter['value']) {
                            temp[line['#rowid']] = line;
                        }
                        break;

                    case '=':
                        if (line[filter['field']] === filter['value']) {
                            temp[line['#rowid']] = line;
                        }
                        break;

                    case '>=':
                        if (line[filter['field']] >= filter['value']) {
                            temp[line['#rowid']] = line;
                        }
                        break;

                    case '>':
                        if (line[filter['field']] > filter['value']) {
                            temp[line['#rowid']] = line;
                        }
                        break;

                    case '!=':
                    case '<>':
                        if (line[filter['field']] !== filter['value']) {
                            temp[line['#rowid']] = line;
                        }
                        break;

                    case '%=':
                        if (0 === (line[filter['field']] % filter['value'])) {
                            temp[line['#rowid']] = line;
                        }
                        break;

                    case '%!':
                        if (0 !== (line[filter['field']] % filter['value'])) {
                            temp[line['#rowid']] = line;
                        }
                        break;

                    default:
                        throw new Error("JSONDB Error: The operator \"" + filter.operator + "\" is not supported. Try to use one of these operators: \"<\", \"<=\", \"=\", \">=\", \">\", \"<>\", \"!=\", \"%=\" or \"%!\".");
                }
            }
        }
        result = temp;
        temp = [];
    }

    return Util.values(result);
};

// Exports the module
module.exports = function(server, username, password, database) {
    return new Database(server, username, password, database);
};