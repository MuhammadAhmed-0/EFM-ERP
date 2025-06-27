const mongoose = require('mongoose');
const User = require('./User');
const { Schema } = mongoose;

// Admin Schema
const adminSchema = new Schema({
  permissions: {
    canManageUsers: { 
      type: Boolean, 
      default: true 
    },
    canManageSchedules: { 
      type: Boolean, 
      default: true 
    },
    canManagePayments: { 
      type: Boolean, 
      default: true 
    },
    canSendAnnouncements: { 
      type: Boolean, 
      default: true 
    }
  }
});

// Create Admin model using User discriminator
const Admin = User.discriminator('admin', adminSchema);

module.exports = Admin;