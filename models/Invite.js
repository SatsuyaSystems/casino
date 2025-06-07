const mongoose = require('mongoose');

const inviteSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    usedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    usedAt: {
        type: Date
    },
    active: {
        type: Boolean,
        default: true
    }
});

module.exports = mongoose.model('Invite', inviteSchema);
