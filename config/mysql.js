// config/mysql.js
var db = require('./database');
var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : db.connection.host,
  user     : db.connection.user,
  password : db.connection.password,
  database : db.database,
  multipleStatements: true
});
module.exports = connection;