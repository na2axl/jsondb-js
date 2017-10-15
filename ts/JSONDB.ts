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
 * @copyright  Copyright (c) 2016-2017, Alien Technologies
 * @license    http://spdx.org/licences/GPL-3.0 GPL License
 * @file       Database.ts
 */
import {Configuration} from "./Configuration";

declare var __filename: string;
declare var __dirname: string;

import { Database } from "./Database";
import { Util } from "./Util";
import { QueryParser } from "./QueryParser";

import * as _f from 'fs';
import * as _p from 'path';

export class JSONDB {

    /**
     * Parse a prepared query parameter value as string
     * @type {number}
     */
    public static get PARAM_STRING(): number {
        return 0;
    }

    /**
     * Parse a prepared query parameter value as integer
     * @type {number}
     */
    public static get PARAM_INT(): number {
        return 1;
    }

    /**
     * Parse a prepared query parameter value as float
     * @type {number}
     */
    public static get PARAM_FLOAT(): number {
        return 5;
    }

    /**
     * Parse a prepared query parameter value as bool
     * @type {number}
     */
    public static get PARAM_BOOL(): number {
        return 2;
    }

    /**
     * Parse a prepared query parameter value as null
     * @type {number}
     */
    public static get PARAM_NULL(): number {
        return 3;
    }

    /**
     * Parse a prepared query parameter value as array
     * @type {number}
     */
    public static get PARAM_ARRAY(): number {
        return 7;
    }

    /**
     * Fetch results as array
     * @type {number}
     */
    public static get FETCH_ARRAY(): number {
        return 4;
    }

    /**
     * Fetch results as object
     * @type {number}
     */
    public static get FETCH_OBJECT(): number {
        return 4;
    }

    /**
     * Fetch results with class mapping
     * @type {number}
     */
    public static get FETCH_CLASS(): number {
        return 6;
    }

    /**
     * Creates a new server.
     * @param {string}  name     The server's name
     * @param {string}  username The server's username
     * @param {string}  password The server's user password
     * @param {boolean} connect If JSONDB connects directly to the server after creation
     * @returns {JSONDB | Database}
     * @throws {Error}
     */
    public createServer(name: string, username: string, password: string, connect?: boolean): JSONDB | Database {
        connect = connect || false;

        let path = _p.normalize(Util.makePath(_p.dirname(__dirname), 'servers', name));

        if (null !== path && username !== null) {
            if (Util.existsSync(path) && _f.lstatSync(path).isDirectory()) {
                throw new Error(`JSONDB Error: Can't create the server at "${path}", the directory already exists.`);
            }

            Util.mkdirSync(path);

            if(!_f.lstatSync(path).isDirectory()) {
                throw new Error(`JSONDB Error: Can't create the server at "${path}". Maybe you don't have write access.`);
            }

            _f.chmodSync(path, 0x1ff);

            Configuration.addUser(name, username, password);

            if (connect) {
                return this.connect(name, username, password);
            }
        }
        else {
            throw new Error("JSONDB Error: Can't create the server, required parameters are missing.");
        }

        return this;
    }

    /**
     * Checks if a server exists
     * @param {string} name The name of the server
     * @return {boolean}
     */
    public serverExists(name: string): boolean {
        if (null === name) {
            return false;
        }

        let path = _p.normalize(Util.makePath(_p.dirname(__dirname), 'servers', name));

        return Util.existsSync(path);
    }

    /**
     * Connects to a Database
     *
     * Access to a server with an username, a password
     * and optionally a Database's name.
     *
     * @param {string}      server   The name of the server
     * @param {string}      username The username
     * @param {string}      password The password
     * @param {string|null} database The name of the Database
     * @throws {Error}
     * @return {Database}
     */
    public connect(server: string, username: string, password: string, database?: string): Database {
        return new Database(server, username, password, database);
    }

    /**
     * Connects asynchronously to a Database
     *
     * Access to a server with an username, a password
     * and optionally a Database's name.
     *
     * @param {string}      server   The name of the server
     * @param {string}      username The username
     * @param {string}      password The password
     * @param {string|null} database The name of the Database
     * @throws {Error}
     * @return {Promise<Database>}
     */
    public connectAsync(server: string, username: string, password: string, database?: string): Promise<Database> {
        return new Promise<Database>((executor, reject) => {
            try {
                executor = executor || null;

                if (null === executor || !(typeof executor === 'function')) {
                    return reject(new Error("JSONDB Error: Can't connect to a server asynchronously without a callback."));
                }

                return executor(this.connect(server, username, password, database));
            }
            catch (e) {
                return reject(e);
            }
        });
    }

    /**
     * Escapes reserved characters and quotes a value
     * @param {string} value
     * @return {string}
     */
    public quote(value: string) {
        return new QueryParser().quote(value);
    }

}