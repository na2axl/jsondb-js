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
 * Class Benchmark
 *
 * @package		JSONDB
 * @subpackage  Utilities
 * @category    Benchmark
 * @author		Nana Axel
 */
var Benchmark = (function () {
    function Benchmark() { }

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
            this.mark(point1);
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
            this.mark(point1);
        }
        if (typeof Benchmark.marker[point2] === "undefined") {
            this.mark(point2);
        }
        var s = Benchmark.marker[point1].m;
        var e = Benchmark.marker[point2].m;

        return e - s;
    };

    return Benchmark;
})();

// Exports the module
module.exports = new Benchmark();
