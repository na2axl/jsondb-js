/**
 * JSONDB - JSON Database Manager
 *
 * Manage JSON files as databases with JSONDB Query Lqanguage (JQL)
 *
 * This content is released under the BSD-3-Clause License
 *
 * Copyright (c) 2016-2017, Alien Technologies
 *
 * @package    JSONDB
 * @author     Nana Axel <ax.lnana@outlook.com>
 * @copyright  Copyright (c) 2016-2018, Aliens Group
 * @license    https://spdx.org/licenses/BSD-3-Clause.html BSD 3-clause "New" or "Revised" License
 * @file       PreparedQueryStatement.ts
 */

import {Util} from "./Util";
import {Query} from "./Query";
import {JSONDB} from "./JSONDB";

/**
 * Class PreparedQueryStatement
 *
 * @summary    Manage a single JSONDB database.
 * @package    JSONDB
 * @subpackage Query
 * @category   Prepared query
 * @author     Nana Axel <ax.lnana@outlook.com>
 */
export class PreparedQueryStatement {

    /**
     * The query.
     * @type {string}
     */
    public queryString: string;

    /**
     * The Query object.
     * @type {Query}
     */
    private _query: Query;

    /**
     * Prepared Query Statement constructor
     * @param {Query} wrapper The wrapped query
     * @param {string} query  The prepared query
     */
    constructor(wrapper: Query, query: string) {
        this._query = wrapper;
        this.queryString = query;

        this._prepareQuery();
    }

    /**
     * The list of query keys.
     * @type {Array<string>}
     */
    private _preparedQueryKeys: RegExpMatchArray | null;

    /**
     * Wrapper for async operations.
     * @returns {{execute: function}}
     */
    public get async(): {
        readonly execute: () => Promise<any>
    } {
        return {
            execute: () => this.executeAsync()
        }
    }

    /**
     * Binds a value in a prepared query.
     * @param {string} key The parameter's key
     * @param {object} value The parameter's value
     * @param {number} parse_method The parse method to use
     * @throws {Error}
     */
    public bindValue(key: string, value: any, parse_method: number): void {
        parse_method = parse_method || JSONDB.PARAM_STRING;

        if (this._query.queryIsPrepared) {
            if (this._preparedQueryKeys !== null && !!~this._preparedQueryKeys.indexOf(key)) {
                switch (parse_method) {
                    default:
                    case JSONDB.PARAM_STRING:
                        value = JSONDB.quote(value.toString());
                        break;

                    case JSONDB.PARAM_INT:
                        value = parseInt(value);
                        break;

                    case JSONDB.PARAM_FLOAT:
                        value = parseFloat(value);
                        break;

                    case JSONDB.PARAM_BOOL:
                        value = `${parseInt(value)}:JSONDB::TO_BOOL:`;
                        break;

                    case JSONDB.PARAM_NULL:
                        value = `${value.toString()}:JSONDB::TO_NULL:`;
                        break;

                    case JSONDB.PARAM_ARRAY:
                        value = `${JSONDB.quote(Util.serialize(value))}:JSONDB::TO_ARRAY:`;
                        break;
                }
                this.queryString = this.queryString.replace(key, value);
            } else {
                throw new Error(`JSONDB Error: Can't bind the value "${value}" for the key "${key}". The key isn't in the query.`);
            }
        } else {
            throw new Error("JSONDB Error: Can't use JSONDB::bindValue() with non prepared queries. Send your query with JSONDB::prepare() first.");
        }
    }

    /**
     * Executes the prepared query
     * @throws {Error}
     * @return {*}
     */
    public execute(): any {
        if (this._query.queryIsPrepared) {
            return this._query.send(this.queryString);
        } else {
            throw new Error("JSONDB Error: Can't execute the prepared query. There is no prepared query to execute or the prepared query is already executed.");
        }
    }

    /**
     * Executes the prepared query asynchronously
     * @throws {Error}
     * @return {Promise<object>}
     */
    public executeAsync(): Promise<any> {
        return new Promise<any>((executor, reject) => {
            try {
                executor = executor || null;

                if (null === executor || !(typeof executor === 'function')) {
                    return reject(new Error("JSONDB Error: Can't execute the prepared query asynchronously without a callback."));
                }

                if (this._query.queryIsPrepared) {
                    return executor(this.execute());
                } else {
                    return reject(new Error("JSONDB Error: Can't execute the prepared query. There is no prepared query to execute or the prepared query is already executed."));
                }
            }
            catch (e) {
                return reject(e);
            }
        });
    }

    /**
     * Prepares a query.
     * @private
     */
    private _prepareQuery(): void {
        this._preparedQueryKeys = this.queryString.match(/(:[\w]+)/g);
    }

}