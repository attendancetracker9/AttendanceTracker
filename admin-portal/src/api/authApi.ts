/**
 * Authentication API - Firebase Auth Integration
 * 
 * This API now uses Firebase Authentication for all auth operations.
 * The mock functions are kept for backward compatibility but will be replaced by Firebase Auth.
 */

type LoginRequest = 
  | { identifier: string; password: string; role: "admin" | "others"; accessCode?: string }
  | { phoneOtp: string; phone: string; role: "admin" | "others"; accessCode?: string };

type LoginResponse = 
  | { success: true; token: string; user: { id: string; email: string; role: "admin" | "others"; name: string } }
  | { success: false; error: string };

type OtpResponse = 
  | { otpSent: true; expiresIn: number }
  | { otpSent: false; error: string };

// Seeded test credentials
const TEST_CREDENTIALS = {
  admin: { email: "admin@college.test", password: "Password123!", name: "Admin User", accessCode: "COLLEGE001" },
  others: { email: "faculty1@college.test", password: "Password123!", name: "Others User" }
};

// Mock access codes for different colleges (in production, validate against database)
const VALID_ACCESS_CODES = ["COLLEGE001", "COLLEGE002", "COLLEGE003"];

// In-memory storage for OTP (in production, use backend)
const otpStore = new Map<string, { code: string; expiresAt: number }>();

// Simulate network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const authApi = {
  /**
   * POST /api/auth/login
   * Handles both password and OTP-based login
   */
  async login(request: LoginRequest): Promise<LoginResponse> {
    await delay(800); // Simulate network latency

    // OTP-based login
    if ("phoneOtp" in request) {
      // Validate access code for admin
      if (request.role === "admin") {
        if (!request.accessCode || !VALID_ACCESS_CODES.includes(request.accessCode.toUpperCase())) {
          return { success: false, error: "Invalid access code" };
        }
      }

      const stored = otpStore.get(request.phone);
      if (!stored || stored.expiresAt < Date.now()) {
        return { success: false, error: "Invalid or expired OTP" };
      }
      if (stored.code !== request.phoneOtp) {
        return { success: false, error: "Invalid OTP code" };
      }
      otpStore.delete(request.phone);
      // In production, fetch user by phone from backend
      return {
        success: true,
        token: `mock-token-${Date.now()}`,
        user: {
          id: `user-${request.phone}`,
          email: `${request.phone}@college.test`,
          role: request.role,
          name: request.role === "admin" ? "Admin User" : "Others User"
        }
      };
    }

    // Password-based login
    const { identifier, password, role, accessCode } = request;
    const normalized = identifier.toLowerCase().trim();
    
    // Validate access code for admin
    if (role === "admin") {
      if (!accessCode || !VALID_ACCESS_CODES.includes(accessCode.toUpperCase())) {
        return { success: false, error: "Invalid access code" };
      }
    }
    
    // Check credentials
    const credential = role === "admin" ? TEST_CREDENTIALS.admin : TEST_CREDENTIALS.others;
    const isEmail = normalized.includes("@");
    const matchesEmail = isEmail && normalized === credential.email.toLowerCase();
    const matchesPassword = password === credential.password;

    if (!matchesEmail || !matchesPassword) {
      return { success: false, error: "Invalid email or password" };
    }

    return {
      success: true,
      token: `mock-token-${Date.now()}`,
      user: {
        id: `user-${role}-${Date.now()}`,
        email: credential.email,
        role,
        name: credential.name
      }
    };
  },

  /**
   * POST /api/auth/otp/send
   * Sends OTP to phone number (mock implementation)
   */
  async sendOtp(phone: string): Promise<OtpResponse> {
    await delay(600);

    // Validate phone format (10 digits)
    const digitsOnly = phone.replace(/\D/g, "");
    if (digitsOnly.length !== 10) {
      return { otpSent: false, error: "Invalid phone number. Must be 10 digits." };
    }

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    otpStore.set(phone, { code, expiresAt });

    // In production, send SMS via Twilio/WhatsApp API here
    console.log(`[MOCK] OTP for ${phone}: ${code} (expires in 5 minutes)`);

    return { otpSent: true, expiresIn: 300 };
  },

  /**
   * POST /api/auth/reset-password
   * Mock password reset flow
   */
  async resetPassword(email: string): Promise<{ success: boolean; message: string }> {
    await delay(500);
    // In production, send reset link via email
    return { success: true, message: "Password reset link sent to your email" };
  },

  /**
   * POST /api/auth/google
   * Note: This is now handled by Firebase Auth directly in the Login component
   * Keeping for backward compatibility but should use useAuth().signInWithGoogle() instead
   */
  async signInWithGoogle(): Promise<LoginResponse> {
    // This method is deprecated - use Firebase Auth directly via AuthContext
    throw new Error("Use Firebase Auth signInWithGoogle instead");
  }
};

