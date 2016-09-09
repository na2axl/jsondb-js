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
 * Class PreparedQueryStatement
 *
 * @package		JSONDB
 * @subpackage  Utilities
 * @category    Configuration
 * @author		Nana Axel
 */
var PreparedQueryStatement = function (query, database) {
    this.queryString = query;
    this.database = database;

    this._prepareQuery();
};

/**
 * @type {string}
 */
PreparedQueryStatement.prototype.queryString = '';

/**
 * @type {Database}
 */
PreparedQueryStatement.prototype.database = null;

/**
 * @type {Array}
 */
PreparedQueryStatement.prototype.preparedQueryKeys = [];

/**
 * Binds a value in a prepared query.
 * @param {string} key The parameter's key
 * @param {string|number|boolean} value The parameter's value
 * @param {number} parse_method The parse method to use
 * @throws {Error}
 */
PreparedQueryStatement.prototype.bindValue = function (key, value, parse_method) {
    var JSONDB = require('./JSONDB');
    var Util = require('./Util');

    parse_method = parse_method || JSONDB.PARAM_STRING;
    if (this.database.queryIsPrepared()) {
        if (!!~this.preparedQueryKeys.indexOf(key)) {
            switch (parse_method) {
                default:
                case JSONDB.PARAM_STRING:
                    value = JSONDB.quote(value.toString());
                    break;

                case JSONDB.PARAM_INT:
                    value = parseInt(value);
                    break;

                case JSONDB.PARAM_BOOL:
                    value = parseInt(value) + ':JSONDB::TO_BOOL:';
                    break;

                case JSONDB.PARAM_NULL:
                    value = value.toString() + ':JSONDB::TO_NULL:';
                    break;

                case JSONDB.PARAM_ARRAY:
                    value = JSONDB.quote(Util.serialize(value)) + ':JSONDB::TO_ARRAY:';
                    break;
            }
            this.queryString = this.queryString.replace(key, value);
        } else {
            throw new Error("JSONDB Error: Can't bind the value \"" + value + "\" for the key \"" + key + "\". The key isn't in the query.");
        }
    } else {
        throw new Error("JSONDB Error: Can't use JSONDB::bindValue() with non prepared queries. Send your query with JSONDB::prepare() first.");
    }
};

/**
 * Execute the prepared query
 * @throws {Error}
 * @return {*}
 */
PreparedQueryStatement.prototype.execute = function () {
    if (this.database.queryIsPrepared()) {
        return this.database.query(this.queryString);
    } else {
        throw new Error("JSONDB Error: Can't execute the prepared query. There is no prepared query to execute or the prepared query is already executed.");
    }
};

/**
 * Prepare a query
 * @return {PreparedQueryStatement}
 */
PreparedQueryStatement.prototype._prepareQuery = function () {
    this.preparedQueryKeys = this.queryString.match(/(:[\w]+)/g);
};

// Exports the module
module.exports = function (results, database) {
    return new PreparedQueryStatement(results, database);
};