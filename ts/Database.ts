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
 * @copyright  Copyright (c) 2016-2017, Alien Technologies
 * @license    https://spdx.org/licenses/BSD-3-Clause.html BSD 3-clause "New" or "Revised" License
 * @file       Database.ts
 */

declare var __filename: string;

import {Configuration} from "./Configuration";
import {Benchmark} from "./Benchmark";
import {Util} from "./Util";
import {PreparedQueryStatement} from "./PreparedQueryStatement";
import {UserConfiguration} from "./config/User";
import {TablePrototype} from "./types/TablePrototype";
import {Query} from './Query';

import * as _f from "fs";
import * as _p from "path";

/**
 * Class Database
 *
 * @summary    Manage a single JSONDB database.
 * @package    JSONDB
 * @subpackage Managers
 * @category   Database
 * @author     Nana Axel <ax.lnana@outlook.com>
 */
export class Database {

    /**
     * The name of the server.
     */
    private _serverName: string;

    /**
     * The name of the database.
     */
    private _databaseName: string;

    /**
     * Database Manager constructor.
     * @param {string} server The name of the server to connect on
     * @param {string} username The username which match the server
     * @param {string} password The password which match the username
     * @param {string} database The name of the database
     */
    constructor(server: string, username: string, password: string, database?: string) {
        if (!Util.isset(server) || !Util.isset(username) || !Util.isset(password)) {
            throw new Error('Database Error: Can\'t connect to the server, missing parameters.');
        }

        let userFound: boolean = false;

        Benchmark.mark("Database_(connect)_start");
        {
            let config = Configuration.getConfig<UserConfiguration>("users");

            if (!config.hasOwnProperty(server)) {
                Benchmark.mark('Database_(connect)_end');
                throw new Error(`Database Error: There is no registered server with the name "${server}".`);
            }

            for (let user of config[server]) {
                userFound = user.username === Util.crypt(username) && user.password === Util.crypt(password);

                if (userFound)
                    break;
            }

            if (!userFound) {
                Benchmark.mark("Database_(connect)_end");
                throw new Error(`Database Error: User's authentication failed for user "${username}" on server "${server}" (Using password: "${password.length > 0 ? "Yes" : "No"}"). Access denied.`);
            }

            this._serverName = Util.makePath(_p.normalize(_p.dirname(_p.dirname(__filename)) + '/servers/' + server));
            this._username = username;

            if (Util.isset(database)) {
                try {
                    this.setDatabase(<string>database);
                } catch (e) {
                    Benchmark.mark("Database_(connect)_end");
                    throw e;
                }
            }
        }
        Benchmark.mark("Database_(connect)_end");
    }

    /**
     * The username used for connection.
     */
    private _username: string;

    /**
     * The username of the current connected client.
     */
    public get username(): string {
        return this._username;
    }

    /**
     * The path of the current working server.
     */
    public get server(): string {
        return this._serverName;
    }

    /**
     * The name of the current working database.
     */
    public get database(): string {
        return this._databaseName;
    }

    /**
     * Check if the user is connected.
     */
    public get isConnected(): boolean {
        return Util.isset(this._serverName);
    }

    /**
     * Check if a database is set.
     */
    public get isWorkingDatabase(): boolean {
        return Util.isset(this._databaseName);
    }

