import { NextRequest, NextResponse } from 'next/server';
import { validatePassword, hashPassword, addSecurityHeaders, logAuditEvent } from '@/lib/auth-utils';
import { initiateEmailVerification } from '@/lib/password-reset';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json({ 
        error: 'All fields are required' 
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        error: 'Invalid email format' 
      }, { status: 400 });
    }

    // Validate name (no special characters, reasonable length)
    if (name.length < 2 || name.length > 50) {
      return NextResponse.json({ 
        error: 'Name must be between 2 and 50 characters' 
      }, { status: 400 });
    }

    if (!/^[a-zA-Z\s'-]+$/.test(name)) {
      return NextResponse.json({ 
        error: 'Name can only contain letters, spaces, hyphens, and apostrophes' 
      }, { status: 400 });
    }

    // Enhanced password validation
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json({ 
        error: 'Password requirements not met',
        details: passwordValidation.errors,
        suggestions: passwordValidation.suggestions,
        score: passwordValidation.score
      }, { status: 400 });
    }

    // Connect to database
    const { connectToDatabase, User } = await import('@/lib/mongodb');
    await connectToDatabase();
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { email: email.toLowerCase() },
        { name: { $regex: new RegExp(`^${name}$`, 'i') } }
      ]
    });
    
    if (existingUser) {
      const response = NextResponse.json({ 
        error: existingUser.email === email.toLowerCase() 
          ? 'An account with this email already exists' 
          : 'An account with this name already exists'
      }, { status: 409 });
      
      return addSecurityHeaders(response);
    }

    // Hash password with enhanced security
    const hashedPassword = await hashPassword(password);

    // Create new user with enhanced profile
    const newUser = new User({
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      emailVerified: false,
      profileSetupComplete: false,
      role: 'user', // Default role
      avatarUrl: '',
      points: 0,
      earnedBadges: [],
      enrolledCourses: [],
      learningPreferences: {
        tracks: [],
        language: 'english'
      },
      customVideoLinks: [],
      userModuleVideos: {},
      userAIVideos: {},
      userAISearchUsage: {},
      textNotes: [],
      sketches: [],
      uploadedImages: [],
      dailyPlans: {},
      submittedFeedback: [],
      createdAt: new Date(),
      lastLoginAt: null,
      accountStatus: 'active',
      twoFactorEnabled: false,
      loginAttempts: 0,
      lockoutUntil: null,
    });

    await newUser.save();

    // Log registration
    logAuditEvent({
      type: 'register',
      userId: newUser._id.toString(),
      email: newUser.email,
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || undefined,
      details: { 
        action: 'account_created',
        passwordScore: passwordValidation.score 
      },
    });

    // Send email verification
    try {
      await initiateEmailVerification(newUser.email, request);
    } catch (emailError) {
      console.warn('Failed to send verification email:', emailError);
      // Don't fail registration if email fails
    }

    // Remove password from response
    const userResponse = newUser.toObject();
    delete userResponse.password;

    const response = NextResponse.json({ 
      success: true,
      message: 'Account created successfully! Please check your email for verification.',
      user: userResponse,
      emailVerificationSent: true
    });

    return addSecurityHeaders(response);
      } catch (error) {
    console.error('Registration error:', error);
    
    // Log registration failure
    logAuditEvent({
      type: 'register',
      email: 'unknown',
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || undefined,
      details: { 
        action: 'registration_failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
    });
    
    const response = NextResponse.json({ 
      error: 'Registration service temporarily unavailable' 
    }, { status: 500 });
    
    return addSecurityHeaders(response);
  }
}
