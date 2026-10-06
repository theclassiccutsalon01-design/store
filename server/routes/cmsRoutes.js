import express from 'express';
import { getSiteConfig, updateSiteConfig } from '../controllers/cmsController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/config', getSiteConfig);
router.put('/config', protect, adminOnly, updateSiteConfig);

export default router;
