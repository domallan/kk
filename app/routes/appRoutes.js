'use strict';
module.exports = function(app) {
  var kk_users = require('../controllers/usersController');
  var kk_assignments = require('../controllers/assignmentsController');
  var kk_sms = require('../controllers/smsController');

  // User Routes
  app.route('/users')
    .get(kk_users.list_all_users)
    .post(kk_users.create_a_user);

  app.route('/users/:user_id')
    .get(kk_users.read_a_user)
    .put(kk_users.update_a_user)
    .delete(kk_users.delete_a_user);

  // Assignment Routes
  app.route('/assignments/:year')
    .get(kk_assignments.getAssignments)
    .delete(kk_assignments.deleteAssignments);

  app.route('/assignments/:year/user/:user_id')
    .get(kk_assignments.getUserAssignment);

  app.route('/assignments/generate')
    .post(kk_assignments.generateAssignments);

  // SMS Routes
  app.route('/sms/send')
    .post(kk_sms.sendAssignmentSMS);

  app.route('/sms/send-all')
    .post(kk_sms.sendAllAssignmentsSMS);
};
