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
 * Class QueryResult
 *
 * @package     JSONDB
 * @subpackage  Query
 * @category    Results
 * @author      Nana Axel
 */
var QueryResult = (function () {
    require('./Util').extends(QueryResult, Array);

    var JSONDB = require('./JSONDB');

    /**
     * Current database instance
     * @type {QueryResult}
     */
    var instance;

    function QueryResult(result, query) {
        this.query = query;
        this._setResults(QueryResult.__super__.constructor.apply(this, result));
        this._parseResults();
        this.setFetchMode(JSONDB.FETCH_ARRAY);

        instance = this;
    }

    /**
     * Current key
     * @var {number}
     */
    QueryResult.prototype.key = 0;

    /**
     * Fetch mode
     * @type {number}
     */
    QueryResult.prototype.fetchMode = JSONDB.FETCH_ARRAY;

    /**
     * Class name used for FETCH_CLASS method
     * @type {string}
     */
    QueryResult.prototype.className = null;

    /**
     * Database instance
     * @type {Database}
     */
    QueryResult.prototype.query = null;

    /**
     * Results
     * @type {Array}
     */
    QueryResult.prototype.results = [];

    /**
     * Namespace for asynchronous operations
     * @type {object}
     */
    QueryResult.prototype.async = {};

    /**
     * Sets the results
     * @param {Array} results
     * @private
     */
    QueryResult.prototype._setResults = function (results) {
        this.results = results;
    };

    /**
     * Returns the query
     * @return {string}
     */
    QueryResult.prototype.queryString = function () {
        return this.query.getQueryString();
    };

    /**
     * Returns the current result
     * @return {Array|object}
     * @throws {Error}
     */
    QueryResult.prototype.current = function () {
        var ret = this.results[this.key];

        switch (this.fetchMode) {
            case JSONDB.FETCH_ARRAY:
                return ret;

            case JSONDB.FETCH_CLASS:
                if (!(typeof this.className === 'function')) {
                    throw new Error("JSONDB Query Result Error: Can't fetch for data. Trying to use JSONDB::FETCH_CLASS mode but the class doesn't exist or not found.");
                }

                var mapper = new this.className();
                for (var item in ret) {
                    if (ret.hasOwnProperty(item)) {
                        if (typeof mapper[item] === 'undefined') {
                            throw new Error("JSONDB Query Result Error: Can't fetch for data. Using JSONDB::FETCH_CLASS mode but the property \"" + item + "\" doesn't exist or not public.");
                        }
                        mapper[item] = ret[item];
                    }
                }
                return mapper;

            default:
                throw new Error('JSONDB Query Result Error: Fetch mode not supported.');
        }
    };

    /**
     * Fetch for results
     * @param {number} mode      The fetch mode
     * @param {string} className The class name (for JSONDB::FETCH_CLASS)
     * @return {Array|boolean}
     * @throws {Error}
     */
    QueryResult.prototype.fetch = function (mode, className) {
        mode = mode || null;
        className = className || null;

        if (null !== mode) {
            this.setFetchMode(mode, className);
        }

        if (this.query.queryIsExecuted()) {
            if (this.results.hasOwnProperty(this.key)) {
                var ret = this.current();
                this.key++;
                return ret;
            }
            return false;
        } else {
            throw new Error("JSONDB Query Result Error: Can't fetch for results without execute the query.");
        }
    };

    /**
     * Fetch for results
     * @param {number|function} mode      The fetch mode
     * @param {string}          className The class name (for JSONDB::FETCH_CLASS)
     * @param {function}        callback  The callback
     * @throws {Error}
     */
    QueryResult.prototype.async.fetch = function (mode, className, callback) {
        mode = mode || null;
        className = className || null;
        callback = callback || null;

        if (typeof mode === 'function') {
            callback = mode;
            mode = null;
        }

        if (null === callback || !(typeof callback === 'function')) {
            throw new Error("QueryResult Error: Can't fetch for results asynchronously without a callback");
        }

        setImmediate(function () {
            if (null !== mode) {
                instance.setFetchMode(mode, className);
            }

            if (instance.query.queryIsExecuted()) {
                if (instance.results.hasOwnProperty(instance.key)) {
                    var ret = instance.current();
                    instance.key++;
                    callback(null, ret, function() {
                        this.fetch(mode, className, callback);
                    }.bind(this));
                } else {
                    callback(null, false, null);
                }
            } else {
                callback(new Error("JSONDB Query Result Error: Can't fetch for results without execute the query."), null, null);
            }
        }.bind(this));
    };

    /**
     * Changes the fetch mode
     * @param {number} mode
     * @param {string} className
     * @return {QueryResult}
     */
    QueryResult.prototype.setFetchMode = function (mode, className) {
        mode = mode || JSONDB.FETCH_ARRAY;
        className = className || null;
        this.fetchMode = mode;
        this.className = className;
        return this;
    };

    /**
     * Adds information in results
     */
    QueryResult.prototype._parseResults = function () {
        this.results = require('./Util').merge({
            '#queryString' : this.queryString(),
            '#elapsedtime' : this.query.bench().elapsed_time('jsondb_(query)_start', 'jsondb_(query)_end'),
            '#memoryusage' : this.query.bench().memory_usage('jsondb_(query)_start', 'jsondb_(query)_end')
        }, this.results);
    };

    return QueryResult;

})();

// Exports the module
module.exports = function (result, query) {
    return new QueryResult(result, query);
};
