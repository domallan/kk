// Global state
let users = [];
let editingUserId = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadUsers();
    updateYearInput();
});

// Set current year as default
function updateYearInput() {
    const yearInput = document.getElementById('yearInput');
    yearInput.value = new Date().getFullYear();
}

// Load users from API
async function loadUsers() {
    try {
        const response = await fetch('/users');
        users = await response.json();
        renderUsers();
        updatePartnerSelect();
    } catch (error) {
        showMessage('Error loading users: ' + error.message, 'error');
    }
}

// Render users list
function renderUsers() {
    const usersList = document.getElementById('usersList');
    
    if (users.length === 0) {
        usersList.innerHTML = '<div class="empty-state">No users yet. Add some users to get started!</div>';
        return;
    }
    
    usersList.innerHTML = users.map(user => {
        const partner = users.find(u => u.user_id === user.partner_id);
        const partnerName = partner ? partner.name : 'None';
        const phoneDisplay = user.phone_number ? escapeHtml(user.phone_number) : 'No phone';
        
        return `
            <div class="user-item" data-user-id="${user.user_id}">
                <div class="user-info">
                    <div class="user-name">${escapeHtml(user.name)}</div>
                    <div class="user-partner">Partner: ${escapeHtml(partnerName)} | Phone: ${phoneDisplay}</div>
                </div>
                <div class="user-actions">
                    <button class="btn-edit" onclick="editUser(${user.user_id})">Edit</button>
                    <button class="btn-delete" onclick="deleteUser(${user.user_id})">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

// Update partner select dropdown
function updatePartnerSelect() {
    const partnerSelect = document.getElementById('partnerSelect');
    const currentValue = partnerSelect.value;
    
    // Filter out the user being edited (can't be your own partner)
    const availableUsers = editingUserId 
        ? users.filter(u => u.user_id !== editingUserId)
        : users;
    
    partnerSelect.innerHTML = '<option value="">No partner</option>' +
        availableUsers.map(user => 
            `<option value="${user.user_id}">${escapeHtml(user.name)}</option>`
        ).join('');
    
    if (editingUserId) {
        const editingUser = users.find(u => u.user_id === editingUserId);
        if (editingUser && editingUser.partner_id) {
            partnerSelect.value = editingUser.partner_id;
        }
    } else if (currentValue) {
        partnerSelect.value = currentValue;
    }
}

// Add new user
async function addUser() {
    const nameInput = document.getElementById('userName');
    const phoneInput = document.getElementById('userPhone');
    const partnerSelect = document.getElementById('partnerSelect');
    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    
    if (!name) {
        showMessage('Please enter a name', 'error');
        return;
    }
    
    const userData = {
        name: name,
        partner_id: partnerSelect.value ? parseInt(partnerSelect.value) : null,
        phone_number: phone || null
    };
    
    try {
        if (editingUserId) {
            // Update existing user
            const response = await fetch(`/users/${editingUserId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error updating user');
            }
            
            showMessage('User updated successfully', 'success');
            editingUserId = null;
        } else {
            // Create new user
            const response = await fetch('/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error creating user');
            }
            
            showMessage('User added successfully', 'success');
        }
        
        // Reset form
        nameInput.value = '';
        phoneInput.value = '';
        cancelEdit();
        loadUsers();
    } catch (error) {
        showMessage('Error: ' + error.message, 'error');
    }
}

// Edit user
function editUser(userId) {
    const user = users.find(u => u.user_id === userId);
    if (!user) return;
    
    editingUserId = userId;
    document.getElementById('userName').value = user.name;
    document.getElementById('userPhone').value = user.phone_number || '';
    document.getElementById('userSubmitBtn').textContent = 'Update User';
    document.getElementById('userCancelBtn').style.display = 'block';
    updatePartnerSelect();
    
    // Scroll to form
    document.querySelector('.user-form').scrollIntoView({ behavior: 'smooth' });
}

// Cancel editing
function cancelEdit() {
    editingUserId = null;
    document.getElementById('userName').value = '';
    document.getElementById('userPhone').value = '';
    document.getElementById('partnerSelect').value = '';
    document.getElementById('userSubmitBtn').textContent = 'Add User';
    document.getElementById('userCancelBtn').style.display = 'none';
}

