'use strict';

var User = require('../model/appModel.js');

exports.list_all_users = function(req, res) {
  User.getAllUsers(function(err, users){
    if (err)
      res.status(500).send({ error: true, message: err.message || 'Error fetching users' });
    else
      res.json(users);
  });
};

exports.create_a_user = function(req, res) {
  var new_user = new User(req.body);
  //handles null error
  if(!new_user.name){
    res.status(400).send({ error:true, message: 'Please provide user name' });
  }
  else{
    User.createUser(new_user, function(err, userId) {
      if (err)
        res.status(500).send({ error: true, message: err.message || 'Error creating user' });
      else {
        // If partner_id is set, update the partner to point back to this user
        if (new_user.partner_id) {
          User.getUserById(new_user.partner_id, function(err, partner) {
            if (err || !partner || !partner[0]) {
              console.log('Warning: Could not fetch partner to update relationship:', err);
              return res.json({ success: true, user_id: userId });
            }
            
            const partnerData = new User({
              name: partner[0].name,
              partner_id: userId
            });
            
            User.updateById(new_user.partner_id, partnerData, function(err, result) {
              // Ignore errors in partner update, just log them
              if (err) {
                console.log('Warning: Could not update partner relationship:', err);
              }
              res.json({ success: true, user_id: userId });
            });
          });
        } else {
          res.json({ success: true, user_id: userId });
        }
      }
    });
  }
};

exports.read_a_user = function(req, res) {
  User.getUserById(req.params.user_id, function(err, user) {
    if (err)
      res.status(500).send({ error: true, message: err.message || 'Error fetching user' });
    else
      res.json(user);
  });
};

exports.update_a_user = function(req, res) {
  const userId = parseInt(req.params.user_id);
  const updated_user = new User(req.body);
  
  // Get current user to check old partner
  User.getUserById(userId, function(err, currentUser) {
    if (err) {
      return res.status(500).send({ error: true, message: err.message || 'Error fetching user' });
    }
    
    const oldPartnerId = currentUser && currentUser[0] ? currentUser[0].partner_id : null;
    const newPartnerId = updated_user.partner_id || null;
    
    // Update the user
    User.updateById(userId, updated_user, function(err, result) {
      if (err) {
        return res.status(500).send({ error: true, message: err.message || 'Error updating user' });
      }
      
      // Handle partner relationship updates
      const updatePromises = [];
      
      // If old partner existed, remove the relationship from their side
      if (oldPartnerId && oldPartnerId !== newPartnerId) {
        updatePromises.push(new Promise((resolve) => {
          User.getUserById(oldPartnerId, function(err, oldPartner) {
            if (!err && oldPartner && oldPartner[0] && oldPartner[0].partner_id === userId) {
              User.updateById(oldPartnerId, { name: oldPartner[0].name, partner_id: null }, function() {
                resolve();
              });
            } else {
              resolve();
            }
          });
        }));
      }
      
      // If new partner is set, update them to point back
      if (newPartnerId && newPartnerId !== oldPartnerId) {
        updatePromises.push(new Promise((resolve) => {
          User.getUserById(newPartnerId, function(err, newPartner) {
            if (!err && newPartner && newPartner[0]) {
              User.updateById(newPartnerId, { name: newPartner[0].name, partner_id: userId }, function() {
                resolve();
              });
            } else {
              resolve();
            }
          });
        }));
      }
      
      // Wait for all partner updates to complete
      Promise.all(updatePromises).then(() => {
        res.json({ success: true, message: 'User updated successfully' });
      });
    });
  });
};

exports.delete_a_user = function(req, res) {
  const userId = parseInt(req.params.user_id);
  
  // Get user to check for partner before deleting
  User.getUserById(userId, function(err, user) {
    if (err) {
      return res.status(500).send({ error: true, message: err.message || 'Error fetching user' });
    }
    
    const partnerId = user && user[0] ? user[0].partner_id : null;
    
    // Delete the user
    User.remove(userId, function(err, result) {
      if (err) {
        return res.status(500).send({ error: true, message: err.message || 'Error deleting user' });
      }
      
      // If user had a partner, remove the relationship from partner's side
      if (partnerId) {
        User.getUserById(partnerId, function(err, partner) {
          if (!err && partner && partner[0] && partner[0].partner_id === userId) {
            const partnerData = new User({
              name: partner[0].name,
              partner_id: null
            });
            User.updateById(partnerId, partnerData, function() {
              // Ignore errors, just continue
            });
          }
        });
      }
      
      res.json({ success: true, message: 'User successfully deleted' });
    });
  });
};
