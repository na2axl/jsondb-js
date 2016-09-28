/**
 * JSONDB - JSON Database Manager
 *
 * Manage JSON files as databases with JSON Query Language (JQL)
 *
 * This content is released under the GPL License (GPL-3.0)
 *
 * Copyright (c) 2016, Centers Technologies
 *
 * @package	   JSONDB
 * @author	   Nana Axel
 * @copyright  Copyright (c) 2016, Centers Technologies
 * @license	   http://spdx.org/licenses/GPL-3.0 GPL License
 * @filesource
 */

/**
 * Class Configuration
 *
 * @package		JSONDB
 * @subpackage  Utilities
 * @category    Configuration
 * @author		Nana Axel
 */
var Configuration = (function () {
    function Configuration() { }

    /**
     * Adds a user in the inner configuration file
     * @param {string} server   The path to the server
     * @param {string} username The username
     * @param {string} password The user's password
     */
    Configuration.prototype.addUser = function (server, username, password) {
        var Util = require('./Util');
        var config = this.getConfig('users');
        config[server] = {
            'username': Util.crypt(username),
            'password': Util.crypt(password)
        };
        this._writeConfig('users', config);
    };

    /**
     * Gets a JSONDB configuration file
     * @param {string} filename The config file's name
     * @return {object}
     */
    Configuration.prototype.getConfig = function (filename) {
        var _f = require('fs');
        var _p = require('path');
        if (this._exists(filename)) {
            return JSON.parse(_f.readFileSync(_p.normalize(_p.dirname(_p.dirname(__filename)) + '/config/' + filename + '.json')));
        } else {
            this._writeConfig(filename, {});
            return {};
        }
    };

    /**
     * Writes a config file
     * @param {string} filename
     * @param {object} config
     * @return {boolean}
     */
    Configuration.prototype._writeConfig = function (filename, config) {
        var _f = require('fs');
        var _p = require('path');
        var path = _p.normalize(_p.dirname(_p.dirname(__filename)) + '/config/' + filename + '.json');
        if (!this._exists(filename)) {
            if (_f.closeSync(_f.openSync(path, 'w'))) {
                _f.chmodSync(path, 0x1ff);
            }
        }
        _f.writeFileSync(path, JSON.stringify(config));
    };

    /**
     * Checks if a configuration file exist
     * @param {string} filename
     * @return {boolean}
     */
    Configuration.prototype._exists = function (filename) {
        var Util = require('./Util');
        var _p = require('path');
        return Util.existsSync(_p.normalize(_p.dirname(_p.dirname(__filename)) + '/config/' + filename + '.json'));
    };

    return Configuration;
})();

// Exports the module
module.exports = new Configuration();