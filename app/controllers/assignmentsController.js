'use strict';

var User = require('../model/appModel.js');

// Generate KK assignments for a given year
exports.generateAssignments = function(req, res) {
    const year = parseInt(req.body.year) || new Date().getFullYear();
    
    // Get all users
    User.getAllUsers(function(err, users) {
        if (err) {
            return res.status(500).send({ error: true, message: 'Error fetching users' });
        }
        
        if (!users || users.length < 2) {
            return res.status(400).send({ error: true, message: 'Need at least 2 users to generate assignments' });
        }
        
        // Delete existing assignments for this year
        User.deleteAssignmentsByYear(year, function(err, deleteResult) {
            if (err) {
                console.log('Error deleting existing assignments:', err);
            }
            
            // Generate assignments
            const assignments = generateKKAssignments(users);
            
            if (!assignments) {
                return res.status(400).send({ error: true, message: 'Could not generate valid assignments. Try again or check couple relationships.' });
            }
            
            // Save assignments to database
            let completed = 0;
            let errors = [];
            
            assignments.forEach((assignment, index) => {
                User.createAssignment(year, assignment.giver_id, assignment.receiver_id, function(err, result) {
                    completed++;
                    if (err) {
                        errors.push(err);
                    }
                    
                    if (completed === assignments.length) {
                        if (errors.length > 0) {
                            return res.status(500).send({ error: true, message: 'Error saving some assignments', errors: errors });
                        }
                        
                        // Return the assignments
                        User.getAssignmentsByYear(year, function(err, savedAssignments) {
                            if (err) {
                                return res.status(500).send({ error: true, message: 'Error fetching saved assignments' });
                            }
                            res.json({ success: true, assignments: savedAssignments });
                        });
                    }
                });
            });
        });
    });
};

// Get assignments for a year
exports.getAssignments = function(req, res) {
    const year = parseInt(req.params.year) || new Date().getFullYear();
    
    User.getAssignmentsByYear(year, function(err, assignments) {
        if (err) {
            return res.status(500).send({ error: true, message: 'Error fetching assignments' });
        }
        res.json(assignments);
    });
};

// Get assignment for a specific user in a year
exports.getUserAssignment = function(req, res) {
    const year = parseInt(req.params.year) || new Date().getFullYear();
    const userId = parseInt(req.params.user_id);
    
    User.getAssignmentForUser(year, userId, function(err, assignment) {
        if (err) {
            return res.status(500).send({ error: true, message: 'Error fetching assignment' });
        }
        res.json(assignment);
    });
};

// Delete assignments for a year
exports.deleteAssignments = function(req, res) {
    const year = parseInt(req.params.year);
    
    User.deleteAssignmentsByYear(year, function(err, result) {
        if (err) {
            return res.status(500).send({ error: true, message: 'Error deleting assignments' });
        }
        res.json({ success: true, message: 'Assignments deleted' });
    });
};

// KK Assignment Algorithm
// Ensures no one gets their partner and creates a valid permutation
function generateKKAssignments(users) {
    // Create a map of partner relationships
    const partnerMap = {};
    users.forEach(user => {
        if (user.partner_id) {
            partnerMap[user.user_id] = user.partner_id;
            partnerMap[user.partner_id] = user.user_id;
        }
    });
    
    const userIds = users.map(u => u.user_id);
    const n = userIds.length;
    
    // Try multiple times to find a valid assignment
    for (let attempt = 0; attempt < 100; attempt++) {
        const receivers = [...userIds];
        const assignments = [];
        let valid = true;
        
        // Shuffle receivers
        for (let i = receivers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [receivers[i], receivers[j]] = [receivers[j], receivers[i]];
        }
        
        // Check if assignment is valid
        for (let i = 0; i < n; i++) {
            const giverId = userIds[i];
            const receiverId = receivers[i];
            
            // Can't assign to self
            if (giverId === receiverId) {
                valid = false;
                break;
            }
            
            // Can't assign to partner
            if (partnerMap[giverId] === receiverId) {
                valid = false;
                break;
            }
            
            assignments.push({
                giver_id: giverId,
                receiver_id: receiverId
            });
        }
        
        if (valid) {
            return assignments;
        }
    }
    
    // If we couldn't find a valid assignment, try a more systematic approach
    return generateKKAssignmentsSystematic(users, partnerMap);
}

// Systematic approach using backtracking
function generateKKAssignmentsSystematic(users, partnerMap) {
    const userIds = users.map(u => u.user_id);
    const n = userIds.length;
    const assignment = new Array(n);
    const used = new Array(n).fill(false);
    
    function isValid(giverIndex, receiverIndex) {
        const giverId = userIds[giverIndex];
        const receiverId = userIds[receiverIndex];
        
        // Can't assign to self
        if (giverId === receiverId) {
            return false;
        }
        
        // Can't assign to partner
        if (partnerMap[giverId] === receiverId) {
            return false;
        }
        
        return true;
    }
    
    function backtrack(index) {
        if (index === n) {
            return true; // Found a valid assignment
        }
        
        // Try all possible receivers for this giver
        const candidates = [];
        for (let i = 0; i < n; i++) {
            if (!used[i] && isValid(index, i)) {
                candidates.push(i);
            }
        }
        
        // Shuffle candidates for randomness
        for (let i = candidates.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
        }
        
        for (const receiverIndex of candidates) {
            assignment[index] = receiverIndex;
            used[receiverIndex] = true;
            
            if (backtrack(index + 1)) {
                return true;
            }
            
            used[receiverIndex] = false;
        }
        
        return false;
    }
    
    if (backtrack(0)) {
        return assignment.map((receiverIndex, giverIndex) => ({
            giver_id: userIds[giverIndex],
            receiver_id: userIds[receiverIndex]
        }));
    }
    
    return null; // No valid assignment found
}

