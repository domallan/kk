const DB = require('./db');
const express = require('express');

const hostname = '127.0.0.1';
const port = process.env.PORT || 3000;

app = express();
app.listen(port);
console.log('kk app started on port: ' + port);

var routes = require('./app/routes/approutes'); //importing route
routes(app);
