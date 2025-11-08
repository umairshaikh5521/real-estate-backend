import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import * as schema from "../db/schema";
import nodemailer from "nodemailer";

// Email transporter setup
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Better Auth configuration
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      verification: schema.verificationTokens,
    },
  }),
  
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Users can login immediately
    minPasswordLength: 8,
    maxPasswordLength: 128,
    
    // Password validation - at least one uppercase, lowercase, and number
    passwordValidation: (password: string) => {
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      
      if (!hasUpperCase || !hasLowerCase || !hasNumber) {
        return {
          valid: false,
          message: "Password must contain at least one uppercase letter, one lowercase letter, and one number"
        };
      }
      
      return { valid: true };
    },
  },
  
  // Session configuration
  session: {
    expiresIn: 60 * 15, // 15 minutes (access token)
    updateAge: 60 * 5,  // Update session every 5 minutes
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  
  // Advanced session with refresh tokens
  advancedSession: {
    enabled: true,
    refreshToken: {
      enabled: true,
      expiresIn: 60 * 60 * 24 * 7, // 7 days
    },
  },
  
  // Account configuration
  account: {
    accountLinking: {
      enabled: false, // Disable for now, can enable for social login later
    },
  },
  
  // User configuration
  user: {
    additionalFields: {
      fullName: {
        type: "string",
        required: true,
        input: true,
      },
      phone: {
        type: "string",
        required: false,
        input: true,
      },
      role: {
        type: "string",
        required: true,
        defaultValue: "channel_partner",
        input: false, // Don't allow users to set their own role
      },
    },
    
    // Default role for new users
    modelFields: {
      role: {
        defaultValue: "channel_partner",
      },
    },
  },
  
  // Email verification
  emailVerification: {
    enabled: true,
    autoSignInAfterVerification: true,
    sendOnSignUp: true,
    
    sendVerificationEmail: async ({ user, url }) => {
      const transporter = createEmailTransporter();
      
      await transporter.sendMail({
        from: process.env.SMTP_FROM || '"Real Estate CRM" <noreply@realestate.com>',
        to: user.email,
        subject: "Verify your email address",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to Real Estate CRM!</h2>
            <p>Hi ${user.fullName || user.email},</p>
            <p>Thank you for signing up. Please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${url}" style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Verify Email
              </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="color: #666; word-break: break-all;">${url}</p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create an account, you can safely ignore this email.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px;">Real Estate CRM - Property Management System</p>
          </div>
        `,
      });
    },
  },
  
  // Password reset
  resetPassword: {
    enabled: true,
    
    sendResetPassword: async ({ user, url }) => {
      const transporter = createEmailTransporter();
      
      await transporter.sendMail({
        from: process.env.SMTP_FROM || '"Real Estate CRM" <noreply@realestate.com>',
        to: user.email,
        subject: "Reset your password",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset Request</h2>
            <p>Hi ${user.fullName || user.email},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${url}" style="background-color: #2196F3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="color: #666; word-break: break-all;">${url}</p>
            <p>This link will expire in 1 hour.</p>
            <p><strong>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</strong></p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px;">Real Estate CRM - Property Management System</p>
          </div>
        `,
      });
    },
  },
  
  // Security options
  rateLimit: {
    enabled: true,
    window: 60, // 1 minute
    max: 10, // 10 requests per minute
  },
  
  // Trust proxy for production (Vercel)
  trustProxy: true,
  
  // Base URL (will be set via environment variable)
  baseURL: process.env.BASE_URL || "http://localhost:8000",
  
  // Secret for signing tokens
  secret: process.env.AUTH_SECRET || process.env.JWT_SECRET || "your-secret-key-change-in-production",
});
