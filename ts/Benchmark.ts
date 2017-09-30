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
 * @file       Benchmark.ts
 */

/**
 * A BechmarkPoint, wich stores the time and the consumed memory.
 */
export interface BenchmarkPoint
{
    t: number;
    m: number;
}

/**
 * A collection of BechmarkPoints.
 */
export interface BenchmarkPointCollection
{
    [x: string]: BenchmarkPoint;
}

/**
 * Class Benchmark
 *
 * @package    JSONDB
 * @subpackage Utilities
 * @category   Benchmark
 * @author     Nana Axel <ax.lnana@outlook.com>
 */
export class Benchmark
{
    /**
     * The collection of benchmark points.
     * @access private
     * @static
     * @var {BenchmarkPointCollection}
     */
    private static _marker: BenchmarkPointCollection = {};

    /**
     * Add a benchmark point.
     * @todo Find a way to calculate memory consumption in Node.js
     * @param  {string}  name  The name of the benchmark point.
     * @return {void}
     */
    public static mark(name: string)
    {
        Benchmark._marker[name] = {
            t: (new Date()).getTime(),
            m: 0
        };
    }

    /**
     * Calculate the elapsed time between two benchmark points.
     * @param  {string}  point1  The name of the first benchmark point
     * @param  {string}  point2  The name of the second benchmark point
     * @return {number}
     */
    public static elapsed_time(point1: string, point2: string)
    {
        point1 = point1 || "";
        point2 = point2 || "";

        if (point1 === null || point1 === "" || point2 === null || point2 === "")
        {
            return 0;
        }
        if (typeof Benchmark._marker[point1] === "undefined")
        {
            Benchmark.mark(point1);
        }
        if (typeof Benchmark._marker[point2] === "undefined")
        {
            Benchmark.mark(point2);
        }

        let s = Benchmark._marker[point1].t;
        let e = Benchmark._marker[point2].t;

        return e - s;
    }

    /**
     * Calculate the memory usage of a benchmark point
     * @param  {string}  point1  The name of the first benchmark point
     * @param  {string}  point2  The name of the second benchmark point
     * @return {*}
     */
    public static memory_usage(point1: string, point2: string)
    {
        point1 = point1 || "";
        point2 = point2 || "";

        if (point1 === null || point1 === "" || point2 === null || point2 === "")
        {
            return 0;
        }
        if (typeof Benchmark._marker[point1] === "undefined")
        {
            Benchmark.mark(point1);
        }
        if (typeof Benchmark._marker[point2] === "undefined")
        {
            Benchmark.mark(point2);
        }

        let s = Benchmark._marker[point1].m;
        let e = Benchmark._marker[point2].m;

        return e - s;
    };
}