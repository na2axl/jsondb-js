var _a = require('assert');
var _p = require('path');
var _f = require('fs');
var JSONDB = require('../src/JSONDB');

var TestClass = function () {
    this.id = null;
};

var existsSync = function(path){
    try {
        _f.statSync(path);
        return true;
    } catch (e){
        return false;
    }
};

var jdb = new JSONDB();
var database = jdb.createServer('__npm_test_server', '__npm', '', true);
database
    .createDatabase('__npm_test_database')
    .setDatabase('__npm_test_database')
    .createTable('__npm_test_table_npk', {'php' : {'type' : 'string'}, 'unit' : {'type' : 'int'}})
    .createTable('__npm_test_table_pk', {'id' : {'auto_increment' : true}})
    .disconnect();

_a.ok(existsSync(_p.dirname(__dirname) + '/servers/__npm_test_server/__npm_test_database/__npm_test_table_npk.json'), 'JSONDB did not create the table __npm_test_table_npk');
_a.ok(existsSync(_p.dirname(__dirname) + '/servers/__npm_test_server/__npm_test_database/__npm_test_table_pk.json'), 'JSONDB did not create the table __npm_test_table_pk');

database = jdb.connect('__npm_test_server', '__npm', '', '__npm_test_database');
database.query('__npm_test_table_npk.insert(\'hello\', 0)');
database.query('__npm_test_table_npk.update(php, unit).with(\'world\', 1)');
database.query('__npm_test_table_npk.replace(\'nice\', 2)');
database.query('__npm_test_table_npk.select(php, unit)');
database.query('__npm_test_table_npk.delete()');
database.query('__npm_test_table_npk.truncate()');
database.query('__npm_test_table_pk.insert(null).and(null).and(null)');
database.query('__npm_test_table_pk.select(*)').fetch(JSONDB.FETCH_CLASS, TestClass);

var query = database.prepare('__npm_test_table_pk.insert(:a).and(:b).and(:c)');
query.bindValue(':a', 4, JSONDB.PARAM_INT);
query.bindValue(':b', 5, JSONDB.PARAM_INT);
query.bindValue(':c', 6, JSONDB.PARAM_INT);
query.execute();