import express from 'express';
import {
  getAllStaffAdmins,
  addStaffAdmin,
  deleteStaffAdmin,
} from '../controllers/adminController.js';
import { protect, superAdminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes here are restricted strictly to Super Admin
router.get('/staff', protect, superAdminOnly, getAllStaffAdmins);
router.post('/staff', protect, superAdminOnly, addStaffAdmin);
router.delete('/staff/:id', protect, superAdminOnly, deleteStaffAdmin);

export default router;
