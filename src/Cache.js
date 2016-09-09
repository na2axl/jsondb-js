/**
 * Database - JSON Database Manager
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
 * @package	   Database
 * @author	   Nana Axel
 * @copyright  Copyright (c) 2016, Centers Technologies
 * @license	   http://opensource.org/licenses/MIT MIT License
 * @filesource
 */

/**
 * Class Cache
 *
 * @package		Database
 * @subpackage  Utilities
 * @category    Cache
 * @author		Nana Axel
 */
var Cache = function (db) {
    this.setDatabase(db);
};

/**
 * Cache array
 * @access private
 * @static {object}
 */
Cache.cache = {};

/**
 * Changes the Database instance used
 *
 * @param {Database} database Database class' instance
 * @return {Cache}
 */
Cache.prototype.setDatabase = function (database) {
    this.database = database;
    return this;
};

/**
 * Gets cached data
 * @param {object|string} path The path to the table
 * @return {object|*}
 */
Cache.prototype.get = function (path) {
    if (typeof path === "object") {
        var results = [];
        for (var id in path) {
            results.push(this.get(id));
        }
        return results;
    }

    if (!Cache.cache.hasOwnProperty(path)) {
        Cache.cache[path] = this.database.getTableData(path);
    }

    return Cache.cache[path];
};

/**
 * Updates the cached data for a table
 * @param {string}      path The path to the table
 * @param {object|null} data The data to cache
 * @return {object}
 */
Cache.prototype.update = function (path, data) {
    data = data || null;
    if (null !== data) {
        Cache.cache[path] = data;
    } else {
        Cache.cache[path] = this.database.getTableData(path);
    }
};

/**
 * Resets the cache
 * @return Cache
 */
Cache.prototype.reset = function () {
    Cache.cache = {};
    return this;
};

// Exports the module
module.exports = function (db) {
    return new Cache(db);
};