    /**
     * Wrapper for async operations.
     * @returns {{exists: function, tableExists: function, createDatabase: function, createTable: function, query: function, queries: function, prepare: function}}
     */
    public get async(): {
        readonly exists: (database: string) => Promise<boolean>,
        readonly tableExists: (name: string) => Promise<boolean>,
        readonly createDatabase: (name: string) => Promise<Database>,
        readonly createTable: (name: string, prototype: TablePrototype) => Promise<Database>,
        readonly query: (query: string) => Promise<any>,
        readonly queries: (queries: string) => Promise<any>,
        readonly prepare: (query: string) => Promise<PreparedQueryStatement>
    } {
        return {
            /**
             * Checks asynchoronously if a database exist in the current working server.
             * @param {string} database The name of the database.
             */
            exists: (database: string) => this.existsAsync(database),
            /**
             * Checks asynchronously if a table exists in the current working database
             * @param {string} name The name of the teable
             * @returns {boolean}
             */
            tableExists: (name: string) => this.tableExistsAsync(name),
            /**
             * Creates a new database asynchronously in the current working server
             * @param {string} name The name of the database to create
             * @returns {Promise<Database>} The current database instance
             * @throws {Error} The database's name is missing
             * @throws {Error} The database's name is missing
             */
            createDatabase: (name: string) => this.createDatabaseAsync(name),
            /**
             * Creates asynchronously a new table in the current working database.
             * @param {string} name The name of the table
             * @param {Array} prototype The prototype of the table
             * @returns {Promise<Database>} The current Database instance
             * @throws {Error}
             */
            createTable: (name: string, prototype: TablePrototype) => this.createTableAsync(name, prototype),
            /**
             * Sends a query asynchronously to the database.
             * @param {string} query The query to send to the database
             */
            query: (query: string) => this.queryAsync(query),
            /**
             * Sends multiple queries asynchronously.
             * @param {string} queries The queries to send to the database
             */
            queries: (queries: string) => this.queriesAsync(queries),
            /**
             * Sends a prepared query asynchronously.
             * @param {string} query The query to send to the database
             */
            prepare: (query: string) => this.prepareAsync(query)
        }
    }

    /**
     * Gets the list of databases in a server.
     * @param {string} server The name of the server to lookup.
     */
    public static getDatabaseList(server: string): Array<string> {
        return _f.existsSync(Util.makePath(_p.dirname(__filename), "servers", server)) ? _f.readdirSync(Util.makePath(_p.dirname(__filename), "servers", server)) : [];
    }

    /**
     * Returns the path to a table
     * @param {string} server The server name
     * @param {string} database The database name
     * @param {string} table The table name
     * @return {string}
     */
    public static getTablePath(server: string, database: string, table: string): string {
        return server + _p.sep + database + _p.sep + table + ".jdbt";
    }

    /**
     * Returns a table's data
     * @param {string|null} path The path to the table
     * @return {object}
     */
    public static getTableData(path: string) {
        return JSON.parse(_f.readFileSync(path, "utf8"));
    }

    /**
     * Gets the path to a database
     * @param {string} server
     * @param {string} database
     * @return {string}
     */
    public static getDatabasePath(server: string, database: string): string {
        return server + _p.sep + database;
    }

    /**
     * Disconnect from the server.
     */
    public disconnect() {
        Benchmark.mark("Database_(disconnect)_start");
        {
            this._serverName = "";
            this._databaseName = "";
            this._username = "";
        }
        Benchmark.mark("Database_(disconnect)_end");
    }

    /**
     * Changes the current working database.
     * @param {string} database The name of the new database to use.
     */
    public setDatabase(database: string): Database {
        if (!this.isConnected) {
            throw `Database Error: Can't use the database "${database}", there is no connection established with a server.`;
        }
        if (!this.exists(database)) {
            throw `Database Error: Can't use the database "${database}", the database doesn't exist in the server.`;
        }

        this._databaseName = database;

        return this;
    }

    /**
     * Gets the list of tables in the current working database.
     */
    public getTableList(): Array<string> {
        return Util.isset(this._databaseName) ? _f.readdirSync(Util.makePath(this._serverName, this._databaseName)) : [];
    }

    /**
     * Checks if a database exist in the current working server.
     * @param {string} database The name of the database.
     */
    public exists(database: string): boolean {
        return Util.isset(database) && Util.existsSync(Util.makePath(this._serverName, database));
    }

