"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Upload,
  MapPin,
  AlertCircle,
  CheckCircle,
  Mail,
  Lock,
  Shield,
  X,
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  setDoc,
} from "firebase/firestore";
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendEmailVerification,
  verifyBeforeUpdateEmail,
  multiFactor,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  RecaptchaVerifier,
  sendPasswordResetEmail,
  getMultiFactorResolver,
} from "firebase/auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import toast from "react-hot-toast";

export default function MemberProfile() {
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  // Security related states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Email verification states
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [isChangingEmail, setIsChangingEmail] = useState(false);

  // 2FA states
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [isEnabling2FA, setIsEnabling2FA] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [recaptchaVerifier, setRecaptchaVerifier] = useState(null);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const recaptchaContainerRef = useRef(null);

  // Security related states from SecurityInformation.jsx
  const [passwordResetSuccess, setPasswordResetSuccess] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [passwordResetError, setPasswordResetError] = useState("");

  // Re-authentication modal states
  const [showReauthModal, setShowReauthModal] = useState(false);
  const [reauthEmail, setReauthEmail] = useState("");
  const [reauthPassword, setReauthPassword] = useState("");
  const [isReauthenticating, setIsReauthenticating] = useState(false);
  const [reauthError, setReauthError] = useState("");
  const [pendingAction, setPendingAction] = useState(null);

  // 2FA states with updated naming
  const [step2FA, setStep2FA] = useState("initial"); // initial, phone, verification, complete

  // MFA verification states
  const [showMFAVerificationModal, setShowMFAVerificationModal] =
    useState(false);
  const [mfaVerificationCode, setMFAVerificationCode] = useState("");
  const [isMFAVerifying, setIsMFAVerifying] = useState(false);
  const [mfaResolver, setMFAResolver] = useState(null);
  const [mfaError, setMFAError] = useState("");
  const [mfaVerificationId, setMfaVerificationId] = useState("");

  // Reference for recaptcha
  const recaptchaVerifierRef = useRef(null);

  const [userProfile, setUserProfile] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    ngoId: "",
    ngoName: "",
    accessLevel: "",
    memberId: "",
  });

  const [donations, setDonations] = useState([]);

  const fetchDonations = async (ngoId) => {
    try {
      console.log("Fetching donations for NGO:", ngoId);
      // For members, we'll show donations to their NGO
      const donationsRef = collection(db, "users", userId, "donatedTo");
      const querySnapshot = await getDocs(donationsRef);
      const userDonations = [];

      for (const docSnapshot of querySnapshot.docs) {
        const donation = docSnapshot.data();

        // Only include donations to the member's NGO
        if (docSnapshot.id === ngoId) {
          try {
            const ngoDocRef = doc(db, "ngo", ngoId);
            const ngoDoc = await getDoc(ngoDocRef);
            const ngoData = ngoDoc.exists() ? ngoDoc.data() : null;

            // Format the timestamp
            const formattedDate = new Date(
              donation.timestamp
            ).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            });

            userDonations.push({
              id: docSnapshot.id,
              ...donation,
              ngoName: ngoData?.ngoName || "Unknown NGO",
              formattedDate,
            });
          } catch (error) {
            console.error("Error fetching NGO details:", error);
          }
        }
      }

      setDonations(userDonations);
    } catch (error) {
      console.error("Error fetching donations:", error);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        setUserId(currentUser.uid);

        // Set email verification status
        setIsEmailVerified(currentUser.emailVerified);

        // Set reauthEmail for re-authentication modal
        setReauthEmail(currentUser.email || "");

        try {
          // Get user data
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserData(userData);

            // Set basic profile info
            setUserProfile((prev) => ({
              ...prev,
              name: userData.name || userData.displayName || "",
              email: currentUser.email || "",
              phone: userData.phone || "",
              address: userData.address || "",
              ngoId: userData.ngoId || "",
              accessLevel: userData.accessLevel || "",
              memberId: userData.memberId || "",
            }));

            // Set 2FA status if available
            setIs2FAEnabled(userData.is2FAEnabled || false);
            setPhoneNumber(userData.phoneFor2FA || "");

            // If we have an NGO ID, fetch the NGO name
            if (userData.ngoId) {
              const ngoDocRef = doc(db, "ngo", userData.ngoId);
              const ngoDoc = await getDoc(ngoDocRef);

              if (ngoDoc.exists()) {
                const ngoData = ngoDoc.data();
                setUserProfile((prev) => ({
                  ...prev,
                  ngoName: ngoData.ngoName || "Unknown NGO",
                }));
              }

              // Fetch donations to this NGO
              await fetchDonations(userData.ngoId);
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleProfileUpdate = async () => {
    if (!userId) return;

    try {
      const userDocRef = doc(db, "users", userId);
      await updateDoc(userDocRef, {
        name: userProfile.name,
        phone: userProfile.phone,
        address: userProfile.address,
      });

      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    }
  };

  // Password reset functionality
  const handlePasswordChange = async () => {
    // Reset states
    setPasswordError("");
    setPasswordSuccess("");
    setIsChangingPassword(true);

    try {
      // Validate passwords
      if (newPassword !== confirmPassword) {
        setPasswordError("New passwords don't match");
        setIsChangingPassword(false);
        return;
      }

      if (newPassword.length < 8) {
        setPasswordError("Password must be at least 8 characters long");
        setIsChangingPassword(false);
        return;
      }

      const currentUser = auth.currentUser;

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      );

      await reauthenticateWithCredential(currentUser, credential);

      // Update password
      await updatePassword(currentUser, newPassword);

      // Clear form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setPasswordSuccess("Password updated successfully");
      toast.success("Password updated successfully");
    } catch (error) {
      console.error("Error updating password:", error);

      if (error.code === "auth/wrong-password") {
        setPasswordError("Current password is incorrect");
      } else if (error.code === "auth/weak-password") {
        setPasswordError("Password is too weak");
      } else {
        setPasswordError("Failed to update password: " + error.message);
      }

      toast.error("Failed to update password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Email verification functionality
  const handleSendVerificationEmail = async () => {
    if (!auth.currentUser) {
      toast.error("You must be logged in to verify your email");
      return;
    }

    setIsVerificationSent(true);
    try {
      await sendEmailVerification(auth.currentUser);
      toast.success("Verification email sent! Please check your inbox.");
    } catch (error) {
      console.error("Error sending verification email:", error);

      if (error.code === "auth/too-many-requests") {
        toast.error("Too many attempts. Please try again later.");
      } else {
        toast.error(error.message || "Failed to send verification email");
      }
    } finally {
      setIsVerificationSent(false);
    }
  };

  const handleUpdateEmail = async () => {
    setIsChangingEmail(true);

    try {
      const currentUser = auth.currentUser;

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmail)) {
        toast.error("Please enter a valid email address");
        setIsChangingEmail(false);
        return;
      }

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      );

      await reauthenticateWithCredential(currentUser, credential);

      // Update email
      await verifyBeforeUpdateEmail(currentUser, newEmail);

      toast.success(
        "Verification email sent to your new email address. Please check your inbox and verify to complete the change."
      );
      setNewEmail("");
    } catch (error) {
      console.error("Error updating email:", error);

      if (error.code === "auth/wrong-password") {
        toast.error("Current password is incorrect");
      } else if (error.code === "auth/email-already-in-use") {
        toast.error("Email is already in use by another account");
      } else {
        toast.error("Failed to update email: " + error.message);
      }
    } finally {
      setIsChangingEmail(false);
    }
  };

  // 2FA functionality
  const setup2FA = async () => {
    setIsEnabling2FA(true);

    try {
      const currentUser = auth.currentUser;

      // Initialize RecaptchaVerifier if not already done
      if (!recaptchaVerifier) {
        const verifier = new RecaptchaVerifier(
          auth,
          recaptchaContainerRef.current,
          {
            size: "invisible",
            callback: () => {
              // reCAPTCHA solved, allow sign-in
            },
          }
        );
        setRecaptchaVerifier(verifier);
      }

      // Format phone number (ensure it has country code)
      const formattedPhone = phoneNumber.startsWith("+")
        ? phoneNumber
        : `+91${phoneNumber}`;

      // Get multifactor session
      const multiFactorUser = multiFactor(currentUser);
      const multiFactorSession = await multiFactorUser.getSession();

      // Send verification code
      const phoneInfoOptions = {
        phoneNumber: formattedPhone,
        session: multiFactorSession,
      };

      const phoneAuthProvider = new PhoneAuthProvider(auth);
      const verificationId = await phoneAuthProvider.verifyPhoneNumber(
        phoneInfoOptions,
        recaptchaVerifier
      );

      setVerificationId(verificationId);
      setShowVerificationDialog(true);
      toast.success("Verification code sent to your phone");
    } catch (error) {
      console.error("Error setting up 2FA:", error);
      toast.error("Failed to set up 2FA: " + error.message);
    } finally {
      setIsEnabling2FA(false);
    }
  };

  const verifyAndEnroll2FA = async () => {
    try {
      const currentUser = auth.currentUser;

      // Create credential with the verification ID and code
      const cred = PhoneAuthProvider.credential(
        verificationId,
        verificationCode
      );
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);

      // Enroll the second factor
      const multiFactorUser = multiFactor(currentUser);
      await multiFactorUser.enroll(multiFactorAssertion, "Phone Number");

      // Update user document to reflect 2FA status
      const userDocRef = doc(db, "users", userId);
      await updateDoc(userDocRef, {
        is2FAEnabled: true,
        phoneFor2FA: phoneNumber,
      });

      setIs2FAEnabled(true);
      setShowVerificationDialog(false);
      toast.success("Two-factor authentication enabled successfully");
    } catch (error) {
      console.error("Error verifying 2FA:", error);
      toast.error("Failed to verify code: " + error.message);
    }
  };

  const disable2FA = async () => {
    try {
      const currentUser = auth.currentUser;
      const confirmation = confirm(
        "Are you sure you want to disable two-factor authentication? This will make your account less secure."
      );

      if (confirmation) {
        const multiFactorUser = multiFactor(currentUser);

        // Get enrolled factors
        const enrolledFactors = multiFactorUser.enrolledFactors;

        if (enrolledFactors.length > 0) {
          // Unenroll the first factor (assuming there's only one)
          await multiFactorUser.unenroll(enrolledFactors[0]);

          // Update user document
          const userDocRef = doc(db, "users", userId);
          await updateDoc(userDocRef, {
            is2FAEnabled: false,
            phoneFor2FA: null,
          });

          setIs2FAEnabled(false);
          toast.success("Two-factor authentication disabled");
        }
      }
    } catch (error) {
      console.error("Error disabling 2FA:", error);
      toast.error("Failed to disable 2FA: " + error.message);
    }
  };

  // Clean up reCAPTCHA when component unmounts or when step changes
  useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    };
  }, []);

  // Reset reCAPTCHA when step changes
  useEffect(() => {
    if (step2FA !== "phone" && recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current.clear();
      recaptchaVerifierRef.current = null;
    }
  }, [step2FA]);

  // Handle password reset
  const handlePasswordReset = async () => {
    if (!auth.currentUser || !auth.currentUser.email) {
      toast.error("No user email found");
      return;
    }

    setIsResettingPassword(true);
    setPasswordResetError("");
    setPasswordResetSuccess("");

    try {
      await sendPasswordResetEmail(auth, auth.currentUser.email);
      setPasswordResetSuccess(
        "Password reset email sent! Please check your inbox."
      );
      toast.success("Password reset email sent! Please check your inbox.");
    } catch (error) {
      console.error("Error sending password reset email:", error);
      setPasswordResetError(
        error.message || "Failed to send password reset email"
      );
      toast.error(error.message || "Failed to send password reset email");
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleReauthenticate = async () => {
    setReauthError("");
    setIsReauthenticating(true);

    try {
      if (!reauthEmail || !reauthPassword) {
        throw new Error("Email and password are required");
      }

      try {
        // Re-authenticate the user
        const credential = EmailAuthProvider.credential(
          reauthEmail,
          reauthPassword
        );
        await reauthenticateWithCredential(auth.currentUser, credential);

        // Close the modal
        setShowReauthModal(false);
        setReauthPassword("");

        // Execute the pending action
        if (pendingAction === "enable2FA") {
          initiate2FA();
        } else if (pendingAction === "disable2FA") {
          await disable2FA();
        }

        // Clear the pending action
        setPendingAction(null);
      } catch (error) {
        // Check if this is a multi-factor auth required error
        if (error.code === "auth/multi-factor-auth-required") {
          try {
            // Get the resolver
            const resolver = getMultiFactorResolver(auth, error);
            setMFAResolver(resolver);

            // We need to create a new RecaptchaVerifier for each MFA attempt
            if (recaptchaVerifierRef.current) {
              recaptchaVerifierRef.current.clear();
              recaptchaVerifierRef.current = null;
            }

            // Create a new RecaptchaVerifier
            recaptchaVerifierRef.current = new RecaptchaVerifier(
              auth,
              "recaptcha-container",
              {
                size: "invisible",
                callback: () => {
                  console.log("reCAPTCHA solved");
                },
              }
            );

            // Get the first hint (usually there's only one)
            const hint = resolver.hints[0];

            // Get the phone auth provider
            const phoneAuthProvider = new PhoneAuthProvider(auth);

            // Send verification code to the user's phone
            const verificationId = await phoneAuthProvider.verifyPhoneNumber(
              {
                multiFactorHint: hint,
                session: resolver.session,
              },
              recaptchaVerifierRef.current
            );

            // Store the verification ID
            setMfaVerificationId(verificationId);

            // Show MFA verification modal
            setShowMFAVerificationModal(true);
            setShowReauthModal(false); // Hide the reauthentication modal

            toast.success("Verification code sent to your phone");
          } catch (mfaError) {
            console.error("Error setting up MFA verification:", mfaError);
            setReauthError(mfaError.message || "Failed to set up verification");
          }
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error("Re-authentication error:", error);

      if (error.code === "auth/wrong-password") {
        setReauthError("Incorrect password");
      } else if (error.code === "auth/too-many-requests") {
        setReauthError("Too many attempts. Please try again later");
      } else if (error.code === "auth/user-mismatch") {
        setReauthError(
          "The provided credentials do not match the current user"
        );
      } else {
        setReauthError(error.message || "Failed to re-authenticate");
      }
    } finally {
      setIsReauthenticating(false);
    }
  };

  const initiate2FA = async () => {
    try {
      if (!auth.currentUser) {
        throw new Error("You must be logged in to enable 2FA");
      }

      setStep2FA("phone");
    } catch (error) {
      if (error.code === "auth/requires-recent-login") {
        // Show re-authentication modal
        setPendingAction("enable2FA");
        setShowReauthModal(true);
      } else {
        toast.error(error.message || "Failed to start 2FA setup");
      }
    }
  };

  const setupRecaptcha = () => {
    // Clear any existing reCAPTCHA instance
    if (recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current.clear();
      recaptchaVerifierRef.current = null;
    }

    // Make sure the container exists
    if (!recaptchaContainerRef.current) {
      toast.error("reCAPTCHA container not found");
      return false;
    }

    try {
      // Create a new reCAPTCHA verifier
      recaptchaVerifierRef.current = new RecaptchaVerifier(
        auth,
        recaptchaContainerRef.current,
        {
          size: "normal",
          callback: () => {
            // reCAPTCHA solved, allow sending verification code
            console.log("reCAPTCHA verified");
          },
          "expired-callback": () => {
            // Reset reCAPTCHA
            toast.error("reCAPTCHA expired. Please try again.");
            if (recaptchaVerifierRef.current) {
              recaptchaVerifierRef.current.clear();
              recaptchaVerifierRef.current = null;
              setupRecaptcha(); // Recreate it
            }
          },
        }
      );

      // Render the reCAPTCHA
      recaptchaVerifierRef.current.render();
      return true;
    } catch (error) {
      console.error("Error setting up reCAPTCHA:", error);
      toast.error("Failed to set up verification. Please try again.");
      return false;
    }
  };

  const sendVerificationCode = async () => {
    try {
      if (!phoneNumber || !phoneNumber.match(/^\+[1-9]\d{1,14}$/)) {
        throw new Error(
          "Please enter a valid phone number with country code (e.g., +1234567890)"
        );
      }

      setIsEnabling2FA(true);

      if (!auth.currentUser) {
        throw new Error("You must be logged in to enable 2FA");
      }

      // Setup reCAPTCHA
      const recaptchaSetup = setupRecaptcha();
      if (!recaptchaSetup) {
        throw new Error("Failed to set up reCAPTCHA verification");
      }

      // Get multiFactor session
      const multiFactorUser = multiFactor(auth.currentUser);
      const multiFactorSession = await multiFactorUser.getSession();

      // Send verification code
      const phoneInfoOptions = {
        phoneNumber: phoneNumber,
        session: multiFactorSession,
      };

      const phoneAuthProvider = new PhoneAuthProvider(auth);
      const verificationId = await phoneAuthProvider.verifyPhoneNumber(
        phoneInfoOptions,
        recaptchaVerifierRef.current
      );

      setVerificationId(verificationId);
      setStep2FA("verification");
      toast.success("Verification code sent to your phone");
    } catch (error) {
      console.error("Error sending verification code:", error);

      if (error.code === "auth/requires-recent-login") {
        // Show re-authentication modal
        setPendingAction("enable2FA");
        setShowReauthModal(true);
      } else {
        toast.error(error.message || "Failed to send verification code");
      }
    } finally {
      setIsEnabling2FA(false);
    }
  };

  const verifyAndEnroll = async () => {
    try {
      if (!verificationCode || verificationCode.length < 6) {
        throw new Error("Please enter a valid verification code");
      }

      setIsEnabling2FA(true);

      if (!auth.currentUser) {
        throw new Error("You must be logged in to enable 2FA");
      }

      // Create credential
      const cred = PhoneAuthProvider.credential(
        verificationId,
        verificationCode
      );
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);

      // Enroll the second factor
      const multiFactorUser = multiFactor(auth.currentUser);
      await multiFactorUser.enroll(multiFactorAssertion, "Phone Number");

      setIs2FAEnabled(true);
      setStep2FA("complete");
      toast.success("Two-factor authentication enabled successfully!");
    } catch (error) {
      console.error("Error verifying code:", error);

      if (error.code === "auth/requires-recent-login") {
        // Show re-authentication modal
        setPendingAction("enable2FA");
        setShowReauthModal(true);
        setStep2FA("initial"); // Reset the step
      } else {
        toast.error(error.message || "Failed to verify code");
      }
    } finally {
      setIsEnabling2FA(false);
    }
  };

  const handle2FAToggle = () => {
    if (is2FAEnabled) {
      disable2FA();
    } else {
      initiate2FA();
    }
  };

  // Handle MFA verification
  const handleMFAVerification = async () => {
    setMFAError("");
    setIsMFAVerifying(true);

    try {
      if (!mfaVerificationCode || mfaVerificationCode.length < 6) {
        throw new Error("Please enter a valid verification code");
      }

      if (!mfaResolver) {
        throw new Error("MFA resolver not found");
      }

      if (!mfaVerificationId) {
        throw new Error("Verification ID not found. Please try again.");
      }

      try {
        // Create a PhoneAuthCredential with the verification ID and code
        const credential = PhoneAuthProvider.credential(
          mfaVerificationId,
          mfaVerificationCode
        );

        // Create a multi-factor assertion
        const multiFactorAssertion =
          PhoneMultiFactorGenerator.assertion(credential);

        // Complete the sign-in
        await mfaResolver.resolveSignIn(multiFactorAssertion);

        // Close the modal
        setShowMFAVerificationModal(false);
        setMFAVerificationCode("");
        setMfaVerificationId("");

        // After successful MFA verification, execute the pending action
        if (pendingAction === "enable2FA") {
          initiate2FA();
        } else if (pendingAction === "disable2FA") {
          await disable2FA();
        }

        // Clear the pending action
        setPendingAction(null);
      } catch (error) {
        console.error("Error resolving MFA:", error);
        if (error.code === "auth/invalid-verification-code") {
          setMFAError("Invalid verification code. Please try again.");
        } else if (error.code === "auth/argument-error") {
          setMFAError(
            "Invalid verification information. Please try again from the beginning."
          );
          // Reset the MFA flow
          setTimeout(() => {
            setShowMFAVerificationModal(false);
            setPendingAction(null);
            setMfaVerificationId("");
            setMFAVerificationCode("");
            if (recaptchaVerifierRef.current) {
              recaptchaVerifierRef.current.clear();
              recaptchaVerifierRef.current = null;
            }
          }, 3000);
        } else {
          setMFAError(error.message || "Failed to verify code");
        }
      }
    } catch (error) {
      console.error("MFA verification error:", error);
      setMFAError(error.message || "Failed to verify code");
    } finally {
      setIsMFAVerifying(false);
    }
  };

  if (isLoading) {
    return <div className="container mx-auto p-4">Loading user data...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-4 space-y-8"
    >
      <h1 className="text-3xl font-bold mb-8">Member Profile</h1>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="ngo-info">NGO Information</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Personal Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage
                    src="/placeholder.svg?height=80&width=80"
                    alt="Profile Picture"
                  />
                  <AvatarFallback>
                    {userProfile.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("") || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" /> Upload Picture
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={userProfile.name}
                    onChange={(e) =>
                      setUserProfile({ ...userProfile, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userProfile.email}
                    onChange={(e) =>
                      setUserProfile({ ...userProfile, email: e.target.value })
                    }
                    disabled // Email should be changed through Firebase Auth
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={userProfile.phone}
                    onChange={(e) =>
                      setUserProfile({ ...userProfile, phone: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={userProfile.address}
                    onChange={(e) =>
                      setUserProfile({
                        ...userProfile,
                        address: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <Button
                className="w-full md:w-auto bg-[#1CAC78] hover:bg-[#158f63]"
                onClick={handleProfileUpdate}
              >
                Save Profile Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ngo-info">
          <Card>
            <CardHeader>
              <CardTitle>NGO Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ngoName">NGO Name</Label>
                  <Input id="ngoName" value={userProfile.ngoName} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ngoId">NGO ID</Label>
                  <Input id="ngoId" value={userProfile.ngoId} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="memberId">Member ID</Label>
                  <Input id="memberId" value={userProfile.memberId} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accessLevel">Access Level</Label>
                  <Input
                    id="accessLevel"
                    value={
                      userProfile.accessLevel === "level1"
                        ? "Level 1 (Basic)"
                        : userProfile.accessLevel === "level2"
                          ? "Level 2 (Advanced)"
                          : userProfile.accessLevel
                    }
                    disabled
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security & Privacy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Email Verification Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Email Verification</h3>

                {auth.currentUser && (
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`p-1 rounded-full ${isEmailVerified ? "bg-green-100" : "bg-yellow-100"}`}
                      >
                        <CheckCircle
                          className={`h-5 w-5 ${isEmailVerified ? "text-green-500" : "text-yellow-500"}`}
                        />
                      </div>
                      <span>
                        {isEmailVerified
                          ? `Your email (${userProfile.email}) is verified`
                          : `Your email (${userProfile.email}) is not verified`}
                      </span>
                    </div>

                    {!isEmailVerified && (
                      <div className="flex flex-col space-y-2">
                        <Alert className="bg-yellow-50 border-yellow-200">
                          <AlertDescription className="text-yellow-700">
                            Please verify your email address to enhance your
                            account security.
                          </AlertDescription>
                        </Alert>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            className="flex items-center space-x-2"
                            onClick={handleSendVerificationEmail}
                            disabled={isVerificationSent}
                          >
                            <Mail className="h-4 w-4" />
                            <span>
                              {isVerificationSent
                                ? "Sending..."
                                : "Send Verification Email"}
                            </span>
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => {
                              const currentUser = auth.currentUser;
                              if (currentUser) {
                                currentUser.reload().then(() => {
                                  setIsEmailVerified(currentUser.emailVerified);
                                  if (currentUser.emailVerified) {
                                    toast.success(
                                      "Your email has been verified!"
                                    );
                                  }
                                });
                              }
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            I've verified my email
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <hr className="my-6" />

              {/* Password Reset Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Password Reset</h3>

                {passwordResetError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{passwordResetError}</AlertDescription>
                  </Alert>
                )}

                {passwordResetSuccess && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <AlertTitle className="text-green-700">Success</AlertTitle>
                    <AlertDescription className="text-green-700">
                      {passwordResetSuccess}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Click the button below to receive a password reset link via
                    email. The link will allow you to set a new password.
                  </p>
                  <Button
                    className="w-full md:w-auto bg-[#1CAC78] hover:bg-[#158f63] flex items-center space-x-2"
                    onClick={handlePasswordReset}
                    disabled={isResettingPassword}
                  >
                    <Mail className="h-4 w-4" />
                    <span>
                      {isResettingPassword ? "Sending..." : "Reset Password"}
                    </span>
                  </Button>
                </div>
              </div>

              <hr className="my-6" />

              {/* 2FA Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">
                  Two-Factor Authentication (2FA)
                </h3>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="two-factor-auth"
                    className="border-gray-300"
                    checked={is2FAEnabled}
                    onCheckedChange={handle2FAToggle}
                    disabled={
                      isEnabling2FA ||
                      (step2FA !== "initial" && step2FA !== "complete")
                    }
                  />
                  <Label htmlFor="two-factor-auth">
                    {is2FAEnabled
                      ? "Two-Factor Authentication is Enabled"
                      : "Enable Two-Factor Authentication (2FA)"}
                  </Label>
                </div>

                {step2FA === "phone" && (
                  <div className="space-y-4 p-4 border rounded-md">
                    <Label htmlFor="phone-number">
                      Enter your phone number with country code
                    </Label>
                    <Input
                      id="phone-number"
                      type="tel"
                      placeholder="+1234567890"
                      className="border-gray-300"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                    <div
                      className="recaptcha-container"
                      ref={recaptchaContainerRef}
                    ></div>
                    <Button
                      onClick={sendVerificationCode}
                      disabled={isEnabling2FA}
                      className="bg-[#1CAC78] hover:bg-[#158f63]"
                    >
                      {isEnabling2FA ? "Sending..." : "Send Verification Code"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setStep2FA("initial")}
                      disabled={isEnabling2FA}
                    >
                      Cancel
                    </Button>
                  </div>
                )}

                {step2FA === "verification" && (
                  <div className="space-y-4 p-4 border rounded-md">
                    <Label htmlFor="verification-code">
                      Enter the verification code sent to your phone
                    </Label>
                    <Input
                      id="verification-code"
                      type="text"
                      placeholder="123456"
                      className="border-gray-300"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                    />
                    <Button
                      onClick={verifyAndEnroll}
                      disabled={isEnabling2FA}
                      className="bg-[#1CAC78] hover:bg-[#158f63]"
                    >
                      {isEnabling2FA ? "Verifying..." : "Verify and Enable 2FA"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setStep2FA("phone")}
                      disabled={isEnabling2FA}
                    >
                      Back
                    </Button>
                  </div>
                )}

                {is2FAEnabled && (
                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertDescription className="text-blue-700">
                      Your account is protected with two-factor authentication.
                      You'll need to provide a verification code from your phone
                      when signing in.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <hr className="my-6" />

              {/* Data Access Logs Section */}
              <div className="space-y-2">
                <Label>Data Access Logs</Label>
                <Button variant="outline">
                  <Lock className="mr-2 h-4 w-4" /> View Access Logs
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 2FA Verification Dialog */}
      <Dialog
        open={showVerificationDialog}
        onOpenChange={setShowVerificationDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Your Phone Number</DialogTitle>
            <DialogDescription>
              Enter the 6-digit verification code sent to {phoneNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Verification code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowVerificationDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={verifyAndEnroll2FA}
              disabled={!verificationCode || verificationCode.length < 6}
              className="bg-[#1CAC78] hover:bg-[#158f63]"
            >
              Verify & Enable 2FA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Re-authentication Modal */}
      <Dialog open={showReauthModal} onOpenChange={setShowReauthModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Re-authenticate Required</DialogTitle>
            <DialogDescription>
              For security reasons, please re-enter your password to continue.
            </DialogDescription>
          </DialogHeader>

          {reauthError && (
            <Alert variant="destructive" className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{reauthError}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="reauth-email">Email</Label>
              <Input
                id="reauth-email"
                value={reauthEmail}
                onChange={(e) => setReauthEmail(e.target.value)}
                disabled={!!auth.currentUser?.email}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reauth-password">Password</Label>
              <Input
                id="reauth-password"
                type="password"
                value={reauthPassword}
                onChange={(e) => setReauthPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowReauthModal(false);
                setPendingAction(null);
              }}
              disabled={isReauthenticating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReauthenticate}
              disabled={isReauthenticating}
              className="bg-[#1CAC78] hover:bg-[#158f63]"
            >
              {isReauthenticating ? "Authenticating..." : "Authenticate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MFA Verification Modal */}
      <Dialog
        open={showMFAVerificationModal}
        onOpenChange={setShowMFAVerificationModal}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Two-Factor Authentication Required</DialogTitle>
            <DialogDescription>
              Please enter the verification code sent to your phone.
            </DialogDescription>
          </DialogHeader>

          {mfaError && (
            <Alert variant="destructive" className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{mfaError}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="mfa-code">Verification Code</Label>
              <Input
                id="mfa-code"
                type="text"
                value={mfaVerificationCode}
                onChange={(e) => setMFAVerificationCode(e.target.value)}
                placeholder="Enter the 6-digit code"
              />
            </div>
            {/* Hidden recaptcha container for MFA verification */}
            <div id="recaptcha-container" style={{ display: "none" }}></div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowMFAVerificationModal(false);
                setPendingAction(null);
                setMfaVerificationId("");
                setMFAVerificationCode("");
                if (recaptchaVerifierRef.current) {
                  recaptchaVerifierRef.current.clear();
                  recaptchaVerifierRef.current = null;
                }
              }}
              disabled={isMFAVerifying}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMFAVerification}
              disabled={isMFAVerifying}
              className="bg-[#1CAC78] hover:bg-[#158f63]"
            >
              {isMFAVerifying ? "Verifying..." : "Verify"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
