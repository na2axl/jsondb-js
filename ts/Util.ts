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
 * @file       Util.ts
 */

import * as _f from 'fs';
import * as _p from 'path';
import * as _c from 'crypto';

/**
 * Class Util
 *
 * @package     JSONDB
 * @subpackage  Utilities
 * @category    Utilities
 * @author      Nana Axel <ax.lnana@outlook.com>
 */
export class Util {
    /**
     * String encryption salt
     * @static
     * @let {string}
     */
    public static readonly cryptSalt = '<~>:q;axMw|S01%@yu*lfr^Q#j)OG<Z_dQOvzuTZsa^sm0K}*u9{d3A[ekV;/x[c';

    /**
     * Encrypt a string
     * @param {string} string
     * @return {string}
     */
    public static crypt(string: string) {
        let shasum = _c.createHash('sha1');
        shasum.update(string + Util.cryptSalt);
        return shasum.digest("HEX");
    }

    /**
     * Concatenates two or more objects
     * @param {...any}
     * @return {any}
     */
    public static concat() {
        let ret: any = {}
        for (let i = 0, l = arguments.length; i < l; i++) {
            for (let p in arguments[i]) {
                if (arguments[i].hasOwnProperty(p)) {
                    ret[p] = arguments[i][p];
                }
            }
        }
        return ret;
    }

    /**
     * Returns an array of values
     * @param {Array} array
     * @return {Array}
     */
    public static values(array: Array<any>) {
        let ret = [];
        for (let i = 0, l = array.length; i < l; i++) {
            if (array[i]) ret.push(array[i]);
        }
        return ret;
    }

    /**
     * Returns an array of values
     * @param {any} object
     * @return {Array}
     */
    public static objectToArray(object: any) {
        let ret = [];
        for (let key in object) {
            if (object.hasOwnProperty(key)) {
                ret.push(object[key]);
            }
        }
        return ret;
    }

    /**
     * Returns the length of an object
     * @param {any} object
     * @return {number}
     */
    public static count(object: any) {
        let ret = 0;
        for (let key in object) {
            if (object.hasOwnProperty(key)) {
                ret++;
            }
        }
        return ret;
    }

    /**
     * Creates an array with given keys and values
     * @param {Array} key
     * @param {Array} values
     * @return {object}
     */
    public static combine(key: Array<string>, values: Array<any>) {
        let ret: any = {}

        for (let i = 0, l = key.length; i < l; i++) {
            ret[key[i]] = values[i];
        }

        return ret;
    }

    /**
     * Computes the difference between two arrays
     * @param {Array} array1
     * @param {Array} array2
     * @return {Array}
     */
    public static diff<T>(array1: Array<T>, array2: Array<T>) {
        let ret = [];
        for (let i = 0, l = array1.length; i < l; i++) {
            if (!~array2.indexOf(array1[i])) {
                ret.push(array1[i]);
            }
        }
        return ret;
    }

    /**
     * Computes the difference between keys of two objects
     * @param {object} object1
     * @param {object} object2
     * @return {object}
     */
    public static diff_key<T>(object1: Array<T>, object2: Array<T>) {
        let ret: any = {}
        for (let key in object1) {
            if (!(object1.hasOwnProperty(key) && object2.hasOwnProperty(key))) {
                ret[key] = object1[key];
            }
        }
        return ret;
    }

    /**
     * Computes the intersection between two arrays
     * @param {Array} array1
     * @param {Array} array2
     * @return {Array}
     */
    public static intersect<T>(array1: Array<T>, array2: Array<T>) {
        let ret = [];
        for (let i = 0, l = array1.length; i < l; i++) {
            if (!!~array2.indexOf(array1[i])) {
                ret.push(array1[i]);
            }
        }
        return ret;
    }

    /**
     * Computes the intersection between keys of two objects
     * @param {object} object1
     * @param {object} object2
     * @return {object}
     */
    public static intersect_key<T>(object1: Array<T>, object2: Array<T>) {
        let ret: any = {}
        for (let key in object1) {
            if (!(object1.hasOwnProperty(key) && !object2.hasOwnProperty(key))) {
                ret[key] = object1[key];
            }
        }
        return ret;
    }

