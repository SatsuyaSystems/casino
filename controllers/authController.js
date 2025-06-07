const User = require('../models/User');
const Invite = require('../models/Invite');
const argon2 = require('argon2');
const { v4: uuidv4 } = require('uuid');
const passport = require('passport');

exports.showRegister = (req, res) => {
    res.render('register');
};

exports.register = async (req, res, next) => {
    try {
        const { username, email, password, inviteCode } = req.body;

        // Validate invite code
        const invite = await Invite.findOne({ code: inviteCode, active: true });
        if (!invite) {
            req.flash('error', 'Invalid or used invite code');
            return res.redirect('/register');
        }

        // Create user
        const user = new User({ username, email, password });
        await user.save();

        // Mark invite as used
        invite.usedBy = user._id;
        invite.usedAt = new Date();
        invite.active = false;
        await invite.save();

        // Login user
        req.login(user, (err) => {
            if (err) return next(err);
            req.flash('success', 'Registration successful!');
            return res.redirect('/dashboard');
        });
    } catch (err) {
        req.flash('error', err.message);
        res.redirect('/register');
    }
};

exports.showLogin = (req, res) => {
    res.render('login');
};

exports.login = passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/login',
    failureFlash: true
});

exports.logout = (req, res, next) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
    });
};
