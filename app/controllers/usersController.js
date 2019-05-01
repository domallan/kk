'use strict';

var User = require('../model/appModel.js');

exports.list_all_users = function(req, res) {
  User.getAllUsers(function(err, user){
    console.log('controller')
    if (err)
      res.send(err);
      console.log('res', user);
    res.send(user);
  });
};

exports.create_a_user = function(req, res) {
  var new_user = new User(req.query);
  //handles null error
  if(!new_user.name){
    res.status(400).send({ error:true, message: 'Please provide user/status' });
  }
  else{
    User.createUser(new_user, function(err, user) {
      if (err)
        res.send(err);
      res.json(user);
    });
  }
};

exports.read_a_user = function(req, res) {
  User.getUserById(req.params.user_id, function(err, user) {
    if (err)
      res.send(err);
    res.json(user);
  });
};

exports.update_a_user = function(req, res) {
  User.updateById(req.params.user_id, new User(req.query), function(err, user) {
    if (err)
      res.send(err);
    res.json(user);
  });
};

exports.delete_a_user = function(req, res) {
  User.remove( req.params.user_id, function(err, user) {
    if (err)
      res.send(err);
    res.json({ message: 'User successfully deleted' });
  });
};
