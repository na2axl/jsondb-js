/**
 * JSONDB - JSON Database Manager
 *
 * Manage JSON files as databases with JSONDB Query Language (JQL)
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
 * Class QueryParser
 *
 * @package     JSONDB
 * @subpackage  Query
 * @category    Parser
 * @author      Nana Axel
 */
var QueryParser = (function () {
    function QueryParser() { }

    /**
     * Reserved query's characters
     * @const {string}
     */
    QueryParser.TRIM_CHAR = '\'"`()';

    /**
     * Reserved query's characters
     * @const {string}
     */
    QueryParser.ESCAPE_CHAR = '.,;\'()';

    /**
     * The not parsed query
     * @var {string}
     */
    QueryParser.prototype.notParsedQuery = '';

    /**
     * The parsed query
     * @var {object}
     */
    QueryParser.prototype.parsedQuery = {};

    /**
     * A list of supported queries
     * @var {array}
     */
    QueryParser.supportedQueries = ['select', 'insert', 'delete', 'replace', 'truncate', 'update', 'count'];

    /**
     * Registered query operators
     * @var {array}
     */
    QueryParser.operators = ['%!', '%=', '!=', '<>', '<=', '>=', '=', '<', '>'];

    /**
     * Quotes a value and escape reserved characters
     * @param {string} value
     * @return {string}
     */
    QueryParser.prototype.quote = function (value) {
        value = value.replace(new RegExp("([" + QueryParser.ESCAPE_CHAR + "])", "ig"), '\\$1').replace(/\\'|\\,|\\\.|\\\(|\\\)|\\;/ig, function (c) {
            switch (c) {
                case '\\\'':
                    return '{{quot}}';

                case '\\,':
                    return '{{comm}}';

                case '\\.':
                    return '{{dot}}';

                case '\\(':
                    return '{{pto}}';

                case '\\)':
                    return '{{ptc}}';

                case '\\;':
                    return '{{semi}}';
            }
        });
        return "'" + value + "'";
    };

    /**
     * Parses a query
     * @param {string} query
     * @return {object}
     * @throws {Error}
     */
    QueryParser.prototype.parse = function (query) {
        var benchmark = require('./Benchmark');
        benchmark.mark('jsondb_query_parse_start');

        this.notParsedQuery = query;

        // Getting query's parts
        var queryParts = this.notParsedQuery.split('.');

        // Getting the table name
        this.parsedQuery.table = queryParts[0];
        if (typeof this.parsedQuery.table === 'undefined') {
            throw new Error('JSONDB Query Parse Error: No table detected in the query.');
        }

        // Checking query's parts validity
        for (var ext in queryParts.slice(1)) {
            var part = queryParts.slice(1)[ext];
            if (null === part || part === '') {
                throw new Error("JSONDB Query Parse Error: Unexpected \".\" after extension \"" + part + "\".");
            }
            if (!part.match(/\w+\(.*\)/)) {
                throw new Error("JSONDB Query Parse Error: There is an error at the extension \"" + part + "\".");
            }
        }

        // Getting the query's main action
        this.parsedQuery.action = queryParts[1].replace(/\(.*\)/, '');
        if (!~QueryParser.supportedQueries.indexOf(this.parsedQuery.action.toLowerCase())) {
            throw new Error("JSONDB Query Parse Error: The query \"" + this.parsedQuery.action + "\" isn't supported by JSONDB.");
        }

        // Getting the action's parameters
        this.parsedQuery.parameters = queryParts[1].replace(/\w+\((.*)\)/, '$1').trim();
        this.parsedQuery.parameters = this.parsedQuery.parameters.replace(/\(([^)]*)\)/g, function (str) {
            return str.replace(/,/g, ';');
        });
        this.parsedQuery.parameters = this.parsedQuery.parameters.split(',');
        this.parsedQuery.parameters = ((this.parsedQuery.parameters[0]) ? this.parsedQuery.parameters : []).map(function (field) {
            return field.trim();
        });

        // Parsing values for some actions
        if (!!~['insert', 'replace'].indexOf(this.parsedQuery.action.toLowerCase())) {
            this.parsedQuery.parameters = this.parsedQuery.parameters.map(function (p) {
                return this._parseValue(p);
            }, this);
        }

        // Getting query's extensions
        this.parsedQuery.extensions = {};
        var extensions = {};
        for (var i = 2, l = queryParts.length; i < l; i++) {
            var extension = queryParts[i].trim();
            var name = extension.replace(/\(.*\)/, '');
            var string = extension.replace(new RegExp(name + "\((.*)\)"), '$1').trim().replace(/\(([^)]*)\)/g, function (str) {
                return str.replace(/,/g, ';');
            });
            switch (name.toLowerCase()) {
                case 'order':
                    extensions.order = this._parseOrderExtension(string);
                    break;

                case 'where':
                    if (!extensions.hasOwnProperty('where')) {
                        extensions.where = [];
                    }
                    extensions.where.push(this._parseWhereExtension(string));
                    break;

                case 'and':
                    if (!extensions.hasOwnProperty('and')) {
                        extensions.and = [];
                    }
                    extensions.and.push(this._parseAndExtension(string));
                    break;

                case 'limit':
                    extensions.limit = this._parseLimitExtension(string);
                    break;

                case 'in':
                    extensions.in = this._parseInExtension(string);
                    break;

                case 'with':
                    extensions.with = this._parseWithExtension(string);
                    break;

                case 'as':
                    extensions.as = this._parseAsExtension(string);
                    break;

                case 'group':
                    extensions.group = this._parseGroupExtension(string);
                    break;

                case 'on':
                    if (!extensions.hasOwnProperty('on')) {
                        extensions.on = [];
                    }
                    extensions.on.push(this._parseOnExtension(string));
                    break;

                case 'link':
                    if (!extensions.hasOwnProperty('link')) {
                        extensions.link = [];
                    }
                    extensions.link.push(this._parseLinkExtension(string));
                    break;
            }
        }
        this.parsedQuery.extensions = extensions;

        this.parsedQuery.benchmark = {
            'elapsed_time': benchmark.elapsed_time('jsondb_query_parse_start', 'jsondb_query_parse_end'),
            'memory_usage': benchmark.memory_usage('jsondb_query_parse_start', 'jsondb_query_parse_end')
        };

        return this.parsedQuery;
    };

    /**
     * Parses an order() extension
     * @param {string} clause
     * @return {Array}
     * @throws {Error}
     * @private
     */
    QueryParser.prototype._parseOrderExtension = function (clause) {
        var parsedClause = clause.split(',').map(function(field) {
            return field.replace(/['"`()]/g, '').trim();
        });

        parsedClause = (parsedClause[0]) ? parsedClause : [];

        if (parsedClause.length === 0) {
            throw new Error("JSONDB Query Parse Error: At least one parameter expected for the \"order()\" extension.");
        }
        if (parsedClause.length > 2) {
            throw new Error("JSONDB Query Parse Error: Too much parameters given to the \"order()\" extension, only two required.");
        }
        if (!(typeof parsedClause[1] === 'undefined') && !~['asc', 'desc'].indexOf(parsedClause[1].toLowerCase())) {
            throw new Error("JSONDB Query Parse Error: The second parameter of the \"order()\" extension can only have values: \"asc\" or \"desc\".");
        }
        if (typeof parsedClause[1] === 'undefined') {
            parsedClause[1] = 'asc';
        }

        return parsedClause;
    };

    /**
     * Parses a where() extension
     * @param {string} clause
     * @return {Array}
     * @throws {Error}
     * @private
     */
    QueryParser.prototype._parseWhereExtension = function (clause) {
        var parsedClause = clause.split(',');
        parsedClause = (parsedClause[0]) ? parsedClause : [];

        if (parsedClause.length === 0) {
            throw new Error("JSONDB Query Parse Error: At least one parameter expected for the \"where()\" extension.");
        }

        for (var index in parsedClause) {
            parsedClause[index] = this._parseWhereExtensionCondition(parsedClause[index]);
        }

        return parsedClause;
    };

    /**
     * Parses a where() extension's condition
     * @param {string} condition The condition
     * @return {Object}
     * @private
     */
    QueryParser.prototype._parseWhereExtensionCondition = function (condition) {
        var filters = [];

        for (var index in QueryParser.operators) {
            var operator = QueryParser.operators[index];
            if (!!~condition.indexOf(operator) || !!~condition.split(',').indexOf(operator) || !!~condition.split('').indexOf(operator)) {
                var row_val = condition.split(operator);
                filters.operator = operator;
                filters.field = row_val[0].replace(/['"`]/g, '').trim();
                if (row_val.length > 2) {
                    filters.value = this._parseValue(row_val.slice(1).join(operator));
                }
                else {
                    filters.value = this._parseValue(row_val[1]);
                }
                break;
            }
        }

        return filters;
    };

    /**
     * Parses an and() extension
     * @param {string} clause
     * @return {Array}
     * @throws {Error}
     * @private
     */
    QueryParser.prototype._parseAndExtension = function (clause) {
        var parsedClause = clause.split(',');
        parsedClause = (parsedClause[0]) ? parsedClause : [];

        if (parsedClause.length === 0) {
            throw new Error("JSONDB Query Parse Error: At least one parameter expected for the \"and()\" extension.");
        }

        return parsedClause.map(function (value) {
            return this._parseValue(value);
        }, this);
    };

    /**
     * Parses a limit() condition
     * @param {string} clause
     * @return {Array}
     * @throws {Error}
     * @private
     */
    QueryParser.prototype._parseLimitExtension = function (clause) {
        var parsedClause = clause.split(',');
        parsedClause = (parsedClause[0] || parseInt(parsedClause[0]) === 0) ? parsedClause : [];

        if (parsedClause.length === 0) {
            throw new Error("JSONDB Query Parse Error: At least one parameter expected for the \"limit()\" extension.");
        }
        if (parsedClause.length > 2) {
            throw new Error("JSONDB Query Parse Error: Too much parameters given to the \"limit()\" extension, only two required.");
        }

        if (typeof parsedClause[1] === 'undefined') {
            parsedClause[1] = parsedClause[0];
            parsedClause[0] = 0;
        }

        return parsedClause.map(function (value) {
            return this._parseValue(value);
        }, this);
    };

    /**
     * Parses an in() extension
     * @param {string} clause
     * @return {Array}
     * @throws {Error}
     * @private
     */
    QueryParser.prototype._parseInExtension = function (clause) {
        var parsedClause = clause.split(',').map(function(field) {
            return field.replace(/['"`()]/g, '').trim();
        });

        parsedClause = (parsedClause[0]) ? parsedClause : [];

        if (parsedClause.length === 0) {
            throw new Error("JSONDB Query Parse Error: At least one parameter expected for the \"in()\" extension.");
        }

        return parsedClause;
    };

    /**
     * Parses a with() extension
     * @param {string} clause
     * @return {Array}
     * @throws {Error}
     * @private
     */
    QueryParser.prototype._parseWithExtension = function (clause) {
        var parsedClause = clause.split(',');
        parsedClause = (parsedClause[0]) ? parsedClause : [];

        if (parsedClause.length === 0) {
            throw new Error("JSONDB Query Parse Error: At least one parameter expected for the \"with()\" extension.");
        }

        return parsedClause.map(function (value) {
            return this._parseValue(value);
        }, this);
    };

    /**
     * Parses a as() extension
     * @param {string} clause
     * @return {Array}
     * @throws {Error}
     * @private
     */
    QueryParser.prototype._parseAsExtension = function (clause) {
        var parsedClause = clause.split(',').map(function(field) {
            return field.replace(/['"`()]/g, '').trim();
        });

        parsedClause = (parsedClause[0]) ? parsedClause : [];

        if (parsedClause.length === 0) {
            throw new Error("JSONDB Query Parse Error: At least one parameter expected for the \"as()\" extension.");
        }

        return parsedClause;
    };

    /**
     * Parses a group() extension
     * @param {string} clause
     * @return {Array}
     * @throws {Error}
     * @private
     */
    QueryParser.prototype._parseGroupExtension = function (clause) {
        var parsedClause = clause.split(',').map(function(field) {
            return field.replace(/['"`()]/g, '').trim();
        });

        parsedClause = (parsedClause[0]) ? parsedClause : [];

        if (parsedClause.length === 0) {
            throw new Error("JSONDB Query Parse Error: At least one parameter expected for the \"group()\" extension.");
        }
        if (parsedClause.length > 1) {
            throw new Error("JSONDB Query Parse Error: Too much parameters given to the \"group()\" extension, only one required.");
        }

        return parsedClause;
    };

    /**
     * Parses a on() extension
     * @param {string} clause
     * @return {string}
     * @throws {Error}
     * @private
     */
    QueryParser.prototype._parseOnExtension = function (clause) {
        var parsedClause = clause.split(',').map(function(field) {
            return field.replace(/['"`()]/g, '').trim();
        });

        parsedClause = (parsedClause[0]) ? parsedClause : [];

        if (parsedClause.length === 0) {
            throw new Error("JSONDB Query Parse Error: At least one parameter expected for the \"on()\" extension.");
        }
        if (parsedClause.length > 1) {
            throw new Error("JSONDB Query Parse Error: Too much parameters given to the \"on()\" extension, only one required.");
        }

        return parsedClause[0];
    };

    /**
     * Parse a link() extension
     * @param {string} clause
     * @return {Array}
     * @throws {Error}
     * @private
     */
    QueryParser.prototype._parseLinkExtension = function (clause) {
        var parsedClause = clause.split(',').map(function(field) {
            return field.replace(/['"`()]/g, '').trim();
        });

        parsedClause = (parsedClause[0]) ? parsedClause : [];

        if (parsedClause.length === 0) {
            throw new Error("JSONDB Query Parse Error: At least one parameter expected for the \"link()\" extension.");
        }

        return parsedClause;
    };

    /**
     * Executes a function and return the result
     * @param {string} func The query function to execute
     * @return {*}
     * @throws {Error}
     * @private
     */
    QueryParser.prototype._parseFunction = function (func) {
        var parts = func.match(/(\w+)\((.*)\)/);
        var name = parts[1].toLowerCase();
        var params = (parts[2] && parts[2].split(';').map((function (_this) {
            return function (val) {
                return _this._parseValue(val);
            };
        })(this))) || false;

        var Util = new (require('./Util'))();

        switch (name) {
            case 'sha1':
                if (params === false) {
                    throw new Error("JSONDB Query Parse Error: There is no parameters for the function sha1(). Can't execute the query.");
                }
                if (params.length > 1) {
                    throw new Error("JSONDB Query Parse Error: Too much parameters for the function sha1(), only one is required.");
                }
                var shasum = require('crypto').createHash('sha1');
                shasum.update(params[0]);
                return shasum.digest("HEX");

            case 'md5':
                if (params === false) {
                    throw new Error("JSONDB Query Parse Error: There is no parameters for the function md5(). Can't execute the query.");
                }
                if (params.length > 1) {
                    throw new Error("JSONDB Query Parse Error: Too much parameters for the function md5(), only one is required.");
                }
                var md5 = require('crypto').createHash('md5');
                md5.update(params[0]);
                return md5.digest("HEX");

            case 'time':
                if (params !== false) {
                    throw new Error("JSONDB Query Parse Error: Too much parameters for the function time(), no one is required.");
                }
                return (new Date()).getTime();

            case 'now':
                var date = new Date();
                var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                var months = ['January', 'Febuary', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                if (params === false) {
                    return [date.getFullYear(), date.getMonth(), date.getDate()].map(Util.zeropad).join('-') + ' ' + [date.getHours(), date.getMinutes(), date.getSeconds()].map(Util.zeropad).join(':');
                } else {
                    if (params.length > 1) {
                        throw new Error("JSONDB Query Parse Error: Too much parameters for the function now(), only one is required.");
                    }
                    return params[0]
                        .replace(/\%a/g, days[date.getDay()].substr(0, 3))
                        .replace(/\%A/g, days[date.getDay()])
                        .replace(/\%d/g, Util.zeropad(date.getDate()))
                        .replace(/\%m/g, Util.zeropad(date.getMonth()))
                        .replace(/\%e/g, date.getMonth())
                        .replace(/\%w/g, date.getDay())
                        .replace(/\%W/g, Util.zeropad(date.getDay()))
                        .replace(/\%b/g, months[date.getMonth()].substr(0, 3))
                        .replace(/\%B/g, months[date.getMonth()])
                        .replace(/\%y/g, date.getFullYear() % 1000)
                        .replace(/\%Y/g, date.getFullYear())
                        .replace(/\%H/g, Util.zeropad(date.getHours()))
                        .replace(/\%k/g, date.getHours())
                        .replace(/\%M/g, Util.zeropad(date.getMinutes()))
                        .replace(/\%S/g, Util.zeropad(date.getSeconds()));
                }

            case 'lowercase':
                if (params === false) {
                    throw new Error("JSONDB Query Parse Error: There is no parameters for the function lowercase(). Can't execute the query.");
                }
                if (params.length > 1) {
                    throw new Error("JSONDB Query Parse Error: Too much parameters for the function lowercase(), only one is required.");
                }
                return params[0].toLowerCase();

            case 'uppercase':
                if (params === false) {
                    throw new Error("JSONDB Query Parse Error: There is no parameters for the function uppercase(). Can't execute the query.");
                }
                if (params.length > 1) {
                    throw new Error("JSONDB Query Parse Error: Too much parameters for the function uppercase(), only one is required.");
                }
                return params[0].toUpperCase();

            case 'ucfirst':
                if (params === false) {
                    throw new Error("JSONDB Query Parse Error: There is no parameters for the function uppercase(). Can't execute the query.");
                }
                if (params.length > 1) {
                    throw new Error("JSONDB Query Parse Error: Too much parameters for the function uppercase(), only one is required.");
                }
                var first = params[0][0].toUpperCase();
                return first + params[0].substr(1).toLowerCase();

            case 'strlen':
                if (params === false) {
                    throw new Error("JSONDB Query Parse Error: There is no parameters for the function strlen(). Can't execute the query.");
                }
                if (params.length > 1) {
                    throw new Error("JSONDB Query Parse Error: Too much parameters for the function strlen(), only one is required.");
                }
                return params[0].length;

            default:
                throw new Error("JSONDB Query Parse Error: Sorry but the function " + name + "() is not implemented in JQL.");
        }
    };

    /**
     * Parses a value
     *
     * It will convert (cast if necessary) a value
     * to its true type.
     *
     * @param {*} value
     * @return {boolean|int|string|object|Array|null}
     * @private
     */
    QueryParser.prototype._parseValue = function (value) {
        var trim_value = value.trim();

        if (!!~value.indexOf(':JSONDB::TO_BOOL:')) {
            return !!parseInt(value.replace(':JSONDB::TO_BOOL:', ''));
        } else if (value.toLowerCase() === 'false') {
            return false;
        } else if (value.toLowerCase() === 'true') {
            return true;
        } else if (!!~value.indexOf(':JSONDB::TO_NULL:') || value.toLowerCase() === 'null') {
            return null;
        } else if (!!~value.indexOf(':JSONDB::TO_ARRAY:')) {
            return (new (require('./Util'))()).unserialize(this._parseValue(value.replace(':JSONDB::TO_ARRAY:', '')));
        } else if (trim_value[0] === "'" && trim_value[trim_value.length - 1] === "'") {
            return trim_value.replace(new RegExp("[" + QueryParser.TRIM_CHAR + "]", "g"), '').trim().replace(/\{\{quot}}|\{\{comm}}|\{\{dot}}|\{\{pto}}|\{\{ptc}}|\{\{semi}}/ig, function (c) {
                switch (c) {
                    case '{{quot}}':
                        return '\'';

                    case '{{comm}}':
                        return ',';

                    case '{{dot}}':
                        return '.';

                    case '{{pto}}':
                        return '(';

                    case '{{ptc}}':
                        return ')';

                    case '{{semi}}':
                        return ';';
                }
            });
        } else if (/\w+\(.*\)/.test(value)) {
            return this._parseFunction(value);
        } else {
            return parseInt(value.replace(new RegExp("[" + QueryParser.TRIM_CHAR + "]", "g"), '').trim());
        }
    };

    return QueryParser;
})();

// Exports the module
module.exports = QueryParser;
