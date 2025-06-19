/**
 * Password Reset and Email Verification System
 * 
 * Provides secure password reset and email verification functionality
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase, User } from './mongodb';
import { logAuditEvent } from './auth-utils';

/**
 * Extract IP address from NextRequest
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  return forwarded?.split(',')[0].trim() || realIP || 'unknown';
}

// Token storage (in production, use Redis or database)
interface ResetToken {
  email: string;
  token: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

interface VerificationToken {
  email: string;
  token: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

const resetTokens = new Map<string, ResetToken>();
const verificationTokens = new Map<string, VerificationToken>();

/**
 * Generate secure random token
 */
function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Send email (mock implementation - replace with real email service)
 */
async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  // In production, integrate with SendGrid, AWS SES, or similar service
  console.log(`[EMAIL] To: ${to}, Subject: ${subject}`);
  console.log(`[EMAIL] Body: ${html}`);
  return true; // Mock implementation
}

/**
 * Initiate password reset
 */
export async function initiatePasswordReset(
  email: string,
  request: NextRequest
): Promise<{ success: boolean; message: string }> {
  try {
    await connectToDatabase();
    
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      logAuditEvent({
        type: 'login_failure',
        email,
        ip: getClientIP(request),
        userAgent: request.headers.get('user-agent') || 'unknown',
        details: { reason: 'unknown_email' },
      });
      
      // Don't reveal if email exists for security
      return {
        success: true,
        message: 'If an account with that email exists, you will receive a password reset link.',
      };
    }

    // Generate reset token
    const token = generateSecureToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    const resetToken: ResetToken = {
      email,
      token,
      expiresAt,
      used: false,
      createdAt: new Date(),
    };

    resetTokens.set(token, resetToken);

    // Generate reset URL
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

    // Send email
    const emailSent = await sendEmail(
      email,
      'Reset Your SkillSprint Password',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Reset Your Password</h2>
          <p>Hi ${user.name},</p>
          <p>You requested a password reset for your SkillSprint account. Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            This link will expire in 1 hour. If you didn't request this, please ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">
            This email was sent from SkillSprint. If you have questions, contact our support team.
          </p>
        </div>
      `
    );

    if (!emailSent) {
      return {
        success: false,
        message: 'Failed to send password reset email. Please try again later.',
      };
    }

    logAuditEvent({
      type: 'login_success',
      userId: user._id.toString(),
      email,
      ip: getClientIP(request),
      userAgent: request.headers.get('user-agent') || 'unknown',
      details: { action: 'password_reset_email_sent' },
    });

    return {
      success: true,
      message: 'Password reset link sent to your email address.',
    };
  } catch (error) {
    console.error('Password reset initiation error:', error);
    return {
      success: false,
      message: 'Password reset service temporarily unavailable.',
    };
  }
}
/**
 * Validate password reset token
 */
export function validateResetToken(token: string): {
  isValid: boolean;
  email?: string;
  error?: string;
} {
  const resetToken = resetTokens.get(token);
  
  if (!resetToken) {
    return { isValid: false, error: 'Invalid or expired reset token' };
  }
  
  if (resetToken.used) {
    return { isValid: false, error: 'Reset token has already been used' };
  }
  
  if (new Date() > resetToken.expiresAt) {
    resetTokens.delete(token);
    return { isValid: false, error: 'Reset token has expired' };
  }
  
  return { isValid: true, email: resetToken.email };
}

/**
 * Complete password reset
 */
export async function completePasswordReset(
  token: string,
  newPassword: string,
  request: NextRequest
): Promise<{ success: boolean; message: string }> {
  try {
    // Validate token
    const validation = validateResetToken(token);
    if (!validation.isValid) {
      return { success: false, message: validation.error! };
    }

    const email = validation.email!;
    
    // Validate password strength
    const { validatePassword, hashPassword } = await import('./auth-utils');
    const passwordValidation = validatePassword(newPassword);
    
    if (!passwordValidation.isValid) {
      return {
        success: false,
        message: `Password requirements not met: ${passwordValidation.errors.join(', ')}`,
      };
    }

    await connectToDatabase();
    
    // Update user password
    const hashedPassword = await hashPassword(newPassword);
    const user = await User.findOneAndUpdate(
      { email },
      { $set: { password: hashedPassword } },
      { new: true }
    );

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    // Mark token as used
    const resetToken = resetTokens.get(token)!;
    resetToken.used = true;
    resetTokens.set(token, resetToken);

    // Log password change
    logAuditEvent({
      type: 'password_change',
      userId: user._id.toString(),
      email,
      ip: getClientIP(request),
      userAgent: request.headers.get('user-agent') || 'unknown',
      details: { method: 'reset_token' },
    });

    // Send confirmation email
    await sendEmail(
      email,
      'Password Changed Successfully',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">Password Changed Successfully</h2>
          <p>Hi ${user.name},</p>
          <p>Your SkillSprint account password has been successfully changed.</p>
          <p style="color: #666; font-size: 14px;">
            If you didn't make this change, please contact our support team immediately.
          </p>
          <p style="color: #666; font-size: 14px;">
            Changed on: ${new Date().toLocaleString()}
          </p>
        </div>
      `
    );

    return {
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.',
    };
  } catch (error) {
    console.error('Password reset completion error:', error);
    return {
      success: false,
      message: 'Failed to reset password. Please try again.',
    };
  }
}

