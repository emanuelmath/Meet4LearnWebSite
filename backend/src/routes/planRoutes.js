import express from 'express';
import { getPlans, getPlanById } from '../controllers/planController.js';

const router = express.Router();

router.get('/', getPlans);
router.get('/:id', getPlanById);

export default router;
