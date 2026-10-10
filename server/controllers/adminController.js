import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { broadcastRealtimeEvent } from '../services/realtimeService.js';

// 1. Super Admin: Get All Admins & Staff
export const getAllStaffAdmins = async (req, res) => {
  try {
    const staff = await User.find({
      role: { $in: ['admin', 'superadmin'] },
      isDeleted: { $ne: true },
    })
      .select('-password')
      .sort({ role: -1, createdAt: -1 })
      .lean();

    res.status(200).json(staff);
  } catch (error) {
    console.error('Get Staff Error:', error);
    res.status(500).json({ message: 'Failed to fetch staff admins' });
  }
};

// 2. Super Admin: Promote Existing User to Admin
export const addStaffAdmin = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'User registered email is required.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // The user MUST already be an existing registered user
    const existing = await User.findOne({ email: cleanEmail });
    if (!existing) {
      return res.status(404).json({
        message: 'No registered user found with this email! To make someone an admin, they must first create an account on the website as an existing customer.',
      });
    }

    if (existing.isDeleted) {
      return res.status(400).json({
        message: 'This user account is currently in the deleted recycle bin. Please restore the account before promoting to Admin.',
      });
    }

    if (existing.role === 'admin' || existing.role === 'superadmin') {
      return res.status(400).json({
        message: `${existing.name} (${existing.email}) is already an ${existing.role === 'superadmin' ? 'Super Admin' : 'Admin'}!`,
      });
    }

    // Promote existing user to admin (they will decide/retain their own password)
    existing.role = 'admin';
    existing.isVerified = true;
    await existing.save();

    broadcastRealtimeEvent({ type: 'ADMIN_LIST_CHANGED' });

    return res.status(200).json({
      message: `User ${existing.name} (${existing.email}) successfully promoted to Admin! They will decide their own password.`,
      admin: {
        _id: existing._id,
        name: existing.name,
        email: existing.email,
        phone: existing.phone,
        role: existing.role,
        hasPassword: Boolean(existing.password),
      },
    });
  } catch (error) {
    console.error('Add Admin Error:', error);
    res.status(500).json({ message: 'Failed to promote user to admin.' });
  }
};

// 3. Super Admin: Remove an Admin from Staff (Safe Demotion to Customer)
export const deleteStaffAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid admin ID format.' });
    }

    const targetAdmin = await User.findById(id);
    if (!targetAdmin) {
      return res.status(404).json({ message: 'Admin account not found' });
    }

    // Protection: Super Admin can NEVER be deleted or demoted
    const configuredAdminEmail = process.env.ADMIN_EMAIL ? process.env.ADMIN_EMAIL.toLowerCase().trim() : null;
    if (
      targetAdmin.role === 'superadmin' ||
      (configuredAdminEmail && targetAdmin.email.toLowerCase() === configuredAdminEmail)
    ) {
      return res.status(403).json({
        message: 'Forbidden: The Super Admin account is protected and cannot be deleted or demoted!',
      });
    }

    // Protection: Cannot demote own account (self-demotion prevention)
    if (targetAdmin._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot demote or remove your own admin account.' });
    }

    // Role check: Only accounts with role 'admin' can be demoted via this staff endpoint
    if (targetAdmin.role !== 'admin') {
      return res.status(400).json({ message: 'Target account is not an admin staff member.' });
    }

    const adminName = targetAdmin.name;
    const adminEmail = targetAdmin.email;

    // SEC-011: Safe demotion to standard customer role rather than permanently deleting the account
    // Preserves customer profile, booking history, stamps, and referential integrity in VisitLog
    targetAdmin.role = 'user';
    await targetAdmin.save();

    broadcastRealtimeEvent({ type: 'ADMIN_LIST_CHANGED' });

    res.status(200).json({
      message: `Admin ${adminName} (${adminEmail}) was successfully demoted to customer role.`,
      user: {
        _id: targetAdmin._id,
        name: targetAdmin.name,
        email: targetAdmin.email,
        role: targetAdmin.role,
      },
    });
  } catch (error) {
    console.error('Demote Admin Error:', error);
    res.status(500).json({ message: 'Failed to demote admin staff member.' });
  }
};
