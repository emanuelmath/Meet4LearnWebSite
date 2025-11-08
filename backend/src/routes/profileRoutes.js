import express from 'express';
import { getProfiles, getTeacherByCarnet, createProfile } from '../controllers/profileController.js';

const router = express.Router();

router.get('/', getProfiles);
router.get('/:carnet', getTeacherByCarnet)
router.post('/', createProfile)

export default router;