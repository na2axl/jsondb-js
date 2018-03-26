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
 * @file       TablePrototype.ts
 */

/**
 * Provides a base interface for table's prototypes.
 */
export interface TablePrototype
{
    [row_name: string]: {
        type: "int" | "integer" | "number" | "decimal" | "float" | "string" | "char" | "bool" | "boolean" | "array",
        default?: number | string | boolean | Array<any>,
        max_length?: number,
        not_null?: boolean,
        auto_increment?: boolean,
        primary_key?: boolean,
        unique_key?: boolean
    }
}