// Delete user
async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) {
        return;
    }
    
    try {
        const response = await fetch(`/users/${userId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error deleting user');
        }
        
        showMessage('User deleted successfully', 'success');
        loadUsers();
    } catch (error) {
        showMessage('Error: ' + error.message, 'error');
    }
}

// Generate assignments
async function generateAssignments() {
    const yearInput = document.getElementById('yearInput');
    const year = parseInt(yearInput.value);
    
    if (!year || year < 2000 || year > 2100) {
        showMessage('Please enter a valid year', 'error');
        return;
    }
    
    if (users.length < 2) {
        showMessage('You need at least 2 users to generate assignments', 'error');
        return;
    }
    
    try {
        const response = await fetch('/assignments/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ year: year })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'Error generating assignments');
        }
        
        showMessage(`Assignments generated successfully for ${year}!`, 'success');
        loadAssignments();
    } catch (error) {
        showMessage('Error: ' + error.message, 'error');
    }
}

// Load assignments for current year
async function loadAssignments() {
    const yearInput = document.getElementById('yearInput');
    const year = parseInt(yearInput.value);
    
    if (!year) {
        showMessage('Please enter a year', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/assignments/${year}`);
        const assignments = await response.json();
        
        renderAssignments(assignments, year);
    } catch (error) {
        showMessage('Error loading assignments: ' + error.message, 'error');
    }
}

// Render assignments
function renderAssignments(assignments, year) {
    const assignmentsList = document.getElementById('assignmentsList');
    
    if (!assignments || assignments.length === 0) {
        assignmentsList.innerHTML = `<div class="empty-state">No assignments for ${year}. Generate assignments to get started!</div>`;
        return;
    }
    
    assignmentsList.innerHTML = `
        <div class="message info">
            <strong>Assignments for ${year}</strong>
        </div>
        ${assignments.map(assignment => {
            const smsSent = assignment.sms_sent_at ? true : false;
            const smsSentClass = smsSent ? 'sms-sent' : '';
            const smsSentIcon = smsSent ? '✓' : '📱';
            const smsSentTitle = smsSent 
                ? `SMS sent to ${escapeHtml(assignment.giver_name)} (click to resend)` 
                : `Send SMS to ${escapeHtml(assignment.giver_name)}`;
            
            return `
            <div class="assignment-item ${smsSentClass}">
                <div class="assignment-info">
                    <span class="assignment-giver">${escapeHtml(assignment.giver_name)}</span>
                    <span class="assignment-arrow">→</span>
                    <span class="assignment-receiver">${escapeHtml(assignment.receiver_name)}</span>
                    ${smsSent ? '<span class="sms-status">✓ SMS Sent</span>' : ''}
                </div>
                <button class="btn-sms-individual ${smsSentClass}" onclick="sendIndividualSMS(${assignment.giver_id}, ${year})" title="${smsSentTitle}">
                    ${smsSentIcon}
                </button>
            </div>
        `;
        }).join('')}
    `;
}

// Show message
function showMessage(message, type = 'info') {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    // Insert at the top of the relevant section
    const card = document.querySelector('.card:last-child');
    card.insertBefore(messageDiv, card.firstChild);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

// Send SMS to a single user
async function sendIndividualSMS(userId, year) {
    if (!confirm('Send SMS to this user with their assignment?')) {
        return;
    }
    
    try {
        const response = await fetch('/sms/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                year: year,
                user_id: userId
            })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'Error sending SMS');
        }
        
        showMessage('SMS sent successfully!', 'success');
        // Reload assignments to show updated status
        loadAssignments();
    } catch (error) {
        showMessage('Error: ' + error.message, 'error');
    }
}

// Send SMS to all users
async function sendAllSMS() {
    const yearInput = document.getElementById('yearInput');
    const year = parseInt(yearInput.value);
    
    if (!year) {
        showMessage('Please enter a year', 'error');
        return;
    }
    
    if (!confirm(`Send SMS messages to all users with their ${year} assignments?`)) {
        return;
    }
    
    try {
        showMessage('Sending SMS messages...', 'info');
        
        const response = await fetch('/sms/send-all', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ year: year })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'Error sending SMS');
        }
        
        let successMsg = `SMS sent to ${result.sent} user(s).`;
        if (result.skipped > 0) {
            successMsg += ` ${result.skipped} already sent (skipped).`;
        }
        if (result.failed > 0) {
            successMsg += ` ${result.failed} failed.`;
        }
        
        showMessage(successMsg, result.failed > 0 ? 'error' : 'success');
        
        if (result.errors && result.errors.length > 0) {
            console.error('SMS errors:', result.errors);
        }
        
        // Reload assignments to show updated status
        loadAssignments();
    } catch (error) {
        showMessage('Error: ' + error.message, 'error');
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

