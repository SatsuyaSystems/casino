const Invite = require('../models/Invite');
const { v4: uuidv4 } = require('uuid');

exports.generateInvite = async (req, res) => {
    if (!req.user) {
        return res.status(401).send('Unauthorized');
    }

    try {
        const invite = new Invite({
            code: uuidv4(),
            createdBy: req.user._id
        });

        await invite.save();

        res.redirect('/invites');
    } catch (err) {
        res.status(500).send(err.message);
    }
};

exports.listInvites = async (req, res) => {
    if (!req.user) {
        return res.status(401).send('Unauthorized');
    }

    try {
        const invites = await Invite.find({ createdBy: req.user._id });
        res.render('invites', { invites });
    } catch (err) {
        res.status(500).send(err.message);
    }
    finally
    {
        // Optionally, you can handle any cleanup or logging here
    }
};

exports.buyInvite = async (req, res) => {
    if (!req.user) {
        return res.status(401).send('Unauthorized');
    }

    try {
        // In a real app, you would process payment here
        // For now, we'll just create a free invite
        
        const invite = new Invite({
            code: uuidv4(),
            createdBy: req.user._id
        });

        await invite.save();
        res.redirect('/invites');
    } catch (err) {
        res.status(500).send(err.message);
    }
};
