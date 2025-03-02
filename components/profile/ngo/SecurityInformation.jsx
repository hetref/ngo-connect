import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Lock, AlertCircle, CheckCircle, Mail, X } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import {
  getAuth,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  multiFactor,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  RecaptchaVerifier,
  sendEmailVerification,
  signInWithEmailAndPassword,
  getMultiFactorResolver,
  sendPasswordResetEmail,
} from "firebase/auth";
import toast from "react-hot-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SecurityInformation = () => {
  // Password reset states
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [passwordResetSuccess, setPasswordResetSuccess] = useState("");
  const [passwordResetError, setPasswordResetError] = useState("");

  // Re-authentication modal states
  const [showReauthModal, setShowReauthModal] = useState(false);
  const [reauthEmail, setReauthEmail] = useState("");
  const [reauthPassword, setReauthPassword] = useState("");
  const [isReauthenticating, setIsReauthenticating] = useState(false);
  const [reauthError, setReauthError] = useState("");
  const [pendingAction, setPendingAction] = useState(null);

  // Email verification states
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  // 2FA states
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [isEnabling2FA, setIsEnabling2FA] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [step2FA, setStep2FA] = useState("initial"); // initial, phone, verification, complete

  // MFA verification states
  const [showMFAVerificationModal, setShowMFAVerificationModal] =
    useState(false);
  const [mfaVerificationCode, setMFAVerificationCode] = useState("");
  const [isMFAVerifying, setIsMFAVerifying] = useState(false);
  const [mfaResolver, setMFAResolver] = useState(null);
  const [mfaError, setMFAError] = useState("");
  const [mfaVerificationId, setMfaVerificationId] = useState("");

  // Reference to store the recaptcha verifier instance
  const recaptchaVerifierRef = useRef(null);
  // Reference to the recaptcha container
  const recaptchaContainerRef = useRef(null);

  const auth = getAuth();
  const user = auth.currentUser;

  // Check if 2FA is already enabled and email verification status
  useEffect(() => {
    if (user) {
      const multiFactorUser = multiFactor(user);
      setIs2FAEnabled(multiFactorUser.enrolledFactors.length > 0);
      setEmailVerified(user.emailVerified);
      setReauthEmail(user.email || "");
    }
  }, [user]);

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
    if (!user || !user.email) {
      toast.error("No user email found");
      return;
    }

    setIsResettingPassword(true);
    setPasswordResetError("");
    setPasswordResetSuccess("");

    try {
      await sendPasswordResetEmail(auth, user.email);
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
        await reauthenticateWithCredential(user, credential);

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

  const sendVerificationEmail = async () => {
    if (!user) {
      toast.error("You must be logged in to verify your email");
      return;
    }

    setIsSendingVerification(true);
    try {
      await sendEmailVerification(user);
      toast.success("Verification email sent! Please check your inbox.");
    } catch (error) {
      console.error("Error sending verification email:", error);

      if (error.code === "auth/too-many-requests") {
        toast.error("Too many attempts. Please try again later.");
      } else {
        toast.error(error.message || "Failed to send verification email");
      }
    } finally {
      setIsSendingVerification(false);
    }
  };

  // Refresh email verification status
  const checkEmailVerification = async () => {
    if (!user) return;

    try {
      // Reload the user to get the latest emailVerified status
      await user.reload();
      setEmailVerified(user.emailVerified);

      if (user.emailVerified) {
        toast.success("Your email has been verified!");
      }
    } catch (error) {
      console.error("Error checking email verification status:", error);
    }
  };

  const initiate2FA = async () => {
    try {
      if (!user) {
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

      if (!user) {
        throw new Error("You must be logged in to enable 2FA");
      }

      // Setup reCAPTCHA
      const recaptchaSetup = setupRecaptcha();
      if (!recaptchaSetup) {
        throw new Error("Failed to set up reCAPTCHA verification");
      }

      // Get multiFactor session
      const multiFactorUser = multiFactor(user);
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

      if (!user) {
        throw new Error("You must be logged in to enable 2FA");
      }

      // Create credential
      const cred = PhoneAuthProvider.credential(
        verificationId,
        verificationCode
      );
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);

      // Enroll the second factor
      const multiFactorUser = multiFactor(user);
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

  const disable2FA = async () => {
    try {
      setIsEnabling2FA(true);

      if (!user) {
        throw new Error("You must be logged in to disable 2FA");
      }

      const multiFactorUser = multiFactor(user);

      if (multiFactorUser.enrolledFactors.length > 0) {
        // Unenroll the first enrolled factor (usually there's only one)
        await multiFactorUser.unenroll(multiFactorUser.enrolledFactors[0]);
        setIs2FAEnabled(false);
        setStep2FA("initial");
        toast.success("Two-factor authentication disabled successfully!");
      }
    } catch (error) {
      console.error("Error disabling 2FA:", error);

      if (error.code === "auth/requires-recent-login") {
        // Show re-authentication modal
        setPendingAction("disable2FA");
        setShowReauthModal(true);
      } else {
        toast.error(error.message || "Failed to disable 2FA");
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

        // After successful MFA verification, update the password directly
        if (pendingAction === "changePassword") {
          try {
            // Get the current user (should be freshly authenticated after MFA)
            const currentUser = auth.currentUser;

            if (currentUser && verificationCode) {
              // Update the password
              await updatePassword(currentUser, verificationCode);

              // Clear form and show success
              setVerificationCode("");
              setPasswordResetSuccess("Password updated successfully!");
              toast.success("Password updated successfully!");
            }
          } catch (passwordError) {
            console.error("Error updating password after MFA:", passwordError);
            setPasswordResetError(
              passwordError.message || "Failed to update password"
            );
            toast.error(passwordError.message || "Failed to update password");
          }
        } else if (pendingAction === "enable2FA") {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security & Privacy</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Email Verification Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Email Verification</h3>

          {user && (
            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-2">
                <div
                  className={`p-1 rounded-full ${emailVerified ? "bg-green-100" : "bg-yellow-100"}`}
                >
                  <CheckCircle
                    className={`h-5 w-5 ${emailVerified ? "text-green-500" : "text-yellow-500"}`}
                  />
                </div>
                <span>
                  {emailVerified
                    ? `Your email (${user.email}) is verified`
                    : `Your email (${user.email}) is not verified`}
                </span>
              </div>

              {!emailVerified && (
                <div className="flex flex-col space-y-2">
                  <Alert className="bg-yellow-50 border-yellow-200">
                    <AlertDescription className="text-yellow-700">
                      Please verify your email address to enhance your account
                      security.
                    </AlertDescription>
                  </Alert>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      className="flex items-center space-x-2"
                      onClick={sendVerificationEmail}
                      disabled={isSendingVerification}
                    >
                      <Mail className="h-4 w-4" />
                      <span>
                        {isSendingVerification
                          ? "Sending..."
                          : "Send Verification Email"}
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={checkEmailVerification}
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
              Click the button below to receive a password reset link via email.
              The link will allow you to set a new password.
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
                Your account is protected with two-factor authentication. You'll
                need to provide a verification code from your phone when signing
                in.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="space-y-2">
          <Label>Data Access Logs</Label>
          <Button variant="outline">
            <Lock className="mr-2 h-4 w-4" /> View Access Logs
          </Button>
        </div>
      </CardContent>

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
                disabled={!!user?.email}
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
    </Card>
  );
};

export default SecurityInformation;
