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
 * @file       User.ts
 */

 /**
 * An interface which represents an user.
 */
export interface User {
    username: string;
    password: string;
}

/**
 * An interface which represents the users.json configuration
 * file architecture
 */
export interface UserConfiguration {
    [server_name: string]: Array<User>;
}