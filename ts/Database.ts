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

declare var __filename: string;

import { Configuration } from "./Configuration";
import { Benchmark } from "./Benchmark";
import { Util } from "./Util";
import { UserConfiguration } from "./config/User";
import { TablePrototype } from "./types/TablePrototype";

import * as _f from 'fs';
import * as _p from 'path';

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
     * The username used for connection.
     */
    private _username: string;

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
     * The username of the current connected client.
     */
    public get username(): string {
        return this._username;
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
     * Database Manager constructor.
     * @param {string} server The name of the server to connect on
     * @param {string} username The username which match the server
     * @param {string} password The password which match the username
     * @param {string} database The name of the database
     */
    constructor(server: string, username: string, password: string, database: string) {

        if (!Util.isset(server) || !Util.isset(username) || !Util.isset(password)) {
            throw new Error('Database Error: Can\'t connect to the server, missing parameters.');
        }

        let userFound = false;

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
                    this.setDatabase(database);
                } catch (e) {
                    Benchmark.mark("Database_(connect)_end");
                    throw e;
                }
            }
        }
        Benchmark.mark("Database_(connect)_end");

    }

    /**
     * Disconnect from the server.
     */
    public disconnect() {
        Benchmark.mark("Database_(disconnect)_start");
        this._serverName = "";
        this._databaseName = "";
        this._username = "";
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
    public existsAsync(database: string): Promise<boolean>
    {
        return new Promise<boolean>((executor, reject) =>
        {
            try
            {
                executor = executor || null;

                if (null === executor || !(typeof executor === "function"))
                {
                    throw new Error("JSONDB Error: Can't check asynchronously if a database exists without a callback.");
                }

                if (!Util.isset(database))
                {
                    executor(false);
                }

                Util.exists(Database.getDatabasePath(this.server, database))
                    .then(executor)
                    .catch(reject);
            }
            catch (e)
            {
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
        Benchmark.mark("Database_(createDatabase)_end");

        return this;
    }

    /**
     * Creates a new table in the current working database.
     * @param {string} name The name of the table
     * @param {Array} prototype The prototype of the table
     * @returns {Database} The current Database instance
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

        var path = Util.makePath(this._serverName, this._databaseName, name + ".jdbt");

        if (Util.exists(path)) {
            Benchmark.mark("Database_(createTable)_end");
            throw new Error(`Database Error: Can't create the table "${name}" in the database "${this._databaseName}". The table already exist.`);
        }

        var fields = new Array<string>();
        var properties = {
            last_insert_id: 0,
            last_valid_row_id: 0,
            last_link_id: 0,
            primary_keys: new Array<string>(),
            unique_keys: new Array<string>()
        };
        var aiExist = false;

        for (let field in prototype) {
            var prop = prototype[field];
            var hasAi = prop.auto_increment !== null;
            var hasPk = prop.primary_key !== null;
            var hasUk = prop.unique_key !== null;
            var hasTp = prop.type !== null;

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
                var fType = prop.type;

                if (fType != null) {
                    if (/link\\(.+\\)/.test(fType.toString())) {
                        var link = fType.toString().replace(new RegExp("link\\((.+)\\)"), "$1");
                        var linkInfo = link.split('.');
                        var linkTablePath = Util.makePath(this._serverName, this._databaseName, linkInfo[0] + ".jdbt");

                        if (!Util.exists(linkTablePath)) {
                            throw new Error("Database Error: Can't create the table \"" + name +
                                "\". An error occur when linking the column \"" + field +
                                "\" with the column \"" + linkInfo[1] + "\", the table \"" + linkInfo[0] +
                                "\" doesn't exist in the database \"" + this._databaseName + "\".");
                        }

                        var linkTableData = Database.getTableData(linkTablePath);
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

        var data =  {
            prototype: fields,
            properties: tableProperties,
            data: {}
        };

        if (Util.writeTextFile(path, JSON.stringify(data)))
        {
            Benchmark.mark("Database_(createTable)_end");
            return this;
        }

        Benchmark.mark("Database_(createTable)_end");

        throw new Error(`Database Error: Can't create file "${path}".`);
    }

    /**
     * Sends a query to the data.
     * @param {string} query The query to send to the database
     */
    public query(query: string): any
    {
        return new Query(this).Send(query);
    }

    /**
     * Sends multiple queries at once.
     * @param {string} query The queries to send to the database
     */
    public multiQuery(queries: string): any
    {
        return new Query(this).MultiSend(queries);
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
     * @param {null|string} table The table name
     * @return {string}
     */
    public static getTablePath(server: string, database: string, table: string): string {
        return server + '/' + database + '/' + table + ".json";
    }

    /**
     * Returns a table's data
     * @param {string|null} path The path to the table
     * @return {object}
     */
    public static getTableData(path: string) {
        return JSON.parse(_f.readFileSync(path));
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



}