const mongoose = require('mongoose');
const argon2 = require('argon2');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    balance: {
        type: Number,
        default: 1000
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        this.password = await argon2.hash(this.password);
        next();
    } catch (err) {
        next(err);
    }
});

// Method to verify password
userSchema.methods.verifyPassword = async function(password) {
    return await argon2.verify(this.password, password);
};

module.exports = mongoose.model('User', userSchema);
