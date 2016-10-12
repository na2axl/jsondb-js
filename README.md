# JSONDB
Manage local databases with JSON files and JSONDB Query Language (JQL)

[![MIT License](https://img.shields.io/badge/license-GPLv3-blue.svg)](https://github.com/na2axl/jsondb-js/blob/master/LICENSE)


## What's that ?
JSONDB is a database manager using JSON files and a custom query
language named **JQL** (**J**SONDB **Q**uery **L**anguage).

## Features
* Database management with servers, databases and tables
* Secure connections to servers with username and password
* Sync and async operations
* Easy custom query language
* Supported JQL queries:
    * select()
    * insert()
    * replace()
    * delete()
    * update()
    * truncate()
    * count()

## Getting Started
_Full API and documentation will be soon available on the JSONDB website..._

### Install using npm
JSONDB can be installed through npm:
```sh
$ npm install jsondb-js
```

### Instantiate JSONDB
```javascript
var JSONDB = require("jsondb-js");
var jdb = new JSONDB();
```

### Create a server
If you don't have created a server yet, then:
```javascript
// Sync
jdb.createServer('server_name', 'username', 'password', connect);

// Async
jdb.async.createServer('server_name', 'username', 'password', function (error) {
    if (error) {
        throw error;
    }
});
```
It's useful to check if the destination folder doesn't exist before create a server to avoid errors.
```javascript
// Sync
if (!jdb.serverExists('server_name')) {
    // Then... create a server
}

// Async
jdb.async.serverExists('server_name', function(exists) {
    if (!exists) {
        // Then... create a server
    }
});
```

### Connect to a server
Once instantiated, you have to connect to a server before send queries.
```javascript
// Sync
var db = jdb.connect('server_name', 'username', 'password', 'database_name');
// or...
var db = jdb.connect('server_name', 'username', 'password');

// Async
jdb.async.connect('server_name', 'user_name', 'password', 'database_name', function (error, db) {
    if (error) {
        throw error;
    }
    // db is now a server connection...
});
// or...
jdb.async.connect('server_name', 'user_name', 'password', function (error, db) {
    if (error) {
        throw error;
    }
    // db is now a server connection...
});
```
* The `server_name` is the name of the folder which represents a server (a folder which contains databases). This folder have to be created with `jdb.createServer()`
* The `username` and the `password` are the information used to connect to the server. These information are the same used when creating the server
* The `database_name` is the name of the database to use with current connection. This parameter is optional and can be set manually later.

### Create a database
After connection to a server, you can create a database:
```javascript
// Sync
db.createDatabase('database_name');

// Async
db.async.createDatabase('database_name', function(error) {
    if (error) {
        throw error;
    }
});
```
You can also check if the database exist before the creation.
```javascript
// Sync
if (!db.databaseExists('database_name')) {
    // Then... create a database
}

// Async
db.async.databaseExists('database_name', function (exists) {
    if (!exists) {
        // Then... create a database
    }
});
```

### Use a database
The database to use can be set using the `jdb.connect()` method, or manually using `jdb.setDatabase()` method after a connection to a server:
```javascript
db.setDatabase('database_name');
```

### Create a table
Once JSONDB is properly connected to a server and use a database, you can create a table in this database:
```javascript
// Sync
db.createTable('table_name', prototype);

// Async
db.async.createTable('table_name', prototype, function(error) {
    if (error) {
        throw error;
    }
});
```
The `prototype` is an object of `column_name`: `column_properties` pairs.

#### Column properties
There is a list of currently supported column properties:
* `type`: Defines the type of values that the column accepts. Supported types are:
    * `int`, `integer`, `number`
    * `decimal`, `float`
    * `string`
    * `char`
    * `bool`, `boolean`
    * `array`
* `default`: Sets the default value of column
* `max_length`: Used by some type:
    * When used with `float`, the number of decimals is reduced to his value
    * When used with `string`, the number of characters is reduced to his value
    (starting with the first character)
* `auto_increment`: Defines if a column will be an auto incremented column. When used, the column is automatically set to UNIQUE KEY
* `primary_key`: Defines if a column is a PRIMARY KEY
* `unique_key`: Defines if a column is an UNIQUE KEY

### Send a query
JSONDB can send both direct and prepared queries.

#### Direct queries
```javascript
// ---
// Sync
// ---
var results = db.query('my_query_string');

//// Specially for select() and count() queries
// You can change the fecth mode
results.setFetchMode(JSONDB.FETCH_ARRAY);
// or...
results.setFetchMode(JSONDB.FETCH_CLASS, MyCustomClass);
// Explore results using a while loop (sync)
while (result = results.fetch()) {
    // Do stuff with result...
}
// Explore results using recursion (async)
results.async.fetch(function(error, result, next) {
    if (error) {
        throw error;
    }
    // Stop the resursion when there is no data
    if (result !== false) {
        // Do stuff with result..
        next(); // Important to call the same callback function with the next data    
    }
});

// -----

// ---
// Async
// ---
db.async.query('my_query_string', function(error, results) {
    if (error) {
        throw error;
    }
    //// Specially for select() and count() queries
    // You can change the fecth mode
    results.setFetchMode(JSONDB.FETCH_ARRAY);
    // or...
    results.setFetchMode(JSONDB.FETCH_CLASS, MyCustomClass);
    // Explore results using a while loop (sync)
    while (result = results.fetch()) {
        // Do stuff with result...
    }
    // Explore results using recursion (async)
    results.async.fetch(function(error, result, next) {
        if (error) {
            throw error;
        }
        // Stop the resursion when there is no data
        if (result !== false) {
            // Do stuff with result..
            next(); // Important to call the same callback function with the next data    
        }
    });
});
```

#### Prepared queries
```javascript
// ---
// Sync
// ---
var query = db.prepare('my_prepared_query');
query.bindValue(':key1', val1, JSONDB.PARAM_INT);
query.bindValue(':key2', val2, JSONDB.PARAM_STRING);
query.bindValue(':key3', val3, JSONDB.PARAM_BOOL);
query.bindValue(':key4', val4, JSONDB.PARAM_NULL);
query.bindValue(':key5', val5, JSONDB.PARAM_ARRAY);
// Execute query synchronously...
var results = query.execute();
// Execute query asynchronously...`
query.async.execute(function(error, results) {
    if (error) {
        throw error;
    }
    // Do stuff with results...
});

// -----

// ---
// Async
// ---
jdb.async.prepare('my_prepared_query', function(error, query) {
    if (error) {
        throw error;
    }
    query.bindValue(':key1', val1, JSONDB.PARAM_INT);
    query.bindValue(':key2', val2, JSONDB.PARAM_STRING);
    query.bindValue(':key3', val3, JSONDB.PARAM_BOOL);
    query.bindValue(':key4', val4, JSONDB.PARAM_NULL);
    query.bindValue(':key5', val5, JSONDB.PARAM_ARRAY);
    // Execute query synchronously...
    var results = query.execute();
    // Execute query asynchronously...`
    query.async.execute(function(error, results) {
        if (error) {
            throw error;
        }
        // Do stuff with results...
    });
});
```

### JQL (JSONDB Query Language)
The JQL is the query language used in JSONDB. It's a very easy language based on _extensions_.
A JQL query is in this form:
```javascript
db.query('table_name.query(parameters,...).extension1().extension2()...');
```

#### Query Examples

##### select()
Select all from table `users` where `username` = `id` and `password` = `pass` or where `mail` = `id` and `password` = `pass`
```javascript
var id = JSONDB.quote(form_data.id);
var pass = JSONDB.quote(form_data.password);
db.query("users.select(*).where(username=" + id + ",password=" + pass + ").where(mail=" + id + ",password=" + pass + ")");
```

Select `username` and `mail` from table `users` where `activated` = `true`, order the results by `username` with `desc`endant method, limit the results to the `10` users after the `5`th.
```javascript
db.query("users.select(username,mail).where(activated=true).order(username,desc).limit(5,10)");
```

##### insert()
Insert a new user in table `users`
```javascript
var username = JSONDB.quote(form_data.username);
var pass = JSONDB.quote(form_data.password);
var mail = JSONDB.quote(form_data.mail);
db.query("users.insert(" + username + "," + pass + "," + mail + ").in(username,password,mail)");
```
Multiple insertion...
```javascript
db.query("users.insert(" + username1 + "," + pass1 + "," + mail1 + ").and(" + username2 + "," + pass2 + "," + mail2 + ").and(" + username3 + "," + pass3 + "," + mail3 + ").in(username,password,mail)");
```

##### replace()
Replace information of the first user
```javascript
db.query("users.replace(" + username + "," + pass + "," + mail + ").in(username,password,mail)");
```
Multiple replacement...
```javascript
db.query("users.replace(" + username1 + "," + pass1 + "," + mail1 + ").and(" + username2 + "," + pass2 + "," + mail2 + ").and(" + username3 + "," + pass3 + "," + mail3 + ").in(username,password,mail)");
```

##### delete()
Delete all users
```javascript
db.query("users.delete()");
```
Delete all banished users
```javascript
db.query("users.delete().where(banished = true)");
```
Delete a specific user
```javascript
db.query("users.delete().where(username = " + username + ", mail = " + mail + ")");
```

##### update()
Activate all users
```javascript
db.query("users.update(activated).with(true)");
```
Update my information ;-)
```javascript
db.query("users.update(mail, password, activated, banished).with(" + mail + ", " + username + ", true, false).where(username = 'na2axl')");
```

##### truncate()
Reset the table `users`
```javascript
db.query("users.truncate()");
```

##### count()
Count all banished users
```javascript
db.query("users.count(*).as(banished_nb).where(banished = true)");
```
Count all users and group by `activated`
```javascript
db.query("users.count(*).as(users_nb).group(activated)");
```

#### Query functions

##### sha1()
Returns the sha1 of a text. **Exemple**: Update an old password by a new one:
```javascript
var old_password = your_sha1_encrypt_function(form_data.old);
var new_password = form_data.new;
var query = db.prepare("users.insert(sha1(:new)).in(password).where(sha1(password) = :old)");
query.bindValue(':new', new_password);
query.bindValue(':old', old_password);
query.execute();
```

##### md5()
Returns the md5 of a text. **Exemple**:
```javascript
var result = db.query("users.select(md5(username)).as(username_hash).where(username = 'na2axl')");
```

##### time()
Returns the timestamp.

##### now()
Returns the date of today in the form `year-month-day h:m:s`. You can change the form of the date by using identifiers as parameters:
| Identifier | Value |
|------------|-------|
| %a | The day in 3 letters (Mon) |
| %A | The full day (Monday) |
| %d | The day of the month with a leading zero (06) |
| %m | The month of the year with a leading zero (12) |
| %e | The month of the wear without a leading zero |
| %w | The day of the week without a leading zero |
| %W | The day of the week with a leading zero |
| %b | The month in 3 letters (Jan) |
| %B | The full month (January) |
| %y | The last two digits of the year (16) |
| %Y | The full year (2016) |
| %H | The hour with a leading 0 (09) |
| %k | The hour without a leading 0 (9) |
| %M | The minutes |
| %S | The seconds |
**Exemple**:
```javascript
db.query("users.update(last_acitity).with(now('%d/%m/%Y %H:%M:%S').where(username = 'na2axl'))");
```

##### lowercase()
Returns the lower case version of a text.

##### uppercase()
Returns the upper case version of a text.

##### ucfirst()
Upper case the first letter and lower case all others in a text.

##### strlen()
Returns the number of characters in a text.

#### Supported JQL operators

* `a = b` : `a` equal to `b`
* `a != b` : `a` different than `b`
* `a <> b` : `a` different than `b`
* `a >= b` : `a` superior or equal to `b`
* `a <= b` : `a` inferior or equal to `b`
* `a < b` : `a` inferior to `b`
* `a > b` : `a` superior to `b`
* `a %= b` : `a % b === 0`
* `a %! b` : `a % b !== 0`


## Full example
### Sync version
```javascript
var JSONDB = require("jsondb-js");

var jdb = new JSONDB();

if (!jdb.serverExists('test')) {
    jdb.createServer('test', 'root', '');
}

var db = jdb.connect('test', 'root', '');

if (!db.databaseExists('test_database')) {
    db.createDatabase('test_database');
}

db.setDatabase('test_database');

if (!db.tableExists('users')) {
    db.createTable('users', { 'id': {'type': 'int', 'auto_increment': true, 'primary_key': true},
                              'name': {'type': 'string', 'max_length': 30, 'not_null': true},
                              'last_name': {'type': 'string', 'max_length': 30, 'not_null': true},
                              'username': {'type': 'string', 'max_length': 15, 'unique_key': true},
                              'mail': {'type': 'string', 'unique_key': true},
                              'password': {'type': 'string', 'not_null': true},
                              'website': {'type': 'string'},
                              'activated': {'type': 'bool', 'default': false},
                              'banished': {'type': 'bool', 'default': false} });
}

// A prepared query
var query = db.prepare("users.insert(:name, :sname, :username, :mail, sha1(:pass)).in(name, last_name, username, mail, password)");
query.bindValue(':name', 'Nana', JSONDB.PARAM_STRING);
query.bindValue(':sname', 'Axel', JSONDB.PARAM_STRING);
query.bindValue(':username', 'na2axl', JSONDB.PARAM_STRING);
query.bindValue(':mail', 'ax.lnana@outlook.com', JSONDB.PARAM_STRING);
query.bindValue(':pass', '00%a_ComPLEx-PassWord%00', JSONDB.PARAM_STRING);
query.execute();

// After some insertions...

// Select all users
var results = db.query('users.select(id, name, last_name, username)');

// Fetch with class mapping
var User = function () {};
User.prototype.id = 0;
User.prototype.name = '';
User.prototype.last_name = '';
User.prototype.username = '';
User.prototype.getInfo = function () {
    return "The user with ID: " + this.id + "has the name: " + this.name + " " + this.last_name + " and the username " + this.username + ".";
};

while (result = results.fetch(JSONDB.FETCH_CLASS, User)) {
    console.log(result.getInfo());
}
```

### Async version
```javascript
var JSONDB = require("jsondb-js");

var jdb = new JSONDB();

// Class used for mapping
var User = function () {};
User.prototype.id = 0;
User.prototype.name = '';
User.prototype.last_name = '';
User.prototype.username = '';
User.prototype.getInfo = function () {
    return "The user with ID: " + this.id + " has the name: " + this.name + " " + this.last_name + " and the username " + this.username + ".";
};

jdb.async.serverExists('test', function (exists) {
    if (!exists) {
        jdb.createServer('test', 'root', '');
    }

    jdb.async.connect('test', 'root', '', function (error, db) {
        if (error) {
            throw error;
        }

        db.async.databaseExists('test_database', function (exists) {
            if (!exists) {
                db.createDatabase('test_database');
            }
            db.setDatabase('test_database');

            db.async.tableExists('users', function (exists) {
                if (!exists) {
                    db.createTable('users', { 'id': {'type': 'int', 'auto_increment': true, 'primary_key': true},
                        'name': {'type': 'string', 'max_length': 30, 'not_null': true},
                        'last_name': {'type': 'string', 'max_length': 30, 'not_null': true},
                        'username': {'type': 'string', 'max_length': 15, 'unique_key': true},
                        'mail': {'type': 'string', 'unique_key': true},
                        'password': {'type': 'string', 'not_null': true},
                        'website': {'type': 'string'},
                        'activated': {'type': 'bool', 'default': false},
                        'banished': {'type': 'bool', 'default': false} });
                }

                // A prepared query
                db.async.prepare("users.insert(:name, :sname, :username, :mail, sha1(:pass)).in(name, last_name, username, mail, password)", function (error, query) {
                    if (error) {
                        throw error;
                    }
                    query.bindValue(':name', 'Nana', JSONDB.PARAM_STRING);
                    query.bindValue(':sname', 'Axel', JSONDB.PARAM_STRING);
                    query.bindValue(':username', 'na2axl', JSONDB.PARAM_STRING);
                    query.bindValue(':mail', 'ax.lnana@outlook.com', JSONDB.PARAM_STRING);
                    query.bindValue(':pass', '00%a_ComPLEx-PassWord%00', JSONDB.PARAM_STRING);
                    query.async.execute(function (error , result) {
                        if (error) {
                            throw error;
                        }
                        // Is an insert() query, so result is a boolean...

                        // After some insertions...

                        // Select all users
                        db.async.query('users.select(id, name, last_name, username)', function (error, results) {
                            if (error) {
                                throw error;
                            }
                            // Is an select() query, so results is a QueryResult object...
                            results.async.fetch(JSONDB.FETCH_CLASS, User, function (error, current, next) {
                                if (error) {
                                    throw error;
                                }
                                if (current !== false) {
                                    console.log(current.getInfo());
                                    next();
                                }
                            });
                        });
                    });
                });
            });
        });
    });
});
```

After the execution of (one of) these scripts, the table **users** will be a .json file which will contain:
```json
{
    "prototype": ["#rowid","id","name","last_name","username","mail","password","website","activated","banished"],
    "properties": {
        "last_insert_id":1,
        "last_valid_row_id":1,
        "last_link_id":1,
        "primary_keys":["id"],
        "unique_keys":["id","username","mail"],
        "id": {
            "type":"int",
            "auto_increment":true,
            "primary_key":true,
            "unique_key":true,
            "not_null":true
        },
        "name": {
            "type":"string",
            "max_length":30,
            "not_null":true
        },
        "last_name": {
            "type":"string",
            "max_length":30,
            "not_null":true
        },
        "username": {
            "type":"string",
            "max_length":15,
            "unique_key":true,
            "not_null":true
        },
        "mail": {
            "type":"string",
            "unique_key":true,
            "not_null":true
        },
        "password": {
            "type":"string",
            "not_null":true
        },
        "website": {
            "type":"string"
        },
        "activated": {
            "type":"bool",
            "default":false
        },
        "banished": {
            "type":"bool",
            "default":false
        }
    },
    "data": {
        "#1": {
            "#rowid":1,
            "id":1,
            "name":"Nana",
            "last_name":"Axel",
            "username":"na2axl",
            "mail":"ax.lnana@outlook.com",
            "password":"589d3c90f3f75752673ab0ccb2690832f2e15610",
            "website":null,
            "activated":false,
            "banished":false
        }
    }
}
```

## Contribution
Found a bug? Have a feature request? Want to contribute to this project? Please, feel free to create
a [new issue](https://github.com/na2axl/jsondb-js/issues/new "Open a new issue") on GitHub, or fork this code, hack it,
and make a pull request !

## Authors
* **Axel Nana**: <ax.lnana@outlook.com> - [https://tutorialcenters.tk](https://tutorialcenters.tk "Write your tutorial !")

## Contributors
No one... maybe you ! 

## Copyright
(c) 2016 Centers Technologies. Licensed under GPL-3.0 ([read license](https://github.com/na2axl/jsondb-js/blob/master/LICENSE)).
