/**
 * Login Page for Admin/Faculty Portal
 * 
 * Features:
 * - Password and OTP login methods
 * - Role selector (Admin/Faculty)
 * - Theme-aware styling (inherits from ThemeContext)
 * - Responsive desktop-first layout
 * - Accessibility: keyboard navigation, ARIA labels, focus management
 * - Mock authentication (no backend required)
 * 
 * Test Credentials:
 * - Admin: admin@college.test / Password123! (requires access code)
 * - Others: faculty1@college.test / Password123!
 * 
 * Keyboard Shortcuts:
 * - Ctrl+L: Focus email/identifier input
 * - Enter: Submit form
 */

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Modal } from "../components/Modal";
import { isValidEmail, isE164Phone } from "../utils/formatters";
import { EyeIcon, EyeSlashIcon, LockClosedIcon, DevicePhoneMobileIcon } from "@heroicons/react/24/outline";
import type { ConfirmationResult } from "firebase/auth";

type LoginMethod = "password" | "otp";
type UserRole = "admin" | "others";

type FormErrors = {
  accessCode?: string;
  identifier?: string;
  password?: string;
  phone?: string;
  otp?: string;
  general?: string;
};

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { push: pushToast } = useToast();
  const { palette, mode, availablePalettes } = useTheme();
  const { signIn, signUp, signInWithGoogle, signInWithPhone, verifyPhoneOTP, resetPassword: firebaseResetPassword } = useAuth();

  const [loginMethod, setLoginMethod] = useState<LoginMethod>("password");
  const [role, setRole] = useState<UserRole>("admin");
  const [accessCode, setAccessCode] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [phoneConfirmation, setPhoneConfirmation] = useState<ConfirmationResult | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");

  const accessCodeRef = useRef<HTMLInputElement>(null);
  const identifierRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const otpRef = useRef<HTMLInputElement>(null);

  // Check if account is locked
  useEffect(() => {
    if (lockedUntil && lockedUntil > Date.now()) {
      const interval = setInterval(() => {
        if (lockedUntil <= Date.now()) {
          setLockedUntil(null);
          setFailedAttempts(0);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockedUntil]);

  // OTP countdown timer
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  // Keyboard shortcut: Ctrl+L to focus identifier
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "l") {
        e.preventDefault();
        identifierRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Validate form fields
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Access Code validation for Admin - Only during Sign In, not Sign Up
    if (!isSignUp && role === "admin" && !accessCode.trim()) {
      newErrors.accessCode = "Access code is required";
    }

    if (loginMethod === "password") {
      if (!identifier.trim()) {
        newErrors.identifier = "Email or phone is required";
      } else if (!isValidEmail(identifier) && !isE164Phone(identifier)) {
        newErrors.identifier = "Please enter a valid email or 10-digit phone number";
      }
      if (!password) {
        newErrors.password = "Password is required";
      }
      if (isSignUp && !name.trim()) {
        newErrors.general = "Name is required for registration";
      }
    } else {
      if (!phone.trim()) {
        newErrors.phone = "Phone number is required";
      } else if (!isE164Phone(phone)) {
        newErrors.phone = "Please enter a valid 10-digit phone number";
      }
      if (otpSent && !otp.trim()) {
        newErrors.otp = "OTP is required";
      } else if (otpSent && otp.length !== 6) {
        newErrors.otp = "OTP must be 6 digits";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle OTP send (Firebase Phone Auth)
  const handleSendOtp = useCallback(async () => {
    if (!phone.trim() || !isE164Phone(phone)) {
      setErrors({ phone: "Please enter a valid 10-digit phone number" });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const confirmation = await signInWithPhone(phone);
      setPhoneConfirmation(confirmation);
      setOtpSent(true);
      setOtpCountdown(300); // 5 minutes
      pushToast({ status: "success", title: "OTP Sent", description: "Check your phone for the verification code" });
      otpRef.current?.focus();
    } catch (error: any) {
      const errorMessage = error.message || "Failed to send OTP";
      setErrors({ phone: errorMessage });
      pushToast({ status: "error", title: "Error", description: errorMessage });
    } finally {
      setLoading(false);
    }
  }, [phone, signInWithPhone, pushToast]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Check if locked
      if (lockedUntil && lockedUntil > Date.now()) {
        const minutesLeft = Math.ceil((lockedUntil - Date.now()) / 60000);
        setErrors({ general: `Account temporarily locked. Try again in ${minutesLeft} minute(s).` });
        return;
      }

      if (!validateForm()) return;

      setLoading(true);
      setErrors({});

      try {
        if (loginMethod === "password") {
          if (isSignUp) {
            // Create new account - Only "others" role allowed (admin accounts are managed by developers)
            await signUp(identifier, password, "others", undefined, name || undefined);
            pushToast({ status: "success", title: "Account created!", description: "Welcome! Your account has been created successfully" });
            // Don't navigate - users with "others" role should not access admin console
            // They should contact admin or use a different portal
            pushToast({ 
              status: "info", 
              title: "Account Created", 
              description: "Your account has been created. Please contact your administrator for access to the admin console." 
            });
            // Reset form
            setIsSignUp(false);
            setIdentifier("");
            setPassword("");
            setName("");
            return; // Don't navigate to dashboard
          } else {
            // Sign in to existing account
            await signIn(identifier, password, role, role === "admin" ? accessCode : undefined);
            if (rememberMe) {
              localStorage.setItem("rememberMe", "true");
            }
            pushToast({ status: "success", title: "Welcome back!", description: "Successfully signed in" });
            // Wait a moment for auth state to update, then navigate to dashboard
            setTimeout(() => {
              navigate("/", { replace: true });
            }, 100);
          }
        } else {
          // Phone OTP login with Firebase
          if (!phoneConfirmation) {
            setErrors({ general: "Please request OTP first" });
            return;
          }
          await verifyPhoneOTP(phoneConfirmation, otp);
          pushToast({ status: "success", title: "Welcome!", description: "Successfully signed in" });
          // Wait a moment for auth state to update, then navigate to dashboard
          setTimeout(() => {
            navigate("/", { replace: true });
          }, 100);
        }
      } catch (error: any) {
        const errorMessage = error.message || "An error occurred. Please try again.";
        const newFailedAttempts = failedAttempts + 1;
        setFailedAttempts(newFailedAttempts);

        if (newFailedAttempts >= 3) {
          const lockDuration = 2 * 60 * 1000; // 2 minutes
          setLockedUntil(Date.now() + lockDuration);
          setErrors({ general: "Too many failed attempts. Account locked for 2 minutes." });
        } else {
          setErrors({ general: errorMessage });
        }
        pushToast({ status: "error", title: "Error", description: errorMessage });
      } finally {
        setLoading(false);
      }
    },
    [loginMethod, identifier, password, phone, otp, role, accessCode, rememberMe, failedAttempts, lockedUntil, phoneConfirmation, isSignUp, name, signIn, signUp, verifyPhoneOTP, navigate, pushToast]
  );

  // Password strength indicator (client-side)
  const getPasswordStrength = (pwd: string): { strength: "weak" | "medium" | "strong"; label: string } => {
    if (pwd.length === 0) return { strength: "weak", label: "" };
    if (pwd.length < 6) return { strength: "weak", label: "Too short" };
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /\d/.test(pwd);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
    const criteria = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
    if (criteria >= 3 && pwd.length >= 8) return { strength: "strong", label: "Strong" };
    if (criteria >= 2) return { strength: "medium", label: "Medium" };
    return { strength: "weak", label: "Weak" };
  };

  const passwordStrength = getPasswordStrength(password);

  // Handle Google Sign-In (Firebase)
  const handleGoogleSignIn = useCallback(async () => {
    setGoogleLoading(true);
    setErrors({});

    try {
      await signInWithGoogle();
      pushToast({
        status: "success",
        title: "Welcome!",
        description: "Successfully signed in with Google"
      });
      navigate("/dashboard");
    } catch (error: any) {
      const errorMessage = error.message || "An error occurred during Google sign-in. Please try again.";
      setErrors({ general: errorMessage });
      pushToast({ status: "error", title: "Error", description: errorMessage });
    } finally {
      setGoogleLoading(false);
    }
  }, [signInWithGoogle, navigate, pushToast]);

  // Theme-aware gradient for left panel
  const primaryColor = `rgb(${mode === "dark" ? palette.dark["color-primary"] : palette.light["color-primary"]})`;
  const secondaryColor = `rgb(${mode === "dark" ? palette.dark["color-secondary"] : palette.light["color-secondary"]})`;

  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg-base))]">
      {/* reCAPTCHA container for phone auth (hidden) */}
      <div id="recaptcha-container" className="hidden" />
      {/* Left Panel - Brand Area */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-[rgb(var(--text-primary))] mb-2">College Admin Portal</h1>
          <p className="text-lg text-[rgb(var(--text-muted))]">Manage student notifications and announcements</p>
        </div>

        {/* Themed Gradient Illustration */}
        <div className="relative z-10 mt-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="relative h-64 rounded-3xl overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}20)`,
              border: `2px solid ${primaryColor}40`
            }}
          >
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: `radial-gradient(circle at 20% 50%, ${primaryColor}40, transparent 50%),
                                 radial-gradient(circle at 80% 80%, ${secondaryColor}40, transparent 50%)`
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <LockClosedIcon className="w-24 h-24" style={{ color: primaryColor }} />
            </div>
          </motion.div>
        </div>

        {/* Theme Preview Strip */}
        <div className="relative z-10 mt-8">
          <p className="text-xs font-semibold text-[rgb(var(--text-muted))] uppercase tracking-wide mb-2">Current Theme</p>
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg border-2 border-white/20"
              style={{ backgroundColor: primaryColor }}
              title={palette.name}
            />
            <span className="text-sm font-medium text-[rgb(var(--text-primary))]">{palette.name}</span>
            <span className="text-xs text-[rgb(var(--text-muted))]">•</span>
            <span className="text-xs text-[rgb(var(--text-muted))] capitalize">{mode}</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Card */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="rounded-2xl border border-white/5 bg-[rgb(var(--bg-elevated))] p-8 shadow-soft">
            <h2 className="text-2xl font-bold text-[rgb(var(--text-primary))] mb-6">
              {isSignUp ? "Create Account" : "Sign In"}
            </h2>

            {/* Login Method Tabs */}
            <div className="flex gap-2 mb-6 p-1 rounded-xl bg-[rgb(var(--bg-base))]" role="tablist">
              <button
                type="button"
                onClick={() => {
                  setLoginMethod("password");
                  setErrors({});
                  setOtpSent(false);
                  setOtp("");
                }}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  loginMethod === "password"
                    ? "bg-[rgb(var(--color-primary))] text-[rgb(var(--bg-base))]"
                    : "text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]"
                }`}
                role="tab"
                aria-selected={loginMethod === "password"}
                aria-controls="password-panel"
                data-testid="login-method-password"
              >
                Password
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMethod("otp");
                  setErrors({});
                  setOtpSent(false);
                  setOtp("");
                  setPhoneConfirmation(null);
                }}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  loginMethod === "otp"
                    ? "bg-[rgb(var(--color-primary))] text-[rgb(var(--bg-base))]"
                    : "text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]"
                }`}
                role="tab"
                aria-selected={loginMethod === "otp"}
                aria-controls="otp-panel"
                data-testid="login-method-otp"
              >
                <DevicePhoneMobileIcon className="w-4 h-4 inline mr-1" />
                OTP
              </button>
            </div>

            {/* Role Selector - Only show for Sign In, not for Sign Up */}
            {!isSignUp && (
              <div className="flex gap-2 mb-6 p-1 rounded-xl bg-[rgb(var(--bg-base))]" role="radiogroup" aria-label="User role">
                <button
                  type="button"
                  onClick={() => {
                    setRole("admin");
                    setAccessCode(""); // Reset access code when switching roles
                  }}
                  className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    role === "admin"
                      ? "bg-[rgb(var(--color-primary))] text-[rgb(var(--bg-base))]"
                      : "text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]"
                  }`}
                  role="radio"
                  aria-checked={role === "admin"}
                  data-testid="login-role-admin"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRole("others");
                    setAccessCode(""); // Clear access code when switching to others
                  }}
                  className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    role === "others"
                      ? "bg-[rgb(var(--color-primary))] text-[rgb(var(--bg-base))]"
                      : "text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]"
                  }`}
                  role="radio"
                  aria-checked={role === "others"}
                  data-testid="login-role-others"
                >
                  Others
                </button>
              </div>
            )}

            {/* General Error Alert */}
            <AnimatePresence>
              {errors.general && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 rounded-xl bg-rose-500/20 border border-rose-400/30 px-4 py-3 text-sm text-rose-100"
                  role="alert"
                  aria-live="polite"
                >
                  {errors.general}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {loginMethod === "password" ? (
                <>
                  {/* Name field for Sign Up */}
                  {isSignUp && (
                    <div>
                      <label htmlFor="name" className="mb-1 block text-sm font-semibold text-[rgb(var(--text-primary))]">
                        Full Name
                      </label>
                      <Input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full"
                        aria-required="true"
                        aria-invalid={errors.general ? "true" : "false"}
                      />
                    </div>
                  )}

                  {/* Access Code field for Admin - Only show during Sign In, not Sign Up */}
                  {!isSignUp && role === "admin" && (
                    <div>
                      <label htmlFor="accessCode" className="block text-sm font-medium text-[rgb(var(--text-primary))] mb-2">
                        Access Code
                      </label>
                      <Input
                        id="accessCode"
                        ref={accessCodeRef}
                        type="text"
                        value={accessCode}
                        onChange={(e) => {
                          setAccessCode(e.target.value);
                          setErrors((prev) => ({ ...prev, accessCode: undefined }));
                        }}
                        placeholder="Enter college access code"
                        aria-invalid={!!errors.accessCode}
                        aria-describedby={errors.accessCode ? "accessCode-error" : undefined}
                        disabled={loading || (lockedUntil !== null && lockedUntil > Date.now())}
                        data-testid="login-access-code"
                        autoComplete="off"
                      />
                      {errors.accessCode && (
                        <p id="accessCode-error" className="mt-1 text-xs text-rose-400" role="alert">
                          {errors.accessCode}
                        </p>
                      )}
                    </div>
                  )}
                  <div>
                    <label htmlFor="identifier" className="block text-sm font-medium text-[rgb(var(--text-primary))] mb-2">
                      Email or Phone
                    </label>
                    <Input
                      id="identifier"
                      ref={identifierRef}
                      type="text"
                      value={identifier}
                      onChange={(e) => {
                        setIdentifier(e.target.value);
                        setErrors((prev) => ({ ...prev, identifier: undefined }));
                      }}
                      placeholder="admin@college.test"
                      aria-invalid={!!errors.identifier}
                      aria-describedby={errors.identifier ? "identifier-error" : undefined}
                      disabled={loading || (lockedUntil !== null && lockedUntil > Date.now())}
                      data-testid="login-email"
                      autoComplete="username"
                    />
                    {errors.identifier && (
                      <p id="identifier-error" className="mt-1 text-xs text-rose-400" role="alert">
                        {errors.identifier}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-[rgb(var(--text-primary))] mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Input
                        id="password"
                        ref={passwordRef}
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setErrors((prev) => ({ ...prev, password: undefined }));
                        }}
                        placeholder="Enter your password"
                        aria-invalid={!!errors.password}
                        aria-describedby={errors.password ? "password-error" : undefined}
                        disabled={loading || (lockedUntil !== null && lockedUntil > Date.now())}
                        data-testid="login-password"
                        autoComplete="current-password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))] transition"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                      </button>
                    </div>
                    {password && (
                      <div className="mt-1 flex items-center gap-2">
                        <div className="flex-1 h-1 rounded-full bg-[rgb(var(--bg-base))] overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              passwordStrength.strength === "weak"
                                ? "w-1/3 bg-rose-500"
                                : passwordStrength.strength === "medium"
                                ? "w-2/3 bg-amber-500"
                                : "w-full bg-emerald-500"
                            }`}
                          />
                        </div>
                        <span className="text-xs text-[rgb(var(--text-muted))]">{passwordStrength.label}</span>
                      </div>
                    )}
                    {errors.password && (
                      <p id="password-error" className="mt-1 text-xs text-rose-400" role="alert">
                        {errors.password}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-white/20 bg-surface/80 text-[rgb(var(--color-primary))] focus:ring-[rgb(var(--color-primary))]"
                        disabled={loading}
                      />
                      <span className="text-sm text-[rgb(var(--text-muted))]">Remember me</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm text-[rgb(var(--color-primary))] hover:underline"
                      disabled={loading}
                    >
                      Forgot password?
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Access Code field for Admin */}
                  {role === "admin" && (
                    <div>
                      <label htmlFor="accessCode-otp" className="block text-sm font-medium text-[rgb(var(--text-primary))] mb-2">
                        Access Code
                      </label>
                      <Input
                        id="accessCode-otp"
                        ref={accessCodeRef}
                        type="text"
                        value={accessCode}
                        onChange={(e) => {
                          setAccessCode(e.target.value);
                          setErrors((prev) => ({ ...prev, accessCode: undefined }));
                        }}
                        placeholder="Enter college access code"
                        aria-invalid={!!errors.accessCode}
                        aria-describedby={errors.accessCode ? "accessCode-otp-error" : undefined}
                        disabled={loading || (lockedUntil !== null && lockedUntil > Date.now())}
                        data-testid="login-access-code-otp"
                        autoComplete="off"
                      />
                      {errors.accessCode && (
                        <p id="accessCode-otp-error" className="mt-1 text-xs text-rose-400" role="alert">
                          {errors.accessCode}
                        </p>
                      )}
                    </div>
                  )}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-[rgb(var(--text-primary))] mb-2">
                      Phone Number
                    </label>
                    <Input
                      id="phone"
                      ref={phoneRef}
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setErrors((prev) => ({ ...prev, phone: undefined }));
                      }}
                      placeholder="9876543210"
                      aria-invalid={!!errors.phone}
                      aria-describedby={errors.phone ? "phone-error" : undefined}
                      disabled={loading || otpSent}
                      data-testid="login-phone"
                      autoComplete="tel"
                    />
                    {errors.phone && (
                      <p id="phone-error" className="mt-1 text-xs text-rose-400" role="alert">
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  {otpSent && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <label htmlFor="otp" className="block text-sm font-medium text-[rgb(var(--text-primary))] mb-2">
                        Enter OTP
                      </label>
                      <Input
                        id="otp"
                        ref={otpRef}
                        type="text"
                        value={otp}
                        onChange={(e) => {
                          setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                          setErrors((prev) => ({ ...prev, otp: undefined }));
                        }}
                        placeholder="000000"
                        maxLength={6}
                        aria-invalid={!!errors.otp}
                        aria-describedby={errors.otp ? "otp-error" : undefined}
                        disabled={loading}
                        data-testid="login-otp-input"
                        className="text-center text-2xl tracking-widest"
                      />
                      {errors.otp && (
                        <p id="otp-error" className="mt-1 text-xs text-rose-400" role="alert">
                          {errors.otp}
                        </p>
                      )}
                    </motion.div>
                  )}

                  {!otpSent && (
                    <Button
                      type="button"
                      variant="secondary"
                      fullWidth
                      onClick={handleSendOtp}
                      disabled={loading || !phone.trim()}
                      data-testid="login-otp-send"
                    >
                      Send OTP
                    </Button>
                  )}

                  {otpSent && otpCountdown > 0 && (
                    <p className="text-xs text-center text-[rgb(var(--text-muted))]">
                      Resend OTP in {Math.floor(otpCountdown / 60)}:{(otpCountdown % 60).toString().padStart(2, "0")}
                    </p>
                  )}

                  {otpSent && otpCountdown === 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      fullWidth
                      onClick={handleSendOtp}
                      disabled={loading}
                      className="text-sm"
                    >
                      Resend OTP
                    </Button>
                  )}
                </>
              )}

              <Button
                type="submit"
                variant="primary"
                fullWidth
                disabled={loading || (lockedUntil !== null && lockedUntil > Date.now())}
                data-testid="login-submit"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {isSignUp ? "Creating account..." : "Signing in..."}
                  </span>
                ) : (
                  isSignUp ? "Create Account" : "Sign In"
                )}
              </Button>

              {/* Toggle between Sign In and Sign Up */}
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setErrors({});
                    setName("");
                    setAccessCode("");
                    if (isSignUp) {
                      setRole("admin"); // Reset to admin for sign in
                    } else {
                      setRole("others"); // Set to others for sign up (users can't create admin accounts)
                    }
                  }}
                  className="text-sm text-[rgb(var(--color-primary))] hover:underline"
                >
                  {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Create Account"}
                </button>
              </div>
            </form>

            {/* SSO Section */}
            <div className="mt-6 pt-6 border-t border-white/5">
              <p className="text-xs text-center text-[rgb(var(--text-muted))] mb-3">Or continue with</p>
              <div className="flex gap-3">
                {!isSignUp && (
                  <Button
                    variant="ghost"
                    fullWidth
                    onClick={() => {
                      setIsSignUp(true);
                      setErrors({});
                      setName("");
                    }}
                    disabled={loading || (lockedUntil !== null && lockedUntil > Date.now())}
                    data-testid="login-create-account"
                    className="flex-1"
                  >
                    Create Account
                  </Button>
                )}
                <Button
                  variant="ghost"
                  fullWidth
                  onClick={handleGoogleSignIn}
                  disabled={loading || googleLoading || (lockedUntil !== null && lockedUntil > Date.now())}
                  data-testid="login-google"
                  className={isSignUp ? "w-full" : "flex-1"}
                >
                {googleLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Signing in with Google...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Google
                  </span>
                )}
              </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        open={showForgotPassword}
        onClose={() => {
          setShowForgotPassword(false);
          setResetEmail("");
        }}
        title="Reset Password"
      >
        <div className="space-y-4">
          <p className="text-sm text-[rgb(var(--text-muted))]">
            Enter your email address and we'll send you a link to reset your password.
          </p>
          <div>
            <label htmlFor="reset-email" className="block text-sm font-medium text-[rgb(var(--text-primary))] mb-2">
              Email Address
            </label>
            <Input
              id="reset-email"
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="admin@college.test"
              autoComplete="email"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setShowForgotPassword(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={async () => {
                if (!isValidEmail(resetEmail)) {
                  pushToast({ status: "error", title: "Invalid Email", description: "Please enter a valid email address" });
                  return;
                }
                try {
                  await firebaseResetPassword(resetEmail);
                  pushToast({
                    status: "success",
                    title: "Reset Link Sent",
                    description: "Password reset link sent to your email"
                  });
                  setShowForgotPassword(false);
                  setResetEmail("");
                } catch (error: any) {
                  pushToast({
                    status: "error",
                    title: "Error",
                    description: error.message || "Failed to send reset link"
                  });
                }
              }}
            >
              Send Reset Link
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Login;

