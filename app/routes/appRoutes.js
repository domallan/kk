'use strict';
module.exports = function(app) {
  var kk_users = require('../controllers/usersController');

  // User Routes
  app.route('/users')
    .get(kk_users.list_all_users)
    .post(kk_users.create_a_user);

   app.route('/users/:user_id')
    .get(kk_users.read_a_user)
    .put(kk_users.update_a_user)
    .delete(kk_users.delete_a_user);
    };
