const User = require('../models/User');
const Invite = require('../models/Invite');

exports.showDashboard = async (req, res) => {
    try {
        const users = await User.find({});
        // Pass a 'view' variable to indicate which part of the panel to show
        res.render('admin', { users, view: 'dashboard' });
    } catch (err) {
        req.flash('error', 'Could not fetch users.');
        res.redirect('/dashboard'); // Or a general error page
    }
};

exports.updateBalance = async (req, res) => {
    try {
        const { userId, newBalance } = req.body;
        if (isNaN(parseFloat(newBalance)) || parseFloat(newBalance) < 0) {
            req.flash('error', 'Invalid balance amount.');
            return res.redirect('/admin/dashboard'); // This will re-render the dashboard view
        }
        await User.findByIdAndUpdate(userId, { balance: parseFloat(newBalance) });
        req.flash('success', 'User balance updated successfully.');
        res.redirect('/admin/dashboard');
    } catch (err) {
        req.flash('error', 'Failed to update balance.');
        res.redirect('/admin/dashboard');
    }
};

// Helper function to recursively fetch invitees
async function getInviteTree(userId) {
    const user = await User.findById(userId).lean();
    if (!user) return null;

    const invitesCreated = await Invite.find({ createdBy: userId }).populate('usedBy', '_id').lean();
    user.invitees = [];

    for (const invite of invitesCreated) {
        if (invite.usedBy) {
            const inviteeNode = await getInviteTree(invite.usedBy._id);
            if (inviteeNode) {
                user.invitees.push({
                    user: invite.usedBy,
                    inviteCode: invite.code,
                    children: inviteeNode.invitees
                });
            } else {
                 user.invitees.push({
                    user: invite.usedBy,
                    inviteCode: invite.code,
                    children: []
                });
            }
        }
    }
    return user;
}

exports.showUserInviteTree = async (req, res) => {
    try {
        const userId = req.params.userId;
        const targetUser = await User.findById(userId); // Renamed to avoid conflict with logged-in user
        if (!targetUser) {
            req.flash('error', 'User not found.');
            return res.redirect('/admin/dashboard');
        }

        const inviteTree = await getInviteTree(userId);

        // Pass 'view' and necessary data for the invite tree
        res.render('admin', { 
            targetUser, 
            inviteTree,
            view: 'inviteTree' 
        });
    } catch (err) {
        console.error("Error fetching invite tree:", err);
        req.flash('error', 'Could not fetch invite tree.');
        res.redirect('/admin/dashboard');
    }
};