    /**
     * Checks asynchoronously if a database exist in the current working server.
     * @param {string} database The name of the database.
     */
    public existsAsync(database: string): Promise<boolean> {
        return new Promise<boolean>((executor, reject) => {
            try {
                executor = executor || null;

                if (null === executor || !(typeof executor === "function")) {
                    return reject(new Error("JSONDB Error: Can't check asynchronously if a database exists without a callback."));
                }

                if (!Util.isset(database)) {
                    return executor(false);
                }

                Util.exists(Database.getDatabasePath(this.server, database))
                    .then(executor)
                    .catch(reject);
            }
            catch (e) {
                return reject(e);
            }
        });
    }

    /**
     * Checks if a table exists in the current working database
     * @param {string} name The name of the teable
     * @returns {boolean}
     */
    public tableExists(name: string): boolean {
        if (name === null || name === '') {
            return false;
        }
        return Util.existsSync(Database.getTablePath(this.server, this.database, name));
    }

    /**
     * Checks asynchronously if a table exists in the current working database
     * @param {string} name The name of the teable
     * @returns {boolean}
     */
    public tableExistsAsync(name: string): Promise<boolean> {
        return new Promise<boolean>((executor, reject) => {
            try {
                if (null === executor || !(typeof executor === 'function')) {
                    return reject(new Error("Database Error: Can't check asynchronously if a database exist without a callback."));
                }

                if (null === name || name === '') {
                    return executor(false);
                }

                Util.exists(Database.getTablePath(this.server, this.database, name))
                    .then(executor)
                    .catch(reject);
            }
            catch (e) {
                return reject(e);
            }
        });
    }

    /**
     * Creates a new database in the current working server
     * @param {string} name The name of the database to create
     * @returns {Database} The current database instance
     * @throws {Error} The database's name is missing
     * @throws {Error} The database's name is missing
     */
    public createDatabase(name: string): Database {
        Benchmark.mark("Database_(createDatabase)_start");
        {
            if (!Util.isset(name) || name.trim() === "") {
                Benchmark.mark("Database_(createDatabase)_end");
                throw new Error("Database Error: Can't create the database, the database's name is missing.");
            }
            if (!this.isConnected) {
                Benchmark.mark("Database_(createDatabase)_end");
                throw new Error(`Database Error: Can't create the database "${name}", there is no connection established with a server.`);
            }

            let path = Util.makePath(this._serverName, name);

            if (this.exists(name)) {
                Benchmark.mark("Database_(createDatabase)_end");
                throw new Error(`Database Error: Can't create the database "${name}" in the server, the database already exist.`);
            }

            Util.mkdirSync(path);

            if (!Util.exists(path)) {
                Benchmark.mark("Database_(createDatabase)_end");
                throw new Error(`Database Error: Can't create the database "${name}" in the server.`);
            }
        }
        Benchmark.mark("Database_(createDatabase)_end");

        return this;
    }

    /**
     * Creates a new database asynchronously in the current working server
     * @param {string} name The name of the database to create
     * @returns {Promise<Database>} The current database instance
     * @throws {Error} The database's name is missing
     * @throws {Error} The database's name is missing
     */
    public createDatabaseAsync(name: string): Promise<Database> {
        return new Promise<Database>((executor, reject) => {
            try {
                executor = executor || null;

                if (null === executor || !(typeof executor === "function")) {
                    return reject(new Error("Database Error: Can't create a database asynchronously without a callback."));
                }

                Benchmark.mark('Database_(createDatabase)_start');
                if (null === name) {
                    Benchmark.mark('Database_(createDatabase)_end');
                    return reject(new Error("Database Error: Can't create the database, the database's name is missing."));
                }
                if (null === this.server) {
                    Benchmark.mark('Database_(createDatabase)_end');
                    return reject(new Error(`Database Error: Can't create the database "${name}", there is no connection established with a server.`));
                }

                let path = Database.getDatabasePath(this.server, name);

                Util.exists(path)
                    .then((exists) => {
                        if (exists) {
                            Benchmark.mark('Database_(createDatabase)_end');
                            return reject(new Error("Database Error: Can't create the database \"" + name + "\" in the server \"" + this.server + "\", the database already exist."));
                        }
                        else {
                            Util.mkdir(path)
                                .then(() => {
                                    _f.chmod(path, 0x1ff, (err: any) => {
                                        if (err) {
                                            return reject(err);
                                        }
                                        else {
                                            Benchmark.mark('Database_(createDatabase)_end');
                                            executor(this);
                                        }
                                    });
                                })
                                .catch(err => {
                                    if (err) {
                                        Benchmark.mark('Database_(createDatabase)_end');
                                        return reject(new Error("Database Error: Can't create the database \"" + name + "\" in the server \"" + this.server + "\""));
                                    }
                                });
                        }
                    }, reject);
            }
            catch (e) {
                return reject(e);
            }
        });
    }

