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
 * @license	   http://opensource.org/licenses/MIT MIT License
 * @filesource
 */

/**
 * Class PreparedQueryStatement
 *
 * @package		JSONDB
 * @subpackage  Query
 * @category    Prepared query
 * @author		Nana Axel
 */
var PreparedQueryStatement = (function () {
    /**
     * Current PreparedQueryStatement instance
     * @type {PreparedQueryStatement}
     */
    var instance;

    function PreparedQueryStatement(query, database) {
        this.queryString = query;
        this.query = database;

        this._prepareQuery();

        instance = this;
    }

    /**
     * @type {string}
     */
    PreparedQueryStatement.prototype.queryString = '';

    /**
     * @type {Query}
     */
    PreparedQueryStatement.prototype.query = null;

    /**
     * @type {Array}
     */
    PreparedQueryStatement.prototype.preparedQueryKeys = [];

    /**
     * @type {object}
     */
    PreparedQueryStatement.prototype.async = {};

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
        if (this.query.queryIsPrepared()) {
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
     * Executes the prepared query
     * @throws {Error}
     * @return {*}
     */
    PreparedQueryStatement.prototype.execute = function () {
        if (this.query.queryIsPrepared()) {
            return this.query._query(this.queryString);
        } else {
            throw new Error("JSONDB Error: Can't execute the prepared query. There is no prepared query to execute or the prepared query is already executed.");
        }
    };

    /**
     * Executes the prepared query asynchronously
     * @param {function} callback The callback
     */
    PreparedQueryStatement.prototype.async.execute = function (callback) {
        callback = callback || null;

        if (null === callback || !(typeof callback === 'function')) {
            throw new Error("JSONDB Error: Can't execute the prepared query asynchronously without a callback.");
        }

        setImmediate(function() {
            if (instance.query.queryIsPrepared()) {
                callback(null, instance.query._query(instance.queryString));
            } else {
                callback(new Error("JSONDB Error: Can't execute the prepared query. There is no prepared query to execute or the prepared query is already executed."), null);
            }
        }.bind(this));
    };

    /**
     * Prepares a query
     * @return {PreparedQueryStatement}
     */
    PreparedQueryStatement.prototype._prepareQuery = function () {
        this.preparedQueryKeys = this.queryString.match(/(:[\w]+)/g);
    };

    return PreparedQueryStatement;
})();

// Exports the module
module.exports = function (query, database) {
    return new PreparedQueryStatement(query, database);
};
