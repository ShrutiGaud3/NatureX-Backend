/**
 * NATUREX Platform - Multi-Gateway SMS & OTP Service
 * Supports: Fast2SMS, 2Factor, Twilio, MSG91, and Dev/Console Fallback
 */

export interface ISendOtpResult {
  success: boolean;
  provider: string;
  messageId?: string;
  debugOtp?: string;
  message: string;
}

export class OtpService {
  /**
   * Generates a 4-digit or 6-digit OTP
   * Master Admin / Test phone '9999999999' always generates '1234' for developer convenience
   */
  static generateOtp(phone: string, digits: number = 4): string {
    if (phone === '9999999999') {
      return '1234';
    }
    
    // If explicit fixed OTP mode is enabled in dev
    if (process.env.FIXED_DEV_OTP) {
      return process.env.FIXED_DEV_OTP;
    }

    const min = Math.pow(10, digits - 1);
    const max = Math.pow(10, digits) - 1;
    return Math.floor(min + Math.random() * (max - min + 1)).toString();
  }

  /**
   * Sends OTP SMS using configured provider with automatic fallback
   */
  static async sendSms(phone: string, otp: string, countryCode: string = '+91'): Promise<ISendOtpResult> {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const provider = (process.env.OTP_PROVIDER || 'auto').toLowerCase();

    // 1. FAST2SMS (India Quick OTP Gateway - easiest to use)
    const fast2SmsKey = process.env.FAST2SMS_API_KEY;
    if ((provider === 'fast2sms' || provider === 'auto') && fast2SmsKey) {
      try {
        const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
          method: 'POST',
          headers: {
            'authorization': fast2SmsKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            route: 'otp',
            variables_values: otp,
            numbers: cleanPhone
          })
        });

        const data: any = await response.json();
        if (data && data.return === true) {
          console.log(`[OTP Service] Fast2SMS delivered OTP to ${cleanPhone}. ReqId: ${data.request_id}`);
          return {
            success: true,
            provider: 'fast2sms',
            messageId: data.request_id,
            message: 'OTP sent successfully to your mobile via SMS.'
          };
        } else {
          console.warn(`[OTP Service] Fast2SMS failed:`, data?.message || data);
        }
      } catch (err: any) {
        console.error(`[OTP Service] Fast2SMS error:`, err.message);
      }
    }

    // 2. 2FACTOR.IN (India SMS Gateway)
    const twoFactorKey = process.env.TWOFACTOR_API_KEY;
    if ((provider === '2factor' || provider === 'auto') && twoFactorKey) {
      try {
        const url = `https://2factor.in/API/V1/${twoFactorKey}/SMS/${cleanPhone}/${otp}/NATUREX_OTP`;
        const response = await fetch(url, { method: 'GET' });
        const data: any = await response.json();
        if (data && data.Status === 'Success') {
          console.log(`[OTP Service] 2Factor delivered OTP to ${cleanPhone}. Session: ${data.Details}`);
          return {
            success: true,
            provider: '2factor',
            messageId: data.Details,
            message: 'OTP sent successfully to your mobile via SMS.'
          };
        } else {
          console.warn(`[OTP Service] 2Factor failed:`, data?.Details || data);
        }
      } catch (err: any) {
        console.error(`[OTP Service] 2Factor error:`, err.message);
      }
    }

    // 3. TWILIO (Global SMS Gateway)
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
    if ((provider === 'twilio' || provider === 'auto') && twilioSid && twilioAuth && twilioPhone) {
      try {
        const fullPhone = countryCode.startsWith('+') ? `${countryCode}${cleanPhone}` : `+91${cleanPhone}`;
        const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
        const bodyParams = new URLSearchParams();
        bodyParams.append('To', fullPhone);
        bodyParams.append('From', twilioPhone);
        bodyParams.append('Body', `Your NATUREX verification code is: ${otp}. Valid for 5 minutes. Do not share.`);

        const authHeader = 'Basic ' + Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64');
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: bodyParams.toString()
        });

        const data: any = await response.json();
        if (response.ok && data.sid) {
          console.log(`[OTP Service] Twilio delivered OTP to ${fullPhone}. SID: ${data.sid}`);
          return {
            success: true,
            provider: 'twilio',
            messageId: data.sid,
            message: 'OTP sent successfully to your mobile via SMS.'
          };
        } else {
          console.warn(`[OTP Service] Twilio failed:`, data?.message || data);
        }
      } catch (err: any) {
        console.error(`[OTP Service] Twilio error:`, err.message);
      }
    }

    // 4. MSG91 (India Enterprise Gateway)
    const msg91Auth = process.env.MSG91_AUTH_KEY;
    const msg91Template = process.env.MSG91_TEMPLATE_ID;
    if ((provider === 'msg91' || provider === 'auto') && msg91Auth && msg91Template) {
      try {
        const fullPhone = `91${cleanPhone}`;
        const url = `https://control.msg91.com/api/v5/otp?template_id=${msg91Template}&mobile=${fullPhone}&authkey=${msg91Auth}&otp=${otp}`;
        const response = await fetch(url, { method: 'POST' });
        const data: any = await response.json();
        if (data && (data.type === 'success' || data.message === 'OTP sent successfully')) {
          console.log(`[OTP Service] MSG91 delivered OTP to ${fullPhone}. ReqId: ${data.request_id}`);
          return {
            success: true,
            provider: 'msg91',
            messageId: data.request_id,
            message: 'OTP sent successfully to your mobile via SMS.'
          };
        } else {
          console.warn(`[OTP Service] MSG91 failed:`, data?.message || data);
        }
      } catch (err: any) {
        console.error(`[OTP Service] MSG91 error:`, err.message);
      }
    }

    // 5. Development Console / Mock Mode (Fallback)
    console.log(`
┌────────────────────────────────────────────────────────────┐
│ 🌿 NATUREX OTP NOTIFICATION                                │
├────────────────────────────────────────────────────────────┤
│  Recipient Mobile: ${countryCode} ${cleanPhone}                     │
│  Verification OTP: [ ${otp} ]                               │
│  Valid For       : 5 Minutes                               │
│  Provider Status : Dev / Console Fallback                  │
└────────────────────────────────────────────────────────────┘
`);

    return {
      success: true,
      provider: 'console_dev_mode',
      debugOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
      message: 'OTP generated successfully (SMS Gateway key not set in .env, using instant dev verification code).'
    };
  }

  /**
   * Returns active provider configuration status
   */
  static getActiveProvider(): { provider: string; configured: boolean; supportedGateways: string[] } {
    if (process.env.FAST2SMS_API_KEY) {
      return { provider: 'fast2sms', configured: true, supportedGateways: ['fast2sms', '2factor', 'twilio', 'msg91', 'console_dev_mode'] };
    }
    if (process.env.TWOFACTOR_API_KEY) {
      return { provider: '2factor', configured: true, supportedGateways: ['fast2sms', '2factor', 'twilio', 'msg91', 'console_dev_mode'] };
    }
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      return { provider: 'twilio', configured: true, supportedGateways: ['fast2sms', '2factor', 'twilio', 'msg91', 'console_dev_mode'] };
    }
    if (process.env.MSG91_AUTH_KEY) {
      return { provider: 'msg91', configured: true, supportedGateways: ['fast2sms', '2factor', 'twilio', 'msg91', 'console_dev_mode'] };
    }
    return { provider: 'console_dev_mode', configured: false, supportedGateways: ['fast2sms', '2factor', 'twilio', 'msg91', 'console_dev_mode'] };
  }
}
