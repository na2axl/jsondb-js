/**
 * JSONDB - JSON Database Manager
 *
 * Manage JSON files as databases with JSONDB Query Language (JQL)
 *
 * This content is released under the GPL License (GPL-3.0)
 *
 * Copyright (c) 2016, Centers Technologies
 *
 * @package    JSONDB
 * @author     Nana Axel
 * @copyright  Copyright (c) 2016, Centers Technologies
 * @license    http://opensource.org/licenses/MIT MIT License
 * @filesource
 */

/**
 * Class Query
 *
 * @package     JSONDB
 * @subpackage  Query
 * @category    Direct query
 * @author      Nana Axel
 */
var Query = (function () {
    /**
     * Current Query instance
     * @type {Query}
     */
    // var instance;

    function Query(query, database) {
        this.cache = require('./Cache');
        this.queryParser = new (require('./QueryParser'))();
        this.queryString = query;
        this.database = database;

        this.async._i = this;
    }

    /**
     * Database connection
     * @type {Database}
     */
    Query.prototype.database = null;

    /**
     * Cache manager
     * @type {Cache}
     */
    Query.prototype.cache = null;

    /**
     * The name of the current used table
     * @type {string|null}
     */
    Query.prototype.table = null;

    /**
     * Query parser
     * @type {QueryParser}
     */
    Query.prototype.queryParser = null;

    /**
     * The query is prepared ?
     * @type {boolean}
     */
    Query.prototype.queryPrepared = false;

    /**
     * The prepared query is executed ?
     * @type {boolean}
     */
    Query.prototype.queryExecuted = false;

    /**
     * The parsed query
     * @type {object}
     */
    Query.prototype.queryResults = {};

    /**
     * The query string
     * @type {string|null}
     */
    Query.prototype.queryString = null;

    /**
     * The parsed query
     * @type {object}
     */
    Query.prototype.parsedQuery = {};

    /**
     * Namespace for async operations
     * @type {object}
     */
    Query.prototype.async = {};

    /**
     * Gets the benchmark
     * @return {Benchmark}
     */
    Query.prototype.bench = function () {
        return this.database.bench();
    };

    /**
     * Sends a Database query.
     * @throws {Error}
     * @return {*}
     */
    Query.prototype._query = function (query) {
        this.queryString = query || this.queryString;

        try {
            this.parsedQuery = this.queryParser.parse(this.getQueryString());
        } catch (e) {
            throw e;
        }

        this.queryPrepared = false;
        this.queryExecuted = false;

        return this._execute();
    };

    /**
     * Sends a Database query asynchronously
     * @param {function} callback The callback
     */
    Query.prototype.async._query = function (query, callback) {
        this._i._queryAsync(query, callback);
    };

    Query.prototype._queryAsync = function(query, callback) {
        callback = callback || null;
        this.queryString = query || this.queryString;

        if (null === callback || !(typeof callback === 'function')) {
            throw new Error("Database Error: Can't send a query asynchronously without a callback.");
        }

        try {
            this.parsedQuery = this.queryParser.parse(this.getQueryString());
        } catch (e) {
            callback(e, null);
        }

        this.queryPrepared = false;
        this.queryExecuted = false;

        this._executeAsync(callback);
    };

    /**
     * Sends a prepared query
     * @return {PreparedQueryStatement}
     */
    Query.prototype._prepare = function (query) {
        this.queryPrepared = true;
        this.queryExecuted = false;
        this.queryString = query || this.queryString;

        return new (require('./PreparedQueryStatement'))(this.getQueryString(), this);
    };

    /**
     * Executes a query
     * @return mixed
     * @throws Exception
     * @private
     */
    Query.prototype._execute = function () {
        if (!this.queryIsExecuted()) {
            if (null === this.database || null === this.parsedQuery) {
                throw new Error("Query Error: Can't execute the query. No query/table selected or internal error.");
            }

            this.setTable(this.parsedQuery.table);

            var Util = new (require('./Util'))();
            var lockFile = require('lockfile');
            var table_path = Util._getTablePath(this.database.getServer(), this.database.getDatabase(), this.table);

            if (!Util.existsSync(table_path)) {
                throw new Error("Query Error: Can't execute the query. The table \"" + this.table + "\" doesn't existsSync in query \"" + this.database + "\" or file access denied.");
            }

            try {
                while (lockFile.checkSync(table_path + '.lock')) {
                    Util.waitFor(100);
                }

                this.database.bench().mark('jsondb_(query)_start');
                lockFile.lockSync(table_path + '.lock');

                var json_array = this.cache.get(table_path);
                var method = "_" + this.parsedQuery.action;

                this.queryExecuted = true;

                var result = this[method](json_array);

                lockFile.unlockSync(table_path + '.lock');
                this.database.bench().mark('jsondb_(query)_end');

                return result;
            } catch (e) {
                if (lockFile.checkSync(table_path + '.lock')) {
                    lockFile.unlockSync(table_path + '.lock');
                }
                this.queryExecuted = false;
                throw e;
            }
        } else {
            throw new Error('Query Error: There is no query to execute, or the query is already executed.');
        }
    };

    /**
     * Executes a query asynchronously
     * @private
     */
    Query.prototype.async._execute = function (callback) {
        this._i._executeAsync(callback);
    };

    Query.prototype._executeAsync = function(callback) {
        if (!this.queryIsExecuted()) {
            if (null === this.database || null === this.parsedQuery) {
                callback(new Error("Query Error: Can't execute the query. No query/table selected or internal error."), null);
            }

            this.setTable(this.parsedQuery.table);

            var Util = new (require('./Util'))();
            var lockFile = require('lockfile');
            var table_path = Util._getTablePath(this.database.getServer(), this.database.getDatabase(), this.table);

            Util.exists(table_path, (function (callback, _this) {
                return function (exists) {
                    if (!exists) {
                        callback(new Error("Query Error: Can't execute the query. The table \"" + _this.table + "\" doesn't exists in query \"" + _this.database + "\" or file access denied."), null);
                    } else {
                        try {
                            (new (require('./Util'))()).whilst(
                                function () {
                                    return lockFile.checkSync(table_path + '.lock');
                                },
                                function (rewind) {
                                    setTimeout(function () {
                                        rewind();
                                    }, 100);
                                },
                                function (err) {
                                    if (err) {
                                        callback(err, null);
                                    } else {
                                        lockFile.lock(table_path + '.lock', function (err) {
                                            if (err) {
                                                callback(err, null);
                                            } else {
                                                var json_array = _this.cache.get(table_path);
                                                var method = "_" + _this.parsedQuery.action;

                                                _this.queryExecuted = true;

                                                _this.database.bench().mark('jsondb_(query)_start');
                                                var res = _this[method](json_array);
                                                _this.database.bench().mark('jsondb_(query)_end');

                                                lockFile.unlock(table_path + '.lock', function (err) {
                                                    if (err) {
                                                        callback(err, null);
                                                    } else {
                                                        callback(null, res);
                                                    }
                                                });
                                            }
                                        });
                                    }
                                }
                            );
                        }
                        catch (e) {
                            callback(e, null);
                        }
                    }
                };
            })(callback, this));
        } else {
            callback(new Error('Query Error: There is no query to execute, or the query is already executed.'), null);
        }
    };

    /**
     * Checks if the query is prepared.
     * @return {boolean}
     */
    Query.prototype.queryIsPrepared = function () {
        return this.queryPrepared === true;
    };

    /**
     * Checks if the query is executed.
     * @return {boolean}
     */
    Query.prototype.queryIsExecuted = function () {
        return this.queryExecuted === true;
    };

    /**
     * @param data
     * @param {boolean} min
     * @return {int|*}
     * @private
     */
    Query.prototype._getLastValidRowID = function (data, min) {
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
     * Gets the current query string
     * @return {string}
     */
    Query.prototype.getQueryString = function () {
        return this.queryString;
    };

    /**
     * Change the currently used table
     * @param {string} table The table's name
     * @throws {Error}
     * @return {Query}
     */
    Query.prototype.setTable = function (table) {
        if (null === this.database.getDatabase()) {
            throw new Error("Query Error: Can't use the table \"" + table + "\", there is no query selected.");
        }
        var Util = new (require('./Util'))();
        var path = Util._getTablePath(this.database.getServer(), this.database.getDatabase(), table);
        if (!(Util.existsSync(path))) {
            throw new Error("Query Error: Can't use the table \"" + table + "\", the table doesn't exist in the query.");
        }
        this.table = table;
        return this;
    };

    /**
     * Returns the currently used table.
     * @return {string}
     */
    Query.prototype.getTable = function () {
        return this.table;
    };

    /**
     * Parses a value
     *
     * @param {*} value
     * @param {object} properties
     * @return {float|number|string}
     * @throws {Error}
     */
    Query.prototype._parseValue = function (value, properties) {
        var Util = new (require('./Util'))();
        if (null !== value || (properties.hasOwnProperty('not_null') && true === properties.not_null)) {
            if (properties.hasOwnProperty('type')) {
                if (/link\((.+)\)/.test(properties.type)) {
                    var link = properties.type.match(/link\((.+)\)/);
                    var link_info = link[1].split('.');
                    var link_table_path = Util._getTablePath(this.database.getServer(), this.database.getDatabase(), link_info[0]);
                    var link_table_data = Util.getTableData(link_table_path);
                    value = this._parseValue(value, link_table_data.properties[link_info[1]]);
                    for (var linkID in link_table_data.data) {
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
     * Executes a function and return the result
     * @param {string} func The query function to execute
     * @return {*}
     * @throws {Error}
     * @private
     */
    Query.prototype._parseFunction = function (func, value) {
        var Util = new (require('./Util'))();

        switch (func) {
            case 'sha1':
                var shasum = require('crypto').createHash('sha1');
                shasum.update(value);
                return shasum.digest("HEX");

            case 'md5':
                var md5 = require('crypto').createHash('md5');
                md5.update(value);
                return md5.digest("HEX");

            case 'lowercase':
                return value.toLowerCase();

            case 'uppercase':
                return value.toUpperCase();

            case 'ucfirst':
                var first = value[0].toUpperCase();
                return first + value.substr(1).toLowerCase();

            case 'strlen':
                return value.length;

            default:
                throw new Error("JSONDB Query Parse Error: Sorry but the function " + func + "() is not implemented in JQL.");
        }
    };

    /**
     * The select() query
     * @param {object}   data
     * @return {QueryResult}
     * @throws {Error}
     */
    Query.prototype._select = function (data) {
        var result = data.data;
        var field_links = [];
        var column_links = [];
        var i, l, max, name, index, field, linkID, o;

        var Util = new (require('./Util'))();

        for (name in this.parsedQuery.extensions) {
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
                            for (i = 0, l = parameters.length; i < l; i++) {
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
            for (index in result) {
                if (result.hasOwnProperty(index)) {
                    var result_p = result[index];
                    for (field in links) {
                        if (links.hasOwnProperty(field)) {
                            var columns = links[field];
                            if (/link\((.+)\)/.test(data.properties[field].type)) {
                                var link = data.properties[field].type.match(/link\((.+)\)/);
                                var link_info = link[1].split('.');
                                var link_table_path = Util._getTablePath(this.database.getServer(), this.database.getDatabase(), link_info[0]);
                                var link_table_data = Util.getTableData(link_table_path);
                                for (linkID in link_table_data.data) {
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
                    var res = [];
                    for (i = 0, max = this.parsedQuery.parameters.length; i < max; ++i) {
                        var field = this.parsedQuery.parameters[i];
                        if (/\w+\(.*\)/.test(field)) {
                            var parts = field.match(/(\w+)\((.*)\)/);
                            var name = parts[1].toLowerCase();
                            var param = parts[2] || false;
                            if (param === false) {
                                throw new Error('JSONDB Error: Can\'t uset the function ' + name + ' without parameters');
                            }
                            res[field] = this._parseFunction(name, line[param]);
                        } else {
                            res[field] = line[field];
                        }
                    }
                    temp.push(res);
                }
            }
            if (this.parsedQuery.extensions.hasOwnProperty('as')) {
                for (i = 0, max = this.parsedQuery.parameters.length - this.parsedQuery.extensions.as.length; i < max; ++i) {
                    this.parsedQuery.extensions.as.push('null');
                }
                var replace = Util.combine(this.parsedQuery.parameters, this.parsedQuery.extensions.as);
                for (i = 0, l = temp.length; i < l; i++) {
                    for (o in replace) {
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

        return new (require('./QueryResult'))(this.queryResults, this);
    };

    /**
     * The insert() query
     * @param {object}   data
     * @return {boolean}
     * @throws {Error}
     */
    Query.prototype._insert = function (data) {
        var Util = new (require('./Util'))();
        var rows = Util.values(Util.diff(data.prototype, ['#rowid']));
        var i, l, key, field, lid, slid, k, vl, value;

        if (this.parsedQuery.extensions.hasOwnProperty('in')) {
            rows = this.parsedQuery.extensions.in;
            for (i = 0, l = rows.length; i < l; i++) {
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
        insert['#' + lk_id] = {
            '#rowid': parseInt(data.properties.last_valid_row_id) + 1
        };
        for (key in this.parsedQuery.parameters) {
            if (this.parsedQuery.parameters.hasOwnProperty(key)) {
                value = this.parsedQuery.parameters[key];
                insert['#' + lk_id][rows[key]] = this._parseValue(value, data.properties[rows[key]]);
            }
        }

        if (this.parsedQuery.extensions.hasOwnProperty('and')) {
            for (i = 0, l = this.parsedQuery.extensions.and.length; i < l; i++) {
                var values = this.parsedQuery.extensions.and[i];
                values_nb = values.length;
                if (values_nb !== rows_nb) {
                    throw new Error("JSONDB Error: Can't insert data in the table \"" + this.table + "\". Invalid number of parameters (given \"" + values_nb + "\" values to insert in \"" + rows_nb + "\" columns).");
                }
                var to_add = {'#rowid': this._getLastValidRowID(Util.merge(current_data, insert), false) + 1};
                for (k = 0, vl = values.length; k < vl; k++) {
                    var v = values[k];
                    to_add[rows[k]] = this._parseValue(v, data.properties[rows[k]]);
                }
                insert['#' + (++lk_id)] = to_add;
            }
        }

        for (field in data.properties) {
            if (data.properties.hasOwnProperty(field)) {
                var property = data.properties[field];
                if (typeof property === 'object' && property.hasOwnProperty('auto_increment') && property.auto_increment) {
                    for (lid in insert) {
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

        var temp = {};
        for (i = 0, l = data.prototype.length; i < l; i++) {
            var column = data.prototype[i];
            for (lid in insert) {
                if (insert.hasOwnProperty(lid)) {
                    temp[lid] = temp[lid] || {};
                    if (!insert[lid].hasOwnProperty(column)) {
                        insert[lid][column] = this._parseValue(null, data.properties[column]);
                    }
                    temp[lid][column] = insert[lid][column];
                }
            }
        }

        insert = Util.merge(current_data, temp);

        var pk_error = false;
        var non_pk = Util.flip(Util.diff(data.prototype, data.properties.primary_keys));
        i = 0;
        for (lid in insert) {
            if (insert.hasOwnProperty(lid)) {
                var array_data = Util.diff_key(insert[lid], non_pk);
                for (slid in Util.slice(insert, i + 1)) {
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
                                throw new Error("JSONDB Error: Can't insert value. Duplicate values \"" + value[uk] + "\" for unique key \"" + uk + "\".");
                            }
                        }
                    }
                    i++;
                }
            }
            i = 0;
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

        var path = Util._getTablePath(this.database.getServer(), this.database.getDatabase(), this.table);
        this.cache.update(path, data);

        var _f = require('fs');

        try {
            _f.writeFileSync(path, JSON.stringify(data));
            return true;
        } catch (e) {
            throw e;
        }
    };

    /**
     * The replace() query
     * @param {object}   data
     * @return {boolean}
     * @throws {Error}
     */
    Query.prototype._replace = function (data) {
        var Util = new (require('./Util'))();
        var rows = Util.values(Util.diff(data.prototype, ['#rowid']));
        var i, l, key, k, vl, field, slid, lid;

        if (this.parsedQuery.extensions.hasOwnProperty('in')) {
            rows = this.parsedQuery.extensions.in;
            for (i = 0, l = rows.length; i < l; i++) {
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
        for (key in this.parsedQuery.parameters) {
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
                for (k = 0, vl = values.length; k < vl; k++) {
                    var v = values[k];
                    if (!(null === value && data.properties[rows[key]].hasOwnProperty('auto_increment') && true === data.properties[rows[key]]['auto_increment'])) {
                        to_add[rows[k]] = this._parseValue(v, data.properties[rows[k]]);
                    }
                }
                insert.push(to_add);
            }
        }

        i = 0;
        for (field in current_data) {
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
                for (slid in Util.slice(insert, i + 1)) {
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
                                throw new Error("JSONDB Error: Can't insert value. Duplicate values \"" + value[uk] + "\" for unique key \"" + uk + "\".");
                            }
                        }
                    }
                    i++;
                }
            }
            i = 0;
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
        data['properties']['last_insert_id'] = last_ai;

        var path = Util._getTablePath(this.database.getServer(), this.database.getDatabase(), this.table);
        this.cache.update(path, data);

        var _f = require('fs');

        try {
            _f.writeFileSync(path, JSON.stringify(data));
            return true;
        } catch (e) {
            throw e;
        }
    };

    /**
     * The delete() query
     * @param {object}   data
     * @return {boolean}
     * @throws {Error}
     */
    Query.prototype._delete = function (data) {
        var Util = new (require('./Util'))();
        var current_data = data.data;
        var to_delete = current_data
        var i, l, key, lid;

        if (this.parsedQuery.extensions.hasOwnProperty('where')) {
            var out = {};
            for (i = 0, l = this.parsedQuery.extensions.where.length; i < l; i++) {
                out = Util.concat(out, this._filter(to_delete, this.parsedQuery.extensions.where[i]));
            }
            to_delete = out;
        }

        for (key in to_delete) {
            if (to_delete.hasOwnProperty(key)) {
                if (current_data.hasOwnProperty(key)) {
                    delete current_data[key];
                }
            }
        }

        for (lid in current_data) {
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

        var path = Util._getTablePath(this.database.getServer(), this.database.getDatabase(), this.table);
        this.cache.update(path, data);

        var _f = require('fs');

        try {
            _f.writeFileSync(path, JSON.stringify(data));
            return true;
        } catch (e) {
            throw e;
        }
    };

    /**
     * The update() query
     * @param {object}   data
     * @return {boolean}
     * @throws {Error}
     */
    Query.prototype._update = function (data) {
        var Util = new (require('./Util'))();
        var result = data['data'];
        var i, l, lid, key, ul, id, row, field;

        if (this.parsedQuery.extensions.hasOwnProperty('where')) {
            var out = {};
            for (i = 0, l = this.parsedQuery.extensions.where.length; i < l; i++) {
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
        for (lid in data.data) {
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
        for (key = 0, ul = data.properties.unique_keys.length; key < ul; key++) {
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

        for (id in result) {
            if (result.hasOwnProperty(id)) {
                var res_line = result[id];
                for (row in values) {
                    if (values.hasOwnProperty(row)) {
                        result[id][row] = this._parseValue(values[row], data.properties[row]);
                    }
                }
                for (key in data.data) {
                    if (data.data.hasOwnProperty(key)) {
                        var data_line = data.data[key];
                        if (data_line['#rowid'] === res_line['#rowid']) {
                            data.data[key] = result;
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
        for (field in data.properties) {
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

        var path = Util._getTablePath(this.database.getServer(), this.database.getDatabase(), this.table);
        this.cache.update(path, data);

        var _f = require('fs');

        try {
            _f.writeFileSync(path, JSON.stringify(data));
            return true;
        } catch (e) {
            throw e;
        }
    };

    /**
     * The truncate() query
     * @param {object}   data
     * @return {boolean}
     * @throws {Error}
     */
    Query.prototype._truncate = function (data) {
        data['properties']['last_insert_id'] = 0;
        data['properties']['last_valid_row_id'] = 0;
        data['data'] = {};

        var Util = new (require('./Util'))();
        var path = Util._getTablePath(this.database.getServer(), this.database.getDatabase(), this.table);
        this.cache.update(path, data);

        var _f = require('fs');

        try {
            _f.writeFileSync(path, JSON.stringify(data));
            return true;
        } catch (e) {
            throw e;
        }
    };

    /**
     * The count() query
     * @param {object}   data
     * @return {QueryResult}
     * @throws {Error}
     */
    Query.prototype._count = function (data) {
        var cid, lid, i, l;
        var Util = new (require('./Util'))();
        var rows = Util.values(Util.diff(data['prototype'], ['#rowid']));
        if (!~this.parsedQuery.parameters.indexOf('*')) {
            rows = this.parsedQuery['parameters'];
        }

        if (this.parsedQuery.extensions.hasOwnProperty('where')) {
            var out = {};
            for (i = 0, l = this.parsedQuery.extensions.where.length; i < l; i++) {
                out = Util.concat(out, this._filter(data.data, this.parsedQuery.extensions.where[i]));
            }
            data.data = out;
        }

        var result = [];
        if (this.parsedQuery.extensions.hasOwnProperty('group')) {
            var used = [];
            for (lid in data.data) {
                if (data.data.hasOwnProperty(lid)) {
                    var array_data_p = data.data[lid];
                    var current_column = this.parsedQuery.extensions.group[0];
                    var current_data = array_data_p[current_column];
                    var current_counter = 0;
                    if (!~used.indexOf(current_data)) {
                        for (cid in data.data) {
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

        return new (require('./QueryResult'))(result, this);
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
    Query.prototype._filter = function (data, filters) {
        var Util = new (require('./Util'))();
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
                    var value = line[filter.field];
                    if (/\w+\(.*\)/.test(filter.field)) {
                        var parts = filter.field.match(/(\w+)\((.*)\)/);
                        var name = parts[1].toLowerCase();
                        var param = parts[2] || false;
                        if (param === false) {
                            throw new Error('JSONDB Error: Can\'t uset the function ' + name + ' without parameters');
                        }
                        value = this._parseFunction(name, line[param]);
                        filter.field = param;
                    }
                    if (!line.hasOwnProperty(filter.field)) {
                        throw new Error("JSONDB Error: The field \"" + filter.field + "\" doesn't exists in the table \"" + this.table + "\".");
                    }
                    switch (filter['operator']) {
                        case '<':
                            if (value < filter['value']) {
                                temp[line['#rowid']] = line;
                            }
                            break;

                        case '<=':
                            if (value <= filter['value']) {
                                temp[line['#rowid']] = line;
                            }
                            break;

                        case '=':
                            if (value === filter['value']) {
                                temp[line['#rowid']] = line;
                            }
                            break;

                        case '>=':
                            if (value >= filter['value']) {
                                temp[line['#rowid']] = line;
                            }
                            break;

                        case '>':
                            if (value > filter['value']) {
                                temp[line['#rowid']] = line;
                            }
                            break;

                        case '!=':
                        case '<>':
                            if (value !== filter['value']) {
                                temp[line['#rowid']] = line;
                            }
                            break;

                        case '%=':
                            if (0 === (value % filter['value'])) {
                                temp[line['#rowid']] = line;
                            }
                            break;

                        case '%!':
                            if (0 !== (value % filter['value'])) {
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

    return Query;
})();

// Exports the module
module.exports = Query;