/**
 * Initiate email verification
 */
export async function initiateEmailVerification(
  email: string,
  request: NextRequest
): Promise<{ success: boolean; message: string }> {
  try {
    await connectToDatabase();
    
    const user = await User.findOne({ email });
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    if (user.emailVerified) {
      return { success: true, message: 'Email is already verified' };
    }

    // Generate verification token
    const token = generateSecureToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const verificationToken: VerificationToken = {
      email,
      token,
      expiresAt,
      used: false,
      createdAt: new Date(),
    };

    verificationTokens.set(token, verificationToken);

    // Generate verification URL
    const verifyUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

    // Send verification email
    const emailSent = await sendEmail(
      email,
      'Verify Your SkillSprint Email',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Verify Your Email Address</h2>
          <p>Hi ${user.name},</p>
          <p>Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Verify Email
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            This link will expire in 24 hours. If you didn't create this account, please ignore this email.
          </p>
          <p style="color: #666; font-size: 14px;">
            For security, you can also copy and paste this link: ${verifyUrl}
          </p>
        </div>
      `
    );

    if (!emailSent) {
      return {
        success: false,
        message: 'Failed to send verification email.',
      };
    }

    logAuditEvent({
      type: 'register',
      userId: user._id.toString(),
      email,
      ip: getClientIP(request),
      userAgent: request.headers.get('user-agent') || 'unknown',
      details: { action: 'verification_email_sent' },
    });

    return {
      success: true,
      message: 'Verification email sent. Please check your inbox.',
    };
  } catch (error) {
    console.error('Email verification initiation error:', error);
    return {
      success: false,
      message: 'Email verification service temporarily unavailable.',
    };
  }
}
/**
 * Complete email verification
 */
export async function completeEmailVerification(
  token: string,
  request: NextRequest
): Promise<{ success: boolean; message: string }> {
  try {
    const verificationToken = verificationTokens.get(token);
    
    if (!verificationToken) {
      return { success: false, message: 'Invalid or expired verification token' };
    }
    
    if (verificationToken.used) {
      return { success: false, message: 'Verification token has already been used' };
    }
    
    if (new Date() > verificationToken.expiresAt) {
      verificationTokens.delete(token);
      return { success: false, message: 'Verification token has expired' };
    }

    await connectToDatabase();
    
    const user = await User.findOneAndUpdate(
      { email: verificationToken.email },
      { $set: { emailVerified: true } },
      { new: true }
    );

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    // Mark token as used
    verificationToken.used = true;
    verificationTokens.set(token, verificationToken);

    // Log email verification
    logAuditEvent({
      type: 'register',
      userId: user._id.toString(),
      email: user.email,
      ip: getClientIP(request),
      userAgent: request.headers.get('user-agent') || 'unknown',
      details: { action: 'email_verified' },
    });

    return {
      success: true,
      message: 'Email verified successfully! You can now access all features.',
    };
  } catch (error) {
    console.error('Email verification completion error:', error);
    return {
      success: false,
      message: 'Failed to verify email. Please try again.',
    };
  }

}/**
 * Clean up expired tokens
 */
export function cleanupExpiredTokens(): { resetTokens: number; verificationTokens: number } {
  const now = new Date();
  let expiredResetTokens = 0;
  let expiredVerificationTokens = 0;

  // Clean reset tokens
  for (const [token, resetToken] of resetTokens.entries()) {
    if (now > resetToken.expiresAt || resetToken.used) {
      resetTokens.delete(token);
      expiredResetTokens++;
    }
  }

  // Clean verification tokens
  for (const [token, verificationToken] of verificationTokens.entries()) {
    if (now > verificationToken.expiresAt || verificationToken.used) {
      verificationTokens.delete(token);
      expiredVerificationTokens++;
    }
  }

  return { resetTokens: expiredResetTokens, verificationTokens: expiredVerificationTokens };
}

// Clean up expired tokens every hour
setInterval(cleanupExpiredTokens, 60 * 60 * 1000);

