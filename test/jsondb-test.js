var JSONDB = require('../src/JSONDB');

var TestClass = function () {
    this.id = null;
    this.info = function () {
        return 'My id is ' + this.id;
    }
};

var jdb = new JSONDB();

jdb.async.serverExists('__npm_test_server', function(exists) {
    if (!exists) {
        console.log("Test server doesn't exist... Creating one...");
        jdb.createServer('__npm_test_server', '__npm', '', false);
        console.log("Test server created (synchronously) !")
    }
    console.log('Asynchronous connection to the test server...');
    jdb.async.connect('__npm_test_server', '__npm', '', null, function(er, database) {
        if (er) {
            console.log("Can't connect to the test server...");
            throw er;
        }
        console.log('Successfully connected to the test server !');
        console.log('Creating a new test database');
        database.async.createDatabase('__npm_test_database', function(er) {
            if (er) {
                console.log("Can't create the test database...");
                throw er;
            }

            console.log("Test database created !");
            database.setDatabase('__npm_test_database');

            console.log('Creating a test table (with no primary keys)');
            database.async.createTable('__npm_test_table_npk', {'php' : {'type' : 'string'}, 'unit' : {'type' : 'int'}}, function (err) {
                if (err) {
                    console.log("Can't create the test table (with no primary keys)");
                    throw err;
                }
                console.log('Test table created ! (with no primary keys)');

                console.log('Sync start... Insertion in test table (with no primary keys)');
                var insert = database.query('__npm_test_table_npk.insert(\'hello\', 0)');
                console.log('Sync end for test table (with no primary keys)... Result = ' + insert);

                console.log('Async start... Replacements in test table (with no primary keys)');
                database.async.query('__npm_test_table_npk.replace(\'nice\', 2)', function (err, res) {
                    if (err) {
                        throw err;
                    }
                    console.log('Async end for test table (with no primary keys)... Result = ' + res);
                });
                console.log('Async not ended... But this message will output (normally... is async...)');

                // database.query('__npm_test_table_npk.delete()');

                // database.query('__npm_test_table_npk.truncate()');
            });

            console.log('Creating a test table (with primary keys)');
            database.async.createTable('__npm_test_table_pk', {'id' : {'auto_increment' : true, 'primary_key': true}}, function (err) {
                if (err) {
                    console.log("Can't create the test table (with primary keys)");
                    throw err;
                }
                console.log('Test table created ! (with primary keys)');
                console.log('Sync start... Insertion in test table (with primary keys)');
                var res = database.query('__npm_test_table_pk.insert(null).and(null).and(null)');
                console.log('Sync end for test table (with primary keys)... Result = ' + res);

                console.log('Sync start... Prepared query... Insertion in test table (with primary keys)');
                var query = database.prepare('__npm_test_table_pk.insert(:a).and(:b).and(:c)');
                query.bindValue(':a', 4, JSONDB.PARAM_INT);
                query.bindValue(':b', 5, JSONDB.PARAM_INT);
                query.bindValue(':c', 6, JSONDB.PARAM_INT);
                res = query.execute();
                console.log('Sync end for test table (with primary keys)... Prepared query executed... Result = ' + res);

                console.log('Async start... Selection in test table (with primary keys)');
                database.async.query('__npm_test_table_pk.select(*)', function (er, res) {
                    if (er) {
                        console.log('Async end.. Query execution failed...');
                        throw er;
                    }
                    console.log('Async state: Query successfully executed... Retrieving results...');
                    res.async.fetch(JSONDB.FETCH_CLASS, TestClass, function(er, line, next) {
                        if (er) {
                            console.log('Async end... Can\'t retrieve results...');
                            throw er;
                        }
                        if (line === false) {
                            console.log('Async end... Results successfully retrieved from test query (with primary keys)');
                            return;
                        }
                        console.log(line.info());
                        next();
                    });
                });
            });
        });
    });
});
