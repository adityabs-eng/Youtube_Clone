import express from 'express';
import { registerUser } from '../controllers/user.controller.js';

const router = express.Router();

router.post('/register', registerUser);
// router.route('/login').get(registerUser).post(registerUser); // Example for additional routes   


export default router;