import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { broadcastRealtimeEvent } from '../services/realtimeService.js';

// 1. Super Admin: Get All Admins & Staff
export const getAllStaffAdmins = async (req, res) => {
  try {
    const ownerEmail = (process.env.ADMIN_EMAIL || 'theclassiccutsalon01@gmail.com').toLowerCase().trim();

    const staff = await User.find({
      $or: [
        { role: { $in: ['admin', 'superadmin'] } },
        { email: ownerEmail },
      ],
      isDeleted: { $ne: true },
    })
      .select('-password')
      .sort({ role: -1, createdAt: -1 })
      .lean();

    // Ensure the primary owner always has role 'superadmin' reflected
    const sanitizedStaff = staff.map((s) => {
      if (s.email.toLowerCase() === ownerEmail) {
        return { ...s, role: 'superadmin' };
      }
      return s;
    });

    res.status(200).json(sanitizedStaff);
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
    const ownerEmail = (process.env.ADMIN_EMAIL || 'theclassiccutsalon01@gmail.com').toLowerCase().trim();

    if (cleanEmail === ownerEmail) {
      return res.status(400).json({
        message: 'The Primary Salon Owner is already Super Admin.',
      });
    }

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

    if (existing.role === 'admin' || (existing.role === 'superadmin' && cleanEmail !== ownerEmail)) {
      return res.status(400).json({
        message: `${existing.name} (${existing.email}) is already an Admin!`,
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

    // Determine the Primary Salon Owner (Super Admin)
    const ownerEmail = (process.env.ADMIN_EMAIL || 'theclassiccutsalon01@gmail.com').toLowerCase().trim();

    // Protection 1: The Primary Salon Owner (Suraj Raut / theclassiccutsalon01@gmail.com) can NEVER be deleted or demoted
    if (targetAdmin.email.toLowerCase() === ownerEmail) {
      return res.status(403).json({
        message: 'Forbidden: The Primary Salon Owner account is protected and cannot be deleted or demoted!',
      });
    }

    // Protection 2: Cannot demote own account (self-demotion prevention)
    if (targetAdmin._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot demote or remove your own admin account.' });
    }

    // If target account is already 'user', ensure state and return success gracefully
    if (targetAdmin.role === 'user') {
      broadcastRealtimeEvent({ type: 'ADMIN_LIST_CHANGED' });
      return res.status(200).json({
        message: `Account ${targetAdmin.name} (${targetAdmin.email}) is already a standard customer user.`,
        user: {
          _id: targetAdmin._id,
          name: targetAdmin.name,
          email: targetAdmin.email,
          role: 'user',
        },
      });
    }

    const adminName = targetAdmin.name;
    const adminEmail = targetAdmin.email;

    // SEC-011: Safe demotion to standard customer role rather than permanently deleting the account
    // Preserves customer profile, booking history, stamps, and referential integrity in VisitLog
    targetAdmin.role = 'user';
    await targetAdmin.save();

    broadcastRealtimeEvent({ type: 'ADMIN_LIST_CHANGED' });

    res.status(200).json({
      message: `Admin ${adminName} (${adminEmail}) was successfully removed from Admin Staff and demoted to customer role.`,
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
