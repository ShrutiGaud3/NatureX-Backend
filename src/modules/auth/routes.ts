import { Router } from 'express';
import { sendOtp, resendOtp, verifyOtp, selectRole, getMe, logout, seedAdmin, getOtpProviderStatus } from './controller';
import { validateSendOtp, validateVerifyOtp, validateSelectRole } from './validations';
import { authenticate } from './middleware';

const router = Router();

// Public Auth & OTP Endpoints (Screen S03, S04)
router.get('/otp-status', getOtpProviderStatus);
router.post('/send-otp', validateSendOtp, sendOtp);
router.post('/resend-otp', validateSendOtp, resendOtp);
router.post('/verify-otp', validateVerifyOtp, verifyOtp);
router.post('/seed-admin', seedAdmin); // Dev helper to create / provision Admin user

// Protected Auth Endpoints (Screen S05 + Session)
router.post('/select-role', authenticate, validateSelectRole, selectRole);
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);

export default router;
