const User = require('../models/User');
const Invite = require('../models/Invite');

exports.showDashboard = async (req, res) => {
    try {
        const users = await User.find({});
        res.render('admin', { users, view: 'dashboard' });
    } catch (err) {
        req.flash('error', 'Could not fetch users.');
        res.redirect('/dashboard');
    }
};

exports.updateBalance = async (req, res) => {
    try {
        const { userId, newBalance } = req.body;
        if (isNaN(parseFloat(newBalance)) || parseFloat(newBalance) < 0) {
            req.flash('error', 'Invalid balance amount.');
            return res.redirect('/admin/dashboard');
        }
        await User.findByIdAndUpdate(userId, { balance: parseFloat(newBalance) });
        req.flash('success', 'User balance updated successfully.');
        res.redirect('/admin/dashboard');
    } catch (err) {
        req.flash('error', 'Failed to update balance.');
        res.redirect('/admin/dashboard');
    }
};

// Updated function to get only directly invited users
async function getDirectInvitees(userId) {
    const user = await User.findById(userId).lean(); // User whose invitees we're fetching
    if (!user) return null;

    // Find invites created by this user that have been used
    const invitesCreated = await Invite.find({ createdBy: userId, usedBy: { $ne: null } })
                                       .populate('usedBy', 'username email _id') // Populate with username, email, and _id
                                       .lean();

    const directInviteesList = invitesCreated.map(invite => {
        if (invite.usedBy) { // Ensure usedBy is populated
            return {
                user: { // Structure this to match what the EJS might expect for user details
                    _id: invite.usedBy._id,
                    username: invite.usedBy.username,
                    email: invite.usedBy.email
                },
                inviteCode: invite.code
            };
        }
        return null; // Should not happen if usedBy is not null, but good practice
    }).filter(item => item !== null); // Filter out any nulls if they occur

    return { // Return an object that includes the list
        invitees: directInviteesList
    };
}

exports.showUserInviteTree = async (req, res) => {
    try {
        const userId = req.params.userId;
        const targetUser = await User.findById(userId).lean(); // User whose invite tree is being viewed
        if (!targetUser) {
            req.flash('error', 'User not found.');
            return res.redirect('/admin/dashboard');
        }

        // Fetch only direct invitees using the updated function
        const directInviteData = await getDirectInvitees(userId);

        res.render('admin', {
            targetUser,        // The user whose invitees we are viewing
            inviteData: directInviteData, // Pass the new structure
            view: 'inviteTree'
        });
    } catch (err) {
        console.error("Error fetching direct invitees:", err);
        req.flash('error', 'Could not fetch invitees.');
        res.redirect('/admin/dashboard');
    }
};