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
 * @package       JSONDB
 * @author       Nana Axel
 * @copyright  Copyright (c) 2016, Centers Technologies
 * @license       http://opensource.org/licenses/MIT MIT License
 * @filesource
 */

/**
 * Class QueryResult
 *
 * @package        JSONDB
 * @subpackage  Utilities
 * @category    Results
 * @author        Nana Axel
 */
var QueryResult = (function () {
    require('./Util').extends(QueryResult, Array);

    var JSONDB = require('./JSONDB');

    function QueryResult(result, database) {
        this.database = database;
        this._setResults(QueryResult.__super__.constructor.apply(this, result));
        this._parseResults();
        this.setFetchMode(JSONDB.FETCH_ARRAY);
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
    QueryResult.prototype.database = null;

    /**
     * Results
     * @type {Array}
     */
    QueryResult.prototype.results = [];

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
        return this.database.getQueryString();
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

        if (this.database.queryIsExecuted()) {
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
            '#elapsedtime' : this.database.bench().elapsed_time('jsondb_(query)_start', 'jsondb_(query)_end'),
            '#memoryusage' : this.database.bench().memory_usage('jsondb_(query)_start', 'jsondb_(query)_end')
        }, this.results);
    };

    return QueryResult;

})();

// Exports the module
module.exports = function (result, database) {
    return new QueryResult(result, database);
};