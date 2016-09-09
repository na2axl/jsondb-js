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
 * Class Benchmark
 *
 * @package		JSONDB
 * @subpackage  Utilities
 * @category    Benchmark
 * @author		Nana Axel
 */
var Benchmark = function () { };

/**
 * The benchmark
 * @static {Object}
 * @access private
 */
Benchmark.marker = {};

/**
 * Add a benchmark point.
 * TODO: Find a way to calculate memory consumption in Node.js
 * @param  {string}  name  The name of the benchmark point
 * @return {void}
 */
Benchmark.prototype.mark = function (name) {
    Benchmark.marker[name] = {
        e: new Date().getTime(),
        m: 0
    };
};

/**
 * Calculate the elapsed time between two benchmark points.
 * @param  {string}  point1    The name of the first benchmark point
 * @param  {string}  point2    The name of the second benchmark point
 * @return {*}
 */
Benchmark.prototype.elapsed_time = function (point1, point2) {
    point1 = point1 || null;
    point2 = point2 || null;

    if (point1 === null) {
        return '{elapsed_time}';
    }
    if (typeof Benchmark.marker[point1] === "undefined") {
        return '';
    }
    if (typeof Benchmark.marker[point2] === "undefined") {
        this.mark(point2);
    }
    var s = Benchmark.marker[point1].e;
    var e = Benchmark.marker[point2].e;

    return e - s;
};

/**
 * Calculate the memory usage of a benchmark point
 * @param  {string}  point1    The name of the first benchmark point
 * @param  {string}  point2    The name of the second benchmark point
 * @return {*}
 */
Benchmark.prototype.memory_usage = function (point1, point2) {
    point1 = point1 || null;
    point2 = point2 || null;

    if (point1 === null) {
        return '{memory_usage}';
    }
    if (typeof Benchmark.marker[point1] === "undefined") {
        return '';
    }
    if (typeof Benchmark.marker[point2] === "undefined") {
        this.mark(point2);
    }
    var s = Benchmark.marker[point1].m;
    var e = Benchmark.marker[point2].m;

    return e - s;
};

// Exports the module
module.exports = new Benchmark();