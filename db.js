const fs = require('fs');
const mysql = require('mysql');

var conn_file = './dbconn.json';

var connection = function(conn_file){
  var connection_settings = JSON.parse(fs.readFileSync(conn_file));
  this.conn =  mysql.createConnection(connection_settings);
}

module.exports = connection;
