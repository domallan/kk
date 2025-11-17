'use strict';
var Connection = require('../../db');
var conn =  new Connection('./dbconn.json');
var sql = conn.conn;
//User object constructor
var User = function(user){
    this.name = user.name;
    this.partner_id = user.partner_id || null;
    this.phone_number = user.phone_number || null;
    this.created_at = new Date();
};
User.createUser = function createUser(newUser, result) {
        sql.query("INSERT INTO users (name, partner_id, phone_number) VALUES ($1, $2, $3) RETURNING user_id", 
            [newUser.name, newUser.partner_id || null, newUser.phone_number || null], function (err, res) {
                if(err) {
                    console.log("error: ", err);
                    result(err, null);
                }
                else{
                    console.log(res.rows[0].user_id);
                    result(null, res.rows[0].user_id);
                }
            });
};
User.getUserById = function getUser(userId, result) {
        sql.query("SELECT user_id, name, partner_id, phone_number FROM users WHERE user_id = $1", [userId], function (err, res) {
                if(err) {
                    console.log("error: ", err);
                    result(err, null);
                }
                else{
                    result(null, res.rows);
                }
            });
};
User.getAllUsers = function getAllUsers(result) {
        sql.query("SELECT * FROM users ORDER BY user_id", function (err, res) {
                if(err) {
                    console.log("error: ", err);
                    result(err, null);
                }
                else{
                  console.log('users : ', res.rows);
                 result(null, res.rows);
                }
            });
};
User.updateById = function(id, user, result){
  sql.query("UPDATE users SET name = $1, partner_id = $2, phone_number = $3 WHERE user_id = $4", 
      [user.name, user.partner_id || null, user.phone_number || null, id], function (err, res) {
          if(err) {
              console.log("error: ", err);
              result(err, null);
          }
          else{
              result(null, res);
          }
      });
};
User.remove = function(id, result){
     sql.query("DELETE FROM users WHERE user_id = $1", [id], function (err, res) {
                if(err) {
                    console.log("error: ", err);
                    result(err, null);
                }
                else{
                 result(null, res);
                }
            });
};

// Assignment methods
User.createAssignment = function(year, giverId, receiverId, result) {
    sql.query("INSERT INTO assignments (year, giver_id, receiver_id) VALUES ($1, $2, $3) RETURNING assignment_id", 
        [year, giverId, receiverId], function (err, res) {
            if(err) {
                console.log("error: ", err);
                result(err, null);
            } else {
                result(null, res.rows[0].assignment_id);
            }
        });
};

User.getAssignmentsByYear = function(year, result) {
    sql.query(`
        SELECT a.assignment_id, a.year, a.giver_id, a.receiver_id,
               a.sms_sent_at,
               g.name as giver_name, r.name as receiver_name
        FROM assignments a
        JOIN users g ON a.giver_id = g.user_id
        JOIN users r ON a.receiver_id = r.user_id
        WHERE a.year = $1
        ORDER BY g.name
    `, [year], function (err, res) {
        if(err) {
            console.log("error: ", err);
            result(err, null);
        } else {
            result(null, res.rows);
        }
    });
};

User.deleteAssignmentsByYear = function(year, result) {
    sql.query("DELETE FROM assignments WHERE year = $1", [year], function (err, res) {
        if(err) {
            console.log("error: ", err);
            result(err, null);
        } else {
            result(null, res);
        }
    });
};

User.getAssignmentForUser = function(year, userId, result) {
    sql.query(`
        SELECT a.assignment_id, a.year, a.giver_id, a.receiver_id,
               a.sms_sent_at,
               g.name as giver_name, r.name as receiver_name
        FROM assignments a
        JOIN users g ON a.giver_id = g.user_id
        JOIN users r ON a.receiver_id = r.user_id
        WHERE a.year = $1 AND a.giver_id = $2
    `, [year, userId], function (err, res) {
        if(err) {
            console.log("error: ", err);
            result(err, null);
        } else {
            result(null, res.rows);
        }
    });
};

User.markSmsSent = function(year, giverId, result) {
    sql.query("UPDATE assignments SET sms_sent_at = CURRENT_TIMESTAMP WHERE year = $1 AND giver_id = $2", 
        [year, giverId], function (err, res) {
            if(err) {
                console.log("error: ", err);
                result(err, null);
            } else {
                result(null, res);
            }
        });
};

module.exports= User;
