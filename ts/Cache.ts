/**
 * JSONDB - JSON Database Manager
 *
 * Manage JSON files as databases with JSONDB Query Language (JQL)
 *
 * This content is released under the BSD-3-Clause License
 *
 * Copyright (c) 2016-2017, Alien Technologies
 *
 * @package    JSONDB
 * @author     Nana Axel <ax.lnana@outlook.com>
 * @copyright  Copyright (c) 2016-2018, Aliens Group
 * @license    https://spdx.org/licenses/BSD-3-Clause.html BSD 3-clause "New" or "Revised" License
 * @file       Cache.ts
 */

import {Util} from "./Util";
import {Database} from "./Database";

/**
 * Class Cache
 *
 * @package    Database
 * @subpackage Utilities
 * @category   Cache
 * @author     Nana Axel <ax.lnana@outlook.com>
 */
export class Cache {
    /**
     * Cache array
     * @access private
     * @static
     * @var {any}
     */
    private static _cache: any = {};

    /**
     * Gets cached data
     * @param {object|string} path The path to the table
     * @return {object}
     */
    public static get(path: string | object): any {
        if (typeof path === "string") {
            if (!Cache._cache.hasOwnProperty(path)) {
                Cache._cache[path] = Database.getTableData(path);
            }
            return Cache._cache[path];
        }
        else {
            let results = [];
            for (let id in path) {
                if (path.hasOwnProperty(id))
                    results.push(Cache.get(id));
            }
            return results;
        }
    }

    /**
     * Updates the cached data for a table
     * @param {string}  path The path to the table
     * @param {object}  data The data to cache
     * @return {void}
     */
    public static update(path: string, data: any) {
        data = data || null;
        if (Util.isset(data)) {
            Cache._cache[path] = data;
        } else {
            Cache._cache[path] = Database.getTableData(path);
        }
    }

    /**
     * Resets the cache
     * @return {Cache}
     */
    public static reset() {
        Cache._cache = {};
        return this;
    }

}
