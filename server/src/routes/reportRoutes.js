import { Router } from 'express';
import { dailyReport, monthToDateReport, monthlyReport } from '../controllers/reportController.js';
import { requireAuth } from '../middleware/auth.js';
const router = Router();
router.use(requireAuth);
router.get('/daily', dailyReport);
router.get('/month-to-date', monthToDateReport);
router.get('/monthly', monthlyReport);
export default router;
