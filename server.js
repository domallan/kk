require('dotenv').config();
const DB = require('./db');
const express = require('express');
const path = require('path');

const hostname = '127.0.0.1';
const port = process.env.PORT || 3000;

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
var routes = require('./app/routes/appRoutes');
routes(app);

// Start server
app.listen(port, hostname, () => {
  console.log('kk app started on http://' + hostname + ':' + port);
});
