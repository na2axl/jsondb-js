# JSONDB
Manage local databases with JSON files and JSONDB Query Language (JQL)

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/na2axl/jsondb-js/blob/master/LICENSE)


## What's that ?
JSONDB is a database manager using JSON files and a custom query
language named **JQL** (**J**SONDB **Q**uery **L**anguage).

## Features
* Database management with servers, databases and tables
* Secure connections to servers with username and password
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

### Install using composer
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
jdb.createServer('server_name, 'username', 'password');
```
It's useful to check if the destination folder doesn't exist before create a server
to avoid errors.

### Connect to a server
Once instantiated, you have to connect to a server before send queries.
```javascript
var db = jdb.connect('server_name', 'username', 'password', 'database_name');
```
* The `server_name` is the name of the folder which represents a server
(a folder which contains databases). This folder have to be created with `jdb.createServer()`
* The `username` and the `password` are the information used to connect
 to the server. These information are the same used when creating the server
* The `database_name` is the name of the database to use with current connection.
This parameter is optional and can be set manually later.

### Create a database
After connection to a server, you can create a database:
```javascript
db.createDatabase('database_name');
```

### Use a database
The database to use can be set using the `jdb.connect()` method, or manually
using `jdb.setDatabase()` method after a connection to a database:
```javascript
db.setDatabase('database_name');
```

### Create a table
Once JSONDB is properly connected to a server and use a database, you can create
a table in this database:
```javascript
db.createTable('table_name', 'prototype');
```
The `prototype` is an array of `column_name`: `column_propeties` pairs.

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
* `auto_increment`: Defines if a column will be an auto incremented column. When
used, the column is automatically set to UNIQUE KEY
* `primary_key`: Defines if a column is a PRIMARY KEY
* `unique_key`: Defines if a column is an UNIQUE KEY

### Send a query
JSONDB can send both direct and prepared queries.

#### Direct queries
```javascript
var results = db.query('my_query_string');

//// Specially for select() queries
// You can change the fecth mode
results.setFetchMode(JSONDB.FETCH_ARRAY);
// or...
results.setFetchMode(JSONDB.FETCH_CLASS, MyCustomClass);
// Explore results using a while loop
while (result = results.fetch()) {
    // Do stuff...
}
```

#### Prepared queries
```javascript
var query = db.prepare('my_prepared_query');
query.bindValue(':key1', val1, JSONDB.PARAM_INT);
query.bindValue(':key2', val2, JSONDB.PARAM_STRING);
query.bindValue(':key3', val3, JSONDB.PARAM_BOOL);
query.bindValue(':key4', val4, JSONDB.PARAM_NULL);
var results = query.execute();

//// Specially for select() queries
// You can change the fecth mode
results.setFetchMode(JSONDB.FETCH_ARRAY);
// or...
results.setFetchMode(JSONDB.FETCH_CLASS, MyCustomClass);
// Explore results using a while loop
while (result = results.fetch()) {
    // Do stuff...
}
```

### JQL (JSONDB Query Language)
The JQL is the query language used in JSONDB. It's a very easy language based on _extensions_.
A JQL query is in this form:
```javascript
db.query('table_name.query(parameters,...).extension1().extension2()...');
```

#### Query Examples

##### select()
Select all from table `users` where `pseudo` = `id` and `password` = `pass` or where `mail` = `id` and `password` = `pass`
```javascript
var id = JSONDB.quote(form_data.id);
var pass = JSONDB.quote(form_data.password);
db.query("users.select(*).where(pseudo=" + id + ",password=" + pass + ").where(mail=" + id + ",password=" + pass + ")");
```

Select `pseudo` and `mail` from table `users` where `activated` = `true`, order the results by `pseudo` with `desc`endant method, limit the results to the `10` users after the `5`th.
```javascript
db.query("users.select(pseudo,mail).where(activated=true).order(pseudo,desc).limit(5,10)");
```

##### insert()
Insert a new user in table `users`
```javascript
var pseudo = JSONDB.quote(form_data.pseudo);
var pass = JSONDB.quote(form_data.password);
var mail = JSONDB.quote(form_data.mail);
db.query("users.insert(" + pseudo + "," + pass + "," + mail + ").in(pseudo,password,mail)");
```
Multiple insertion...
```javascript
db.query("users.insert(" + pseudo1 + "," + pass1 + "," + mail1 + ").and(" + pseudo2 + "," + pass2 + "," + mail2 + ").and(" + pseudo3 + "," + pass3 + "," + mail3 + ").in(pseudo,password,mail)");
```

##### replace()
Replace information of the first user
```javascript
db.query("users.replace(" + pseudo + "," + pass + "," + mail + ").in(pseudo,password,mail)");
```
Multiple replacement...
```javascript
$db.query("users.replace(" + pseudo1 + "," + pass1 + "," + mail1 + ").and(" + pseudo2 + "," + pass2 + "," + mail2 + ").and(" + pseudo3 + "," + pass3 + "," + mail3 + ").in(pseudo,password,mail)");
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
db.query("users.delete().where(pseudo = " + pseudo + ", mail = " + mail + ")");
```

##### update()
Activate all users
```javascript
db.query("users.update(activated).with(true)");
```
Update my information ;-)
```javascript
db.query("users.update(mail, password, activated, banished).with(" + mail + ", " + pseudo + ", true, false).where(pseudo = 'na2axl')");
```

##### truncate()
Reset the table `users`
```javascript
$db.query("users.truncate()");
```

##### count()
Count all banished users
```javascript
$db.query("users.count(*).as(banished_nb).where(banished = true)");
```
Count all users and group by `activated`
```javascript
$db.query("users.count(*).as(users_nb).group(activated)");
```

## Full example
```javascript
var JSONDB = require("jsondb-js");

var jdb = new JSONDB();

jdb.createServer('test', 'root', '');

var db = jdb.connect('test', 'root', '')
            .createDatabase('test_database')
            .setDatabase('test_database'); // Yes, is chainable ! ;-)

db.createTable('users', { 'id': {'type': 'int', 'auto_increment': true},
                          'name': {'type': 'string', 'max_length': 30, 'not_null': true},
                          'surname': {'type': 'string', 'max_length': 30, 'not_null': true},
                          'pseudo': {'type': 'string', 'max_length': 15, 'unique_key': true},
                          'mail': {'type': 'string', 'unique_key': true},
                          'password': {'type': 'string', 'not_null': true},
                          'website': {'type': 'string'},
                          'activated': {'type': 'bool', 'default': false},
                          'banished': {'type': 'bool', 'default': false} });

// A prepared query
var query = db.prepare('users.insert(:name, :sname, :pseudo, :mail, :pass).in(name, surname, pseudo, mail, password)');
query.bindValue(':name', 'Nana', JSONDB.PARAM_STRING);
query.bindValue(':sname', 'Axel', JSONDB.PARAM_STRING);
query.bindValue(':pseudo', 'na2axl', JSONDB.PARAM_STRING);
query.bindValue(':mail', 'ax.lnana@outlook.com', JSONDB.PARAM_STRING);
query.bindValue(':pass', '00%a_ComPLEx-PassWord%00', JSONDB.PARAM_STRING);
query.execute();

// After some insertions...

// Select all users
var results = db.query('users.select(id, name, surname, pseudo)');

// Fetch with class mapping
var User = function () {};
User.prototype.id = 0;
User.prototype.name = '';
User.prototype.surname = '';
User.prototype.pseudo = '';
User.prototype.getInfo = function () {
    return "The user with ID: " + this.id + "has the name: " + this.name + " " + this.surname + " and the username " + this.pseudo + ".";
};

while (result = $results.fetch(JSONDB.FETCH_CLASS, User)) {
    console.log(result.getInfo());
}
```

## Authors
* **Axel Nana**: <ax.lnana@outlook.com> - [https://tutorialcenters.tk](https://tutorialcenters.tk)

## Copyright
(c) 2016 Centers Technologies. Licensed under MIT ([read license](https://github.com/na2axl/jsondb-js/blob/master/LICENSE)).
