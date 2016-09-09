/**
 * JSONDB - JSON Database Manager
 *
 * Manage JSON files as databases with JSON Query Language (JQL)
 *
 * This content is released under the MIT License (MIT)
 *
 * Copyright (c) 2016, Centers Technologies
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * @package	   JSONDB
 * @author	   Nana Axel
 * @copyright  Copyright (c) 2016, Centers Technologies
 * @license	   http://opensource.org/licenses/MIT MIT License
 * @filesource
 */

/**
 * Class QueryParser
 *
 * @package     JSONDB
 * @subpackage  Utilities
 * @category    Parser
 * @author      Nana Axel
 */
var QueryParser = function () { };

/**
 * Reserved query's characters
 * @const {string}
 */
QueryParser.TRIM_CHAR = '\'"`() ';

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
    return value.replace(/(['.,;()])/ig, '\\1').replace(/\\'|\\,|\\\.|\\\(|\\\)|\\;/ig, function (c) {
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
                return '{{semi}}'
        }
    });
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
    this.parsedQuery['table'] = queryParts[0];
    if (typeof this.parsedQuery['table'] === 'undefined') {
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
    this.parsedQuery['action'] = queryParts[1].replace(/\(.*\)/, '');
    if (!~QueryParser.supportedQueries.indexOf(this.parsedQuery['action'].toLowerCase())) {
        throw new Error("JSONDB Query Parse Error: The query \"" + this.parsedQuery['action'] + "\" isn't supported by JSONDB.");
    }

    // Getting the action's parameters
    this.parsedQuery['parameters'] = queryParts[1].replace(this.parsedQuery.action, '').replace(/\((.+)\)/, '$1').trim().split(',');
    this.parsedQuery['parameters'] = ((this.parsedQuery['parameters'][0]) ? this.parsedQuery['parameters'] : []).map(function (field) {
        return field.trim();
    });

    // Parsing values for some actions
    if (!!~['insert', 'replace'].indexOf(this.parsedQuery['action'].toLowerCase())) {
        this.parsedQuery['parameters'] = this.parsedQuery['parameters'].map(function (p) {
            return this._parseValue(p);
        }, this);
    }

    // Getting query's extensions
    this.parsedQuery['extensions'] = {};
    var extensions = {};
    for (var index in queryParts.slice(2)) {
        var extension = queryParts.slice(2)[index];
        var name = extension.replace(/\(.*\)/, '');
        var string = extension.replace(name, '').replace(/\((.*)\)/, '$1').trim();
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
    this.parsedQuery['extensions'] = extensions;

    this.parsedQuery['benchmark'] = {
        'elapsed_time': benchmark.elapsed_time('jsondb_query_parse_start', 'jsondb_query_parse_end'),
        'memory_usage': benchmark.memory_usage('jsondb_query_parse_start', 'jsondb_query_parse_end')
    };

    return this.parsedQuery;
};

/**
 * Parses an order() extension
 * @param {string} clause
 * @return {Array}
 * @throws Error
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
            filters['operator'] = operator;
            filters['field'] = row_val[0].replace(/['"`()]/g, '').trim();
            filters['value'] = this._parseValue(row_val[1]);
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
 * Parses a value
 *
 * It will convert (cast if necessary) a value
 * to its true type.
 *
 * @param {*} value
 * @return {boolean|int|string|null}
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
        return JSON.parse(this._parseValue(value.replace(':JSONDB::TO_ARRAY:', '')));
    } else if (trim_value[0] === "'" && trim_value[trim_value.length - 1] === "'") {
        return trim_value.replace(/['"`()]/g, '').trim().replace(/\{\{quot}}|\{\{comm}}|\{\{dot}}|\{\{pto}}|\{\{ptc}}|\{\{semi}}/ig, function (c) {
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
                    return ';'
            }
        });
    } else {
        return parseInt(value.replace(/['"`() ]/g, '').trim());
    }
};

// Exports the module
module.exports = new QueryParser();