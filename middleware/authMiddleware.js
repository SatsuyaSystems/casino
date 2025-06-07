exports.ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
};

exports.ensureGuest = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
};

exports.ensureAdmin = (req, res, next) => {
    if (req.isAuthenticated() && req.user._id.toString() === process.env.ADMIN_ID) {
        return next();
    }
    req.flash('error', 'Access denied. Admin privileges required.');
    res.redirect('/dashboard');
};