    /**
     * Creates a new table in the current working database.
     * @param {string} name The name of the table
     * @param {Array} prototype The prototype of the table
     * @returns {Database} The current Database instance
     * @throws {Error}
     */
    public createTable(name: string, prototype: TablePrototype): Database {
        Benchmark.mark("Database_(createTable)_start");
        if (!Util.isset(name) || name.trim() === "") {
            Benchmark.mark("Database_(createTable)_end");
            throw new Error("Database Error: Can\'t create table, without a name.");
        }

        if (!this.isWorkingDatabase) {
            Benchmark.mark("Database_(createTable)_end");
            throw new Error("Database Error: Trying to create a table without using a database.");
        }

        let path = Util.makePath(this._serverName, this._databaseName, name + ".jdbt");

        if (Util.existsSync(path)) {
            Benchmark.mark("Database_(createTable)_end");
            throw new Error(`Database Error: Can't create the table "${name}" in the database "${this._databaseName}". The table already exist.`);
        }

        let fields: Array<string> = [];
        let properties = {
            last_insert_id: 0,
            last_valid_row_id: 0,
            last_link_id: 0,
            primary_keys: new Array<string>(),
            unique_keys: new Array<string>()
        };
        let aiExist = false;

        for (let field in prototype) {
            let prop = prototype[field];
            let hasAi = prop.auto_increment !== null;
            let hasPk = prop.primary_key !== null;
            let hasUk = prop.unique_key !== null;
            let hasTp = prop.type !== null;

            if (aiExist && hasAi) {
                Benchmark.mark("Database_(createTable)_end");
                throw new Error("Database Error: Can't use the \"auto_increment\" property on more than one field.");
            }

            if (!aiExist && hasAi) {
                aiExist = true;
                prototype[field].unique_key = true;
                prototype[field].not_null = true;
                prototype[field].type = "int";
                hasTp = true;
                hasUk = true;
            }

            if (hasPk) {
                prototype[field].not_null = true;
                properties.primary_keys.push(field);
            }

            if (hasUk) {
                prototype[field].not_null = true;
                properties.unique_keys.push(field);
            }

            if (hasTp) {
                let fType = prop.type;

                if (fType != null) {
                    if (/link\\(.+\\)/.test(fType.toString())) {
                        let link = fType.toString().replace(new RegExp("link\\((.+)\\)"), "$1");
                        let linkInfo = link.split('.');
                        let linkTablePath = Util.makePath(this._serverName, this._databaseName, linkInfo[0] + ".jdbt");

                        if (!Util.existsSync(linkTablePath)) {
                            throw new Error("Database Error: Can't create the table \"" + name +
                                "\". An error occur when linking the column \"" + field +
                                "\" with the column \"" + linkInfo[1] + "\", the table \"" + linkInfo[0] +
                                "\" doesn't exist in the database \"" + this._databaseName + "\".");
                        }

                        let linkTableData = Database.getTableData(linkTablePath);
                        if (linkTableData.prototype.indexOf(linkInfo[1]) == -1) {
                            throw new Error("Database Error: Can't create the table \"" + name +
                                "\". An error occur when linking the column \"" + field +
                                "\" with the column \"" + linkInfo[1] + "\", the column \"" +
                                linkInfo[1] + "\" doesn't exist in the table \"" + linkInfo[0] +
                                "\" .");
                        }
                        if ((linkTableData["properties"]["primary_keys"] != null &&
                                Util.objectToArray(linkTableData.properties.primary_keys).indexOf(linkInfo[1]) == -1)
                            ||
                            (linkTableData["properties"]["unique_keys"] != null &&
                                Util.objectToArray(linkTableData.properties.unique_keys).indexOf(linkInfo[1]) == -1)) {
                            throw new Error("Database Error: Can't create the table \"" + name +
                                "\". An error occur when linking the column \"" + field +
                                "\" with the column \"" + linkInfo[1] + "\", the column \"" +
                                linkInfo[1] +
                                "\" is not a PRIMARY KEY or an UNIQUE KEY in the table \"" +
                                linkInfo[0] + "\" .");
                        }

                        delete prototype[field].default;
                        delete prototype[field].max_length;
                    }
                    else {
                        switch (fType.toString()) {
                            case "bool":
                            case "boolean":
                                if (prototype[field].default !== null) {
                                    if (prototype[field].default !== true && prototype[field].default !== false) {
                                        prototype[field].default = false;
                                    }
                                }
                                delete prototype[field].max_length;
                                break;
                            case "int":
                            case "integer":
                            case "number":
                                if (prototype[field].default !== null) {
                                    prototype[field].default = parseInt(<string>prototype[field].default) || 0;
                                }
                                delete prototype[field].max_length;
                                break;
                            case "float":
                            case "decimal":
                                if (prototype[field].default !== null) {
                                    prototype[field].default = parseFloat(<string>prototype[field].default) || 0;
                                }
                                if (prototype[field].max_length !== null) {
                                    prototype[field].max_length = parseInt((<number>prototype[field].max_length).toString()) || 0;
                                }
                                break;
                            case "string":
                                if (prototype[field].default !== null) {
                                    prototype[field].default = (<string>prototype[field].default).toString();
                                }
                                if (prototype[field].max_length !== null) {
                                    prototype[field].max_length = parseInt((<number>prototype[field].max_length).toString()) || 0;
                                }
                                break;
                            default:
                                throw new TypeError(`Database Error: The type "${fType}" isn't supported by JSONDB.`);
                        }
                    }
                }
            }
            else {
                prototype[field].type = "string";
            }

            fields.push(field);
        }

        let tableProperties = Util.merge(properties, prototype);
        fields.unshift("#rowid");

        let data = {
            prototype: fields,
            properties: tableProperties,
            data: {}
        };

        if (Util.writeTextFileSync(path, JSON.stringify(data))) {
            Benchmark.mark("Database_(createTable)_end");
            return this;
        }

        Benchmark.mark("Database_(createTable)_end");

        throw new Error(`Database Error: Can't create file "${path}".`);
    }