    /**
     * Flips the key->value pairs of an object
     * @param {object} object
     * @return {object}
     */
    public static flip(object: any) {
        let ret: any = {}
        for (let key in object) {
            if (object.hasOwnProperty(key)) {
                ret[object[key]] = key;
            }
        }
        return ret;
    }

    /**
     * Sorts an object by a defined function
     * @param {object} object
     * @param {function} func
     * @return {object}
     */
    public static usort<T>(object: T, func: (after: T, now: T) => boolean) {
        func = func || ((after: T, now: T) => now > after);
        let ret: any = {}
        let tmp: Array<any> = [];
        for (let key in object) {
            if (object.hasOwnProperty(key)) {
                tmp.push(object[key]);
            }
        }
        for (let i = 0, l = tmp.length; i < l - 1; i++) {
            for (let j = 1; j < l; j++) {
                if (func(tmp[j], tmp[i])) {
                    let k = tmp[i];
                    tmp[i] = tmp[j];
                    tmp[j] = k;
                }
            }
        }
        for (let i = 0, l = tmp.length; i < l; i++) {
            for (let key in object) {
                if (object.hasOwnProperty(key)) {
                    if (tmp[i] === object[key]) {
                        ret[key] = object[key];
                        break;
                    }
                }
            }
        }
        return ret;
    }

    /**
     * Sorts keys of an object by a defined function
     * @param {object} object
     * @param {function} func
     * @return {object}
     */
    public static uksort<T>(object: T, func: (after: T, now: T) => boolean) {
        func = func || ((after: T, now: T) => now > after);
        let ret: any = {}
        let tmp: Array<any> = [];
        for (let key in object) {
            if (object.hasOwnProperty(key)) {
                tmp.push(key);
            }
        }
        for (let i = 0, l = tmp.length; i < l - 1; i++) {
            for (let j = 1; j < l; j++) {
                if (func(tmp[j], tmp[i])) {
                    let k = tmp[i];
                    tmp[i] = tmp[j];
                    tmp[j] = k;
                }
            }
        }
        for (let i = 0, l = tmp.length; i < l; i++) {
            for (let key in object) {
                if (object.hasOwnProperty(key)) {
                    if (tmp[i] === key) {
                        ret[key] = object[key];
                        break;
                    }
                }
            }
        }
        return ret;
    }

    /**
     * Merges two objects
     * @param {object} object1
     * @param {object} object2
     * @return {object}
     */
    public static merge(object1: any, object2: any): any {
        object1 = object1 || {}
        object2 = object2 || {}
        let ret = object1;
        for (let key in object2) {
            if (object2.hasOwnProperty(key)) {
                ret[key] = object2[key];
            }
        }
        return ret;
    }

    /**
     * Slices an object
     * @param {object} object
     * @param {number} offset
     * @param {number} length
     * @return {object}
     */
    public static slice(object: any, offset: number, length: number) {
        let l = this.count(object);
        offset = offset || 0;
        length = length || l;

        let ret: any = {}
        let i = 0, j = 0;
        for (let key in object) {
            if (object.hasOwnProperty(key)) {
                if (i >= offset && j < length) {
                    ret[key] = object[key];
                    ++j;
                }
                ++i;
            }
        }
        return ret;
    }

    public static serialize(value: any): string {
        let ret: string = "";
        if (Array.isArray(value)) {
            ret = "[array][" + value.join(':||:') + "]";
        } else if (typeof value === 'object') {
            ret = "[object][" + JSON.stringify(value) + "]";
        }
        return ret;
    }

    /**
     * Returns the value of a serialized string
     * @param {string} string
     * @return {object|Array}
     */
    public static unserialize(string: string): any {
        let ret: any;
        let regexp = string.match(/^\[(\w+)]\[(.+)]$/);
        if (regexp !== null) {
            let type = regexp[1];
            let serialized = regexp[2];

            if (type === 'array') {
                ret = serialized.split(':||:');
            } else if (type === 'object') {
                ret = JSON.parse(serialized);
            }

            return ret;
        }
        return null;
    }

