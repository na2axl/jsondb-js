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
 * @license    http://spdx.org/licenses/GPL-3.0 GPL License
 * @filesource
 */

/**
 * Class Cache
 *
 * @package     Database
 * @subpackage  Utilities
 * @category    Cache
 * @author      Nana Axel
 */
var Cache = (function () {
    function Cache() { }

    /**
     * Cache array
     * @access private
     * @static {object}
     */
    Cache.cache = {};

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
            var Util = new (require('./Util'))();
            Cache.cache[path] = Util.getTableData(path);
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
            var Util = new (require('./Util'))();
            Cache.cache[path] = Util.getTableData(path);
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

    return Cache;
})();

// Exports the module
module.exports = new Cache();
