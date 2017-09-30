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
 * @file       Configuration.ts
 */

declare var __filename: string;

import { Util } from "./Util";
import { UserConfiguration, User } from "./config/User";

import * as _f from 'fs';
import * as _p from 'path';

/**
 * Class Configuration
 *
 * @package    JSONDB
 * @subpackage Utilities
 * @category   Configuration
 * @author     Nana Axel <ax.lnana@outlook.com>
 */
export class Configuration
{
    /**
     * Removes a server from the list of registered server.
     * @param {string} server The name of the server
     */
    public static removeServer(server: string)
    {
        let config = Configuration.getConfig<UserConfiguration>("users");
        delete config[server];

        Configuration._writeConfig("users", config);
    }

    /**
     * Adds an user in the inner configuration file
     * @param {string} server   The name of the server
     * @param {string} username The username
     * @param {string} password The user's password
     */
    public static addUser(server: string, username: string, password: string)
    {
        let config = Configuration.getConfig<UserConfiguration>('users');
        let user: User = {
            username: Util.crypt(username),
            password: Util.crypt(password)
        };

        if (!Util.isset(config[server]))
        {
            config[server] = new Array<User>();
        }

        config[server].push(user);

        Configuration._writeConfig('users', config);
    }

    /**
     * Removes an user in the inner configuration file
     * @param {string} server   The name of the server
     * @param {string} username The username
     * @param {string} password The user's password
     */
    public static removeUser(server: string, username: string, password: string)
    {
        let config = Configuration.getConfig<UserConfiguration>("users");
        let i = 0;

        if (!Util.isset(config[server]))
        {
            return;
        }

        config[server].forEach(user =>
        {
            if (user.username === Util.crypt(username) && user.password === Util.crypt(password))
            {
                delete config[server][i];
            }
            ++i;
        });

        Configuration._writeConfig("users", config);
    }

    /**
     * Gets a JSONDB configuration file
     * @param {string} filename The config file's name
     * @type T The configurtion type to return.
     * @return {T}
     */
    public static getConfig<T>(filename: string): T
    {
        if (Configuration._exists(filename))
        {
            return <T>JSON.parse(_f.readFileSync(_p.normalize(_p.dirname(_p.dirname(__filename)) + '/config/' + filename + '.json')));
        } else
        {
            Configuration._writeConfig(filename, {});
            return <T>{};
        }
    }

    /**
     * Writes a config file
     * @param {string} filename
     * @param {any}    config
     * @return {boolean}
     */
    private static _writeConfig(filename: string, config: any)
    {
        var path = _p.normalize(_p.dirname(_p.dirname(__filename)) + '/config/' + filename + '.json');
        if (!Configuration._exists(filename))
        {
            if (_f.closeSync(_f.openSync(path, 'w')))
            {
                _f.chmodSync(path, 0x1ff);
            }
        }
        _f.writeFileSync(path, JSON.stringify(config));
    }

    /**
     * Checks if a configuration file exist
     * @param {string} filename
     * @return {boolean}
     */
    private static _exists(filename: string)
    {
        return Util.existsSync(_p.normalize(_p.dirname(_p.dirname(__filename)) + '/config/' + filename + '.json'));
    }
}
