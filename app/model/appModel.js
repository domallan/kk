'use strict';
var Connection = require('../../db');
var conn =  new Connection('./dbconn.json');
var sql = conn.conn;
//User object constructor
var User = function(user){
    this.name = user.name;
    this.created_at = new Date();
};
User.createUser = function createUser(newUser, result) {
        sql.query("INSERT INTO users set ?", newUser, function (err, res) {

                if(err) {
                    console.log("error: ", err);
                    result(err, null);
                }
                else{
                    console.log(res.insertId);
                    result(null, res.insertId);
                }
            });
};
User.getUserById = function getUser(userId, result) {
        sql.query("Select user_id,name from users where user_id = ? ", userId, function (err, res) {
                if(err) {
                    console.log("error: ", err);
                    result(err, null);
                }
                else{
                    result(null, res);
                }
            });
};
User.getAllUsers = function getAllUsers(result) {
        sql.query("Select * from users", function (err, res) {

                if(err) {
                    console.log("error: ", err);
                    result(null, err);
                }
                else{
                  console.log('users : ', res);

                 result(null, res);
                }
            });
};
User.updateById = function(id, user, result){
  sql.query("UPDATE users SET name = ? WHERE user_id = ?", [user.name, id], function (err, res) {
          if(err) {
              console.log("error: ", err);
                result(null, err);
             }
           else{
             result(null, res);
                }
            });
};
User.remove = function(id, result){
     sql.query("DELETE FROM users WHERE user_id = ?", [id], function (err, res) {

                if(err) {
                    console.log("error: ", err);
                    result(null, err);
                }
                else{

                 result(null, res);
                }
            });
};

module.exports= User;
