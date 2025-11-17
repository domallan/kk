'use strict';

const twilio = require('twilio');
const User = require('../model/appModel.js');

// Initialize Twilio client
let twilioClient = null;

function initTwilio() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
        console.warn('Twilio credentials not found in environment variables');
        return null;
    }

    return twilio(accountSid, authToken);
}

// Send SMS to a single user with their assignment
exports.sendAssignmentSMS = function (req, res) {
    const year = parseInt(req.body.year) || new Date().getFullYear();
    const userId = parseInt(req.body.user_id);

    if (!userId) {
        return res.status(400).send({ error: true, message: 'User ID is required' });
    }

    // Initialize Twilio if not already done
    if (!twilioClient) {
        twilioClient = initTwilio();
        if (!twilioClient) {
            return res.status(500).send({
                error: true,
                message: 'Twilio not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables.'
            });
        }
    }

    // Get user and their assignment
    User.getUserById(userId, function (err, users) {
        if (err || !users || users.length === 0) {
            return res.status(404).send({ error: true, message: 'User not found' });
        }

        const user = users[0];

        if (!user.phone_number) {
            return res.status(400).send({ error: true, message: 'User does not have a phone number' });
        }

        // Get assignment
        User.getAssignmentForUser(year, userId, function (err, assignments) {
            if (err) {
                return res.status(500).send({ error: true, message: 'Error fetching assignment' });
            }

            if (!assignments || assignments.length === 0) {
                return res.status(404).send({ error: true, message: `No assignment found for ${year}` });
            }

            const assignment = assignments[0];
            const message = `Hi ${user.name}! 🎄 Your Kris Kringle assignment for ${year}: You are giving a gift to ${assignment.receiver_name}! Keep it secret! 🎁`;

            // Send SMS
            twilioClient.messages
                .create({
                    body: message,
                    from: process.env.TWILIO_PHONE_NUMBER,
                    to: user.phone_number
                })
                .then(message => {
                    // Mark SMS as sent
                    User.markSmsSent(year, userId, function (err, result) {
                        if (err) {
                            console.error('Error marking SMS as sent:', err);
                        }
                    });

                    res.json({
                        success: true,
                        message: 'SMS sent successfully',
                        sid: message.sid
                    });
                })
                .catch(error => {
                    console.error('Twilio error:', error);
                    res.status(500).send({
                        error: true,
                        message: 'Failed to send SMS: ' + error.message
                    });
                });
        });
    });
};

// Send SMS to all users with assignments for a year
exports.sendAllAssignmentsSMS = function (req, res) {
    const year = parseInt(req.body.year) || new Date().getFullYear();

    // Initialize Twilio if not already done
    if (!twilioClient) {
        twilioClient = initTwilio();
        if (!twilioClient) {
            return res.status(500).send({
                error: true,
                message: 'Twilio not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables.'
            });
        }
    }

    // Get all assignments for the year
    User.getAssignmentsByYear(year, function (err, assignments) {
        if (err) {
            return res.status(500).send({ error: true, message: 'Error fetching assignments' });
        }

        if (!assignments || assignments.length === 0) {
            return res.status(404).send({ error: true, message: `No assignments found for ${year}` });
        }

        // Get all users to check phone numbers
        User.getAllUsers(function (err, users) {
            if (err) {
                return res.status(500).send({ error: true, message: 'Error fetching users' });
            }

            const userMap = {};
            users.forEach(u => {
                userMap[u.user_id] = u;
            });

            const results = [];
            const skipped = [];
            let completed = 0;
            let errors = [];

            assignments.forEach(assignment => {
                const user = userMap[assignment.giver_id];

                // Skip if already sent
                if (assignment.sms_sent_at) {
                    skipped.push({
                        user: assignment.giver_name,
                        reason: 'Already sent'
                    });
                    completed++;
                    if (completed === assignments.length) {
                        return sendResponse();
                    }
                    return;
                }

                if (!user || !user.phone_number) {
                    errors.push({
                        user: assignment.giver_name,
                        error: 'No phone number'
                    });
                    completed++;
                    if (completed === assignments.length) {
                        return sendResponse();
                    }
                    return;
                }

                const message = `🎄 Your Kris Kringle assignment for ${year}: You are giving a gift to ${assignment.receiver_name}! Keep it secret! 🎁`;

                twilioClient.messages
                    .create({
                        body: message,
                        from: process.env.TWILIO_PHONE_NUMBER,
                        to: user.phone_number
                    })
                    .then(message => {
                        // Mark SMS as sent
                        User.markSmsSent(year, assignment.giver_id, function (err, result) {
                            if (err) {
                                console.error('Error marking SMS as sent:', err);
                            }
                        });

                        results.push({
                            user: assignment.giver_name,
                            success: true,
                            sid: message.sid
                        });
                        completed++;
                        if (completed === assignments.length) {
                            sendResponse();
                        }
                    })
                    .catch(error => {
                        errors.push({
                            user: assignment.giver_name,
                            error: error.message
                        });
                        completed++;
                        if (completed === assignments.length) {
                            sendResponse();
                        }
                    });
            });

            function sendResponse() {
                res.json({
                    success: true,
                    sent: results.length,
                    skipped: skipped.length,
                    failed: errors.length,
                    results: results,
                    skipped_users: skipped,
                    errors: errors
                });
            }
        });
    });
};

