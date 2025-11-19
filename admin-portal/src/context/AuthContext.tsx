import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  User,
  signInWithEmailAndPassword,
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
        // Validate access code for admin (check in Firestore)
        if (role === "admin" && accessCode) {
          const accessCodeDoc = await getDoc(doc(db, "accessCodes", accessCode.toUpperCase()));
          if (!accessCodeDoc.exists()) {
            throw new Error("Invalid access code");
          }
          const codeData = accessCodeDoc.data();
          if (!codeData.active) {
            throw new Error("Access code is inactive");
          }
        }

        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // Update user profile with role and access code if admin
        if (userCredential.user && role === "admin" && accessCode) {
          await setDoc(
            doc(db, "users", userCredential.user.uid),
            {
              role: "admin",
              accessCode: accessCode.toUpperCase(),
              collegeId: accessCode.toUpperCase(),
              updatedAt: new Date().toISOString()
            },
            { merge: true }
          );
        }
      } catch (error: any) {
        throw new Error(error.message || "Failed to sign in");
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

