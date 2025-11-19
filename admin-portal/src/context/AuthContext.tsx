import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";

type UserRole = "admin" | "others";

type UserProfile = {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  accessCode?: string; // For admin users
  collegeId?: string; // College identifier
};

type AuthContextValue = {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string, role: UserRole, accessCode?: string) => Promise<void>;
  signUp: (email: string, password: string, role: UserRole, accessCode?: string, name?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithPhone: (phone: string) => Promise<ConfirmationResult>;
  verifyPhoneOTP: (confirmationResult: ConfirmationResult, otp: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Initialize Recaptcha (for phone auth)
let recaptchaVerifier: RecaptchaVerifier | null = null;

const initializeRecaptcha = () => {
  if (typeof window !== "undefined") {
    // Clean up existing verifier if any
    if (recaptchaVerifier) {
      try {
        recaptchaVerifier.clear();
      } catch {
        // Ignore cleanup errors
      }
    }
    
    // Create new verifier
    recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
      callback: () => {
        // reCAPTCHA solved
      },
      "expired-callback": () => {
        // reCAPTCHA expired
        recaptchaVerifier = null;
      }
    });
  }
  return recaptchaVerifier;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user profile from Firestore
  const loadUserProfile = useCallback(async (firebaseUser: User): Promise<UserProfile | null> => {
    try {
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          id: firebaseUser.uid,
          email: firebaseUser.email || "",
          role: (data.role as UserRole) || "others",
          name: data.name || firebaseUser.displayName || "User",
          accessCode: data.accessCode,
          collegeId: data.collegeId
        };
      } else {
        // Create default profile for new users
        const defaultProfile: UserProfile = {
          id: firebaseUser.uid,
          email: firebaseUser.email || "",
          role: "others",
          name: firebaseUser.displayName || "User"
        };
        await setDoc(doc(db, "users", firebaseUser.uid), {
          email: firebaseUser.email,
          role: "others",
          name: firebaseUser.displayName || "User",
          createdAt: new Date().toISOString()
        });
        return defaultProfile;
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
      return null;
    }
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const profile = await loadUserProfile(firebaseUser);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [loadUserProfile]);

  // Email/Password sign in
  const signIn = useCallback(
    async (email: string, password: string, role: UserRole, accessCode?: string) => {
      try {
        // Validate access code for admin
        if (role === "admin" && accessCode) {
          const normalizedCode = accessCode.trim();
          
          // DEMO ACCESS CODE - Remove in production!
          // WARNING: Anyone who knows this code can login as admin
          const DEMO_ACCESS_CODE = "12345";
          
          if (normalizedCode === DEMO_ACCESS_CODE) {
            // Demo access code is valid - proceed without Firestore check
            console.warn("⚠️ Using demo access code. This should be removed in production!");
          } else {
            // Check access code in Firestore
            try {
              const accessCodeDoc = await getDoc(doc(db, "accessCodes", normalizedCode.toUpperCase()));
              if (!accessCodeDoc.exists()) {
                throw new Error("Invalid access code");
              }
              const codeData = accessCodeDoc.data();
              if (!codeData.active) {
                throw new Error("Access code is inactive");
              }
            } catch (firestoreError: any) {
              // If Firestore is not accessible or there's an error, only allow demo code
              if (firestoreError.message && !firestoreError.message.includes("Invalid access code")) {
                console.error("Firestore error checking access code:", firestoreError);
              }
              throw new Error("Invalid access code");
            }
          }
        } else if (role === "admin" && !accessCode) {
          throw new Error("Access code is required for admin login");
        }

        let userCredential;
        
        // Try to sign in first
        try {
          userCredential = await signInWithEmailAndPassword(auth, email, password);
        } catch (signInError: any) {
          // If user doesn't exist and we have a valid access code, create the user
          if (signInError.code === "auth/user-not-found" || signInError.code === "auth/invalid-credential") {
            // For demo access code, allow automatic user creation
            if (role === "admin" && accessCode && accessCode.trim() === "12345") {
              try {
                // Create new user account
                userCredential = await createUserWithEmailAndPassword(auth, email, password);
              } catch (createError: any) {
                // If creation fails (e.g., email already exists but with different provider), try sign in again
                if (createError.code === "auth/email-already-in-use") {
                  throw new Error("An account with this email already exists. Please use the correct password or sign in with Google.");
                }
                throw new Error(createError.message || "Failed to create account");
              }
            } else {
              // For non-demo codes or non-admin, don't auto-create
              throw new Error("Invalid email or password. Please check your credentials.");
            }
          } else {
            // Other sign-in errors (wrong password, etc.)
            throw new Error(signInError.message || "Invalid email or password");
          }
        }
        
        // Update user profile with role and access code if admin
        // IMPORTANT: Only update to admin if access code is provided and validated
        if (userCredential.user && role === "admin" && accessCode) {
          const normalizedCode = accessCode.trim().toUpperCase();
          await setDoc(
            doc(db, "users", userCredential.user.uid),
            {
              email: userCredential.user.email,
              role: "admin",
              accessCode: normalizedCode,
              collegeId: normalizedCode,
              name: userCredential.user.displayName || userCredential.user.email?.split("@")[0] || "Admin User",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            { merge: true }
          );
          // Reload profile immediately after updating
          const updatedProfile = await loadUserProfile(userCredential.user);
          if (updatedProfile) {
            setUserProfile(updatedProfile);
          }
        } else if (userCredential.user) {
          // For "others" role or if no role specified, check existing profile
          const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
          if (userDoc.exists()) {
            const existingData = userDoc.data();
            // Only allow access if user is already admin OR if they're signing in as "others"
            // If user tries to sign in as admin without access code, don't change their role
            if (role === "admin" && existingData.role !== "admin") {
              // User is trying to sign in as admin but their profile is not admin
              // Don't update - they need to use the correct role
              throw new Error("You don't have admin access. Please sign in as 'Others' or contact your administrator.");
            }
          } else {
            // Create profile for "others" role if it doesn't exist
            await setDoc(
              doc(db, "users", userCredential.user.uid),
              {
                email: userCredential.user.email,
                role: "others",
                name: userCredential.user.displayName || userCredential.user.email?.split("@")[0] || "User",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              },
              { merge: true }
            );
          }
        }
      } catch (error: any) {
        // Re-throw with a more user-friendly message
        if (error.message) {
          throw error;
        }
        throw new Error(error.message || "Failed to sign in");
      }
    },
    [loadUserProfile]
  );

  // Sign Up (Create Account)
  // Note: Users can only create "others" role accounts. Admin accounts must be created by developers.
  const signUp = useCallback(
    async (email: string, password: string, role: UserRole, accessCode?: string, name?: string) => {
      try {
        // Prevent users from creating admin accounts through the UI
        // Admin accounts should only be created by developers/admins
        if (role === "admin") {
          throw new Error("Admin accounts cannot be created through registration. Please contact your administrator.");
        }

        // Create new user account
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Create user profile
        if (userCredential.user) {
          const userData: any = {
            email: userCredential.user.email,
            role: role, // Will always be "others" for user-created accounts
            name: name || userCredential.user.email?.split("@")[0] || "User",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          await setDoc(doc(db, "users", userCredential.user.uid), userData, { merge: true });
        }
      } catch (error: any) {
        if (error.code === "auth/email-already-in-use") {
          throw new Error("An account with this email already exists. Please sign in instead.");
        }
        if (error.code === "auth/weak-password") {
          throw new Error("Password should be at least 6 characters");
        }
        if (error.code === "auth/invalid-email") {
          throw new Error("Invalid email address");
        }
        throw new Error(error.message || "Failed to create account");
      }
    },
    []
  );

  // Google sign in
  const signInWithGoogle = useCallback(async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Create or update user profile
      if (result.user) {
        await setDoc(
          doc(db, "users", result.user.uid),
          {
            email: result.user.email,
            name: result.user.displayName || "Google User",
            role: "others", // Default to "others" for Google sign-in
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          { merge: true }
        );
      }
    } catch (error: any) {
      throw new Error(error.message || "Failed to sign in with Google");
    }
  }, []);

  // Phone sign in (send OTP)
  const signInWithPhone = useCallback(async (phone: string): Promise<ConfirmationResult> => {
    try {
      initializeRecaptcha();
      const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier!);
      return confirmationResult;
    } catch (error: any) {
      throw new Error(error.message || "Failed to send OTP");
    }
  }, []);

  // Verify phone OTP
  const verifyPhoneOTP = useCallback(
    async (confirmationResult: ConfirmationResult, otp: string) => {
      try {
        await confirmationResult.confirm(otp);
        // User profile will be created/updated in onAuthStateChanged
      } catch (error: any) {
        throw new Error(error.message || "Invalid OTP");
      }
    },
    []
  );

  // Sign out
  const handleSignOut = useCallback(async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
    } catch (error: any) {
      throw new Error(error.message || "Failed to sign out");
    }
  }, []);

  // Reset password
  const resetPassword = useCallback(async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw new Error(error.message || "Failed to send password reset email");
    }
  }, []);

  const value: AuthContextValue = {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithPhone,
    verifyPhoneOTP,
    signOut: handleSignOut,
    resetPassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

