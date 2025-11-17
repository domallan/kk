const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

var conn_file = './dbconn.json';
var example_file = './dbconn.json.example';

var connection = function(conn_file){
  // Check if dbconn.json exists, if not try to create from example
  if (!fs.existsSync(conn_file)) {
    if (fs.existsSync(example_file)) {
      console.log('dbconn.json not found. Creating from dbconn.json.example...');
      fs.copyFileSync(example_file, conn_file);
      console.log('✓ Created dbconn.json from example file');
    } else {
      throw new Error(
        `Database configuration file '${conn_file}' not found.\n` +
        `Please create ${conn_file} with your database credentials.\n` +
        `You can copy ${example_file} as a template:\n` +
        `  cp ${example_file} ${conn_file}`
      );
    }
  }
  
  var connection_settings = JSON.parse(fs.readFileSync(conn_file));
  this.conn = new Pool({
    host: connection_settings.host,
    port: connection_settings.port || 5432,
    database: connection_settings.database,
    user: connection_settings.user,
    password: connection_settings.password,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
}

module.exports = connection;