    /**
     * Checks if the given path exists
     * @param {string} path
     * @return {boolean}
     */
    public static existsSync(path: string) {
        try {
            _f.statSync(path);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Checks if the given path exists and execute the given callback
     * @param {string}   path
     * @param {function} cb
     */
    public static exists(path: string): Promise<boolean> {
        return new Promise<boolean>((executor, reject) => {
            try {
                _f.stat(path, (error: any) => {
                    if (error)
                        executor(false);

                    executor(true);
                });
            } catch (e) {
                executor(false);
            }
        });
    }

    /**
     * Have to throw or call a function with an error ?
     * @param {function} cb
     * @param {Error}    thr
     */
    public static throwOrCall(cb: () => void, thr: Error) {
        cb = cb || null;
        if (null === cb || !(typeof cb === 'function')) {
            throw thr;
        }
        let slice = [].slice;

        let args = slice.call(arguments, 2);
        args.unshift(thr);

        cb.apply(null, args);
    }

    /**
     * Waits for a number of milliseconds before continue execution
     * @param {number} milliSeconds
     * @return {boolean}
     */
    public static waitFor(milliSeconds: number) {
        let d = new Date();
        let startTime = d.getTime();
        let endTime = startTime + milliSeconds;
        let currentTime;
        while (true) {
            d = new Date();
            currentTime = d.getTime();

            if (currentTime >= endTime) {
                break;
            }
        }
        return true;
    }

    /**
     * Add 0 to a number lower than 10
     * @param {number|string} number
     * @return {string}
     */
    public static zeropad(number: number | string): string {
        if (typeof number === "string")
            number = parseInt(number);

        if (number < 10 && number >= 0) {
            number = '0' + number;
        }

        return <string>number;
    }

    /**
     * Asynchronous while
     * @param {function} condition The while condition
     * @param {function} bridge    The function used for recursion
     * @param {function} callback  The callback function
     */
    public static whilst(condition: () => boolean, bridge: (r: any) => void, callback: (error: any) => void) {
        let rewind = (function(c, b, r) {
            return function() {
                try {
                    if (c() === false) {
                        r(null);
                    } else {
                        b(rewind);
                    }
                }
                catch (e) {
                    r(e);
                }
            }
        })(condition, bridge, callback)();
    }

    /**
     * Create a new directory synchronously
     * @param {string} path      The path of the new directory
     * @throws {Error}
     * @return {boolean}
     */
    public static mkdirSync(path: string) {
        path = _p.normalize(path);

        if (!this.existsSync(_p.dirname(path))) {
            this.mkdirSync(_p.dirname(path));
        }

        if (_f.mkdirSync(path, 0x1ff) === false) {
            throw new Error('Cannot create directory "' + path + '"');
        }
        else {
            _f.chmodSync(path, 0x1ff);
            return true;
        }
    }

    /**
     * Create a new directory asynchronously
     * @param {string}   path      The path of the new directory
     * @param {function} callback  The callback
     * @throws {Error}
     * @return {boolean}
     */
    public static mkdir(path: string, callback: (error: any) => void) {
        path = _p.normalize(path);
        callback = callback || function() { }

        Util.exists(path)
            .then(((exists: boolean) => {
                if (!exists) {
                    Util.mkdir(_p.dirname(path), callback);
                }

                _f.mkdir(path, 0x1ff, function(error: any) {
                    if (error) {
                        callback(error);
                    }
                    _f.chmod(path, 0x1ff, function(error: any) {
                        if (error) {
                            callback(error);
                        }
                        callback(null);
                    });
                })
            }).bind(this));
    }

    /**
     * Checks if a value is set, not null, and not undefined.
     * @param {any} value The value to check.
     * @return {boolean}
     */
    public static isset(value: any): boolean {
        return value && value !== null && value !== undefined;
    }

    /**
     * Create a path from parts.
     * @param parts
     */
    public static makePath(...parts: string[]): string {
        return _p.join(parts);
    }

    /**
     * Writes a text into a file.
     * @param {string} path The path to the file to write
     * @param {string} content The content of the file
     */
    public static writeTextFile(path: string, content: string): boolean {
        if (_f.openSync(path, 'w'))
        {
            _f.chmodSync(path, 0x1ff);
            _f.writeFileSync(path, content);
            return true;
        }

        return false;
    }
}