    /**
     * Creates asynchronously a new table in the current working database.
     * @param {string} name The name of the table
     * @param {Array} prototype The prototype of the table
     * @returns {Promise<Database>} The current Database instance
     * @throws {Error}
     */
    public createTableAsync(name: string, prototype: TablePrototype): Promise<Database> {
        return new Promise<Database>((executor, reject) => {
            try {
                if (null === executor || !(typeof executor === 'function')) {
                    return reject(new Error("Database Error: Can't create a table without a callback."));
                }

                if (null === name || null === prototype) {
                    return reject(new Error('Database Error: Can\'t create table, missing parameters.'));
                }

                Benchmark.mark('Database_(createTable)_start');
                if (!this.isWorkingDatabase) {
                    Benchmark.mark('Database_(createTable)_end');
                    return reject(new Error('Database Error: Trying to create a table without using a database.'));
                }

                let path = Util.makePath(this._serverName, this._databaseName, name + ".jdbt");

                Util.exists(path)
                    .then(exists => {
                        if (exists) {
                            Benchmark.mark("Database_(createTable)_end");
                            return reject(new Error(`Database Error: Can't create the table "${name}" in the database "${this._databaseName}". The table already exist.`));
                        }

                        let fields: Array<string> = [];
                        let properties = {
                            last_insert_id: 0,
                            last_valid_row_id: 0,
                            last_link_id: 0,
                            primary_keys: new Array<string>(),
                            unique_keys: new Array<string>()
                        };
                        let aiExist = false;

                        for (let field in prototype) {
                            let prop = prototype[field];
                            let hasAi = prop.auto_increment !== null;
                            let hasPk = prop.primary_key !== null;
                            let hasUk = prop.unique_key !== null;
                            let hasTp = prop.type !== null;

                            if (aiExist && hasAi) {
                                Benchmark.mark("Database_(createTable)_end");
                                return reject(new Error("Database Error: Can't use the \"auto_increment\" property on more than one field."));
                            }

                            if (!aiExist && hasAi) {
                                aiExist = true;
                                prototype[field].unique_key = true;
                                prototype[field].not_null = true;
                                prototype[field].type = "int";
                                hasTp = true;
                                hasUk = true;
                            }

                            if (hasPk) {
                                prototype[field].not_null = true;
                                properties.primary_keys.push(field);
                            }

                            if (hasUk) {
                                prototype[field].not_null = true;
                                properties.unique_keys.push(field);
                            }

                            if (hasTp) {
                                let fType = prop.type;

                                if (fType != null) {
                                    if (/link\\(.+\\)/.test(fType.toString())) {
                                        let link = fType.toString().replace(new RegExp("link\\((.+)\\)"), "$1");
                                        let linkInfo = link.split('.');
                                        let linkTablePath = Util.makePath(this._serverName, this._databaseName, linkInfo[0] + ".jdbt");

                                        if (!Util.existsSync(linkTablePath)) {
                                            return reject(new Error("Database Error: Can't create the table \"" + name +
                                                "\". An error occur when linking the column \"" + field +
                                                "\" with the column \"" + linkInfo[1] + "\", the table \"" + linkInfo[0] +
                                                "\" doesn't exist in the database \"" + this._databaseName + "\"."));
                                        }

                                        let linkTableData = Database.getTableData(linkTablePath);
                                        if (linkTableData.prototype.indexOf(linkInfo[1]) == -1) {
                                            return reject(new Error("Database Error: Can't create the table \"" + name +
                                                "\". An error occur when linking the column \"" + field +
                                                "\" with the column \"" + linkInfo[1] + "\", the column \"" +
                                                linkInfo[1] + "\" doesn't exist in the table \"" + linkInfo[0] +
                                                "\" ."));
                                        }
                                        if ((linkTableData["properties"]["primary_keys"] != null &&
                                                Util.objectToArray(linkTableData.properties.primary_keys).indexOf(linkInfo[1]) == -1)
                                            ||
                                            (linkTableData["properties"]["unique_keys"] != null &&
                                                Util.objectToArray(linkTableData.properties.unique_keys).indexOf(linkInfo[1]) == -1)) {
                                            return reject(new Error("Database Error: Can't create the table \"" + name +
                                                "\". An error occur when linking the column \"" + field +
                                                "\" with the column \"" + linkInfo[1] + "\", the column \"" +
                                                linkInfo[1] +
                                                "\" is not a PRIMARY KEY or an UNIQUE KEY in the table \"" +
                                                linkInfo[0] + "\" ."));
                                        }

                                        delete prototype[field].default;
                                        delete prototype[field].max_length;
                                    }
                                    else {
                                        switch (fType.toString()) {
                                            case "bool":
                                            case "boolean":
                                                if (prototype[field].default !== null) {
                                                    if (prototype[field].default !== true && prototype[field].default !== false) {
                                                        prototype[field].default = false;
                                                    }
                                                }
                                                delete prototype[field].max_length;
                                                break;
                                            case "int":
                                            case "integer":
                                            case "number":
                                                if (prototype[field].default !== null) {
                                                    prototype[field].default = parseInt(<string>prototype[field].default) || 0;
                                                }
                                                delete prototype[field].max_length;
                                                break;
                                            case "float":
                                            case "decimal":
                                                if (prototype[field].default !== null) {
                                                    prototype[field].default = parseFloat(<string>prototype[field].default) || 0;
                                                }
                                                if (prototype[field].max_length !== null) {
                                                    prototype[field].max_length = parseInt((<number>prototype[field].max_length).toString()) || 0;
                                                }
                                                break;
                                            case "string":
                                                if (prototype[field].default !== null) {
                                                    prototype[field].default = (<string>prototype[field].default).toString();
                                                }
                                                if (prototype[field].max_length !== null) {
                                                    prototype[field].max_length = parseInt((<number>prototype[field].max_length).toString()) || 0;
                                                }
                                                break;
                                            default:
                                                return reject(new TypeError(`Database Error: The type "${fType}" isn't supported by JSONDB.`));
                                        }
                                    }
                                }
                            }
                            else {
                                prototype[field].type = "string";
                            }

                            fields.push(field);
                        }

                        let tableProperties = Util.merge(properties, prototype);
                        fields.unshift("#rowid");

                        let data = {
                            prototype: fields,
                            properties: tableProperties,
                            data: {}
                        };

                        Util.writeTextFile(path, JSON.stringify(data))
                            .then(res => {
                                if (res) {
                                    Benchmark.mark("Database_(createTable)_end");
                                    return executor(this);
                                }
                            })
                            .catch(reason => {
                                if (reason) {
                                    Benchmark.mark("Database_(createTable)_end");
                                    return reject(new Error(`Database Error: Can't create file "${path}".`));
                                }
                            });
                    }, reject);
            }
            catch (e) {
                return reject(e);
            }
        });
    }

    /**
     * Sends a query to the database.
     * @param {string} query The query to send to the database
     */
    public query(query: string): any {
        return new Query(this).send(query);
    }

    /**
     * Sends a query asynchronously to the database.
     * @param {string} query The query to send to the database
     */
    public queryAsync(query: string): Promise<any> {
        return new Promise<any>((executor, reject) => {
            try {

                executor = executor || null;

                if (null === executor || !(typeof executor === 'function')) {
                    return reject(new Error("Database Error: Can't send a query asynchronously without a callback."));
                }

                executor(this.query(query));

            } catch (e) {
                return reject(e);
            }
        });
    }

    /**
     * Sends multiple queries at once.
     * @param {string} queries The queries to send to the database
     */
    public queries(queries: string): any {
        return new Query(this).multiSend(queries);
    }

    /**
     * Sends multiple queries asynchronously.
     * @param {string} queries The queries to send to the database
     */
    public queriesAsync(queries: string): Promise<any> {
        return new Promise<any>((executor, reject) => {
            try {

                executor = executor || null;

                if (null === executor || !(typeof executor === 'function')) {
                    return reject(new Error("Database Error: Can't send a query asynchronously without a callback."));
                }

                executor(this.queries(queries));

            } catch (e) {
                return reject(e);
            }
        });
    }

    /**
     * Sends a prepared query.
     * @param {string} query The query
     * @return {PreparedQueryStatement}
     */
    public prepare(query: string): PreparedQueryStatement {
        return new Query(this).prepare(query);
    }

    /**
     * Sends a prepared query asynchronously.
     * @param {string} query The query to send to the database
     */
    public prepareAsync(query: string): Promise<any> {
        return new Promise<any>((executor, reject) => {
            try {

                executor = executor || null;

                if (null === executor || !(typeof executor === 'function')) {
                    return reject(new Error("Database Error: Can't send a query asynchronously without a callback."));
                }

                executor(this.prepare(query));

            } catch (e) {
                return reject(e);
            }
        });
    }
}
