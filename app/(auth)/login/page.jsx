"use client";

import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import {
  signInWithEmailAndPassword,
  getMultiFactorResolver,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  RecaptchaVerifier,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // MFA states
  const [showMFADialog, setShowMFADialog] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [mfaResolver, setMfaResolver] = useState(null);
  const [mfaError, setMfaError] = useState("");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [phoneHint, setPhoneHint] = useState("");
  const [recaptchaVerifier, setRecaptchaVerifier] = useState(null);

  const loginHandler = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log("userCredential", userCredential);
      router.push("/dashboard");
    } catch (error) {
      console.error("Error during login:", error);

      if (error.code === "auth/multi-factor-auth-required") {
        // Handle MFA challenge
        const resolver = getMultiFactorResolver(auth, error);
        setMfaResolver(resolver);

        // Get the phone hint (masked phone number)
        if (resolver.hints && resolver.hints.length > 0) {
          const phoneHint = resolver.hints[0].phoneNumber;
          // Mask the phone number to show only last 4 digits
          const maskedPhone = phoneHint.replace(/^(.*)(\d{4})$/, "••••••$2");
          setPhoneHint(maskedPhone);
        }

        // Setup reCAPTCHA verifier for the MFA flow
        const recaptchaVerifier = new RecaptchaVerifier(
          auth,
          "recaptcha-container",
          {
            size: "invisible",
          }
        );
        setRecaptchaVerifier(recaptchaVerifier);

        // Show MFA dialog
        setShowMFADialog(true);
        setLoading(false);
        return;
      }

      if (error.message.includes("user-not-found")) {
        setError("User not found. Please check your email and password.");
      } else if (error.message.includes("invalid-credential")) {
        setError("Invalid credentials. Please check your email and password.");
      } else if (error.message.includes("invalid-password")) {
        setError("Invalid password. Please check your password.");
      } else if (error.message.includes("invalid-email")) {
        setError("Invalid email. Please check your email.");
      } else {
        setError(error.message);
      }
      setLoading(false);
    }
  };

  const sendVerificationCode = async () => {
    setMfaError("");
    setIsSendingCode(true);

    try {
      if (!mfaResolver || !recaptchaVerifier) {
        throw new Error("MFA session not initialized properly");
      }

      // Get the first hint (we assume phone-based MFA)
      const phoneInfoOptions = {
        multiFactorHint: mfaResolver.hints[0],
        session: mfaResolver.session,
      };

      // Send verification code
      const phoneAuthProvider = new PhoneAuthProvider(auth);
      const verificationId = await phoneAuthProvider.verifyPhoneNumber(
        phoneInfoOptions,
        recaptchaVerifier
      );

      setVerificationId(verificationId);
      setMfaError("");
    } catch (error) {
      console.error("Error sending verification code:", error);
      setMfaError(error.message || "Failed to send verification code");
    } finally {
      setIsSendingCode(false);
    }
  };

  const verifyMfaCode = async () => {
    setMfaError("");
    setIsVerifying(true);

    try {
      if (!verificationCode || verificationCode.length < 6) {
        throw new Error("Please enter a valid verification code");
      }

      if (!mfaResolver || !verificationId) {
        throw new Error("MFA session not initialized properly");
      }

      // Create credential with the verification code
      const cred = PhoneAuthProvider.credential(
        verificationId,
        verificationCode
      );
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);

      // Complete sign in
      const userCredential =
        await mfaResolver.resolveSignIn(multiFactorAssertion);
      console.log("MFA sign-in successful:", userCredential);

      // Close dialog and redirect
      setShowMFADialog(false);
      router.push("/dashboard");
    } catch (error) {
      console.error("Error verifying MFA code:", error);

      if (error.code === "auth/invalid-verification-code") {
        setMfaError("Invalid verification code. Please try again.");
      } else {
        setMfaError(error.message || "Failed to verify code");
      }
    } finally {
      setIsVerifying(false);
    }
  };

  // Clean up recaptcha when dialog closes
  const handleDialogClose = () => {
    if (recaptchaVerifier) {
      recaptchaVerifier.clear();
    }
    setShowMFADialog(false);
  };

  return (
    <div className="max-w-md w-full mx-auto rounded-none md:rounded-2xl p-4 md:p-8 bg-white dark:bg-black shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(255,255,255,0.1)] transform hover:translate-y-[-2px] transition-all duration-300 ease-in-out border border-gray-200 dark:border-gray-800">
      <h2 className="font-bold text-xl text-neutral-800 dark:text-neutral-200">
        Welcome to NGO-Connect
      </h2>
      <p className="text-neutral-600 dark:text-neutral-400 text-sm mt-2">
        Please sign in to continue
      </p>

      <form className="my-8" onSubmit={loginHandler}>
        <LabelInputContainer className="mb-4">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            placeholder="your@email.com"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[#1CAC78] focus:border-transparent"
          />
        </LabelInputContainer>

        <LabelInputContainer className="mb-4">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              placeholder="••••••••"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[#1CAC78] focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-[50%] right-[10px] -translate-y-[50%] cursor-pointer"
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>
        </LabelInputContainer>

        {error && <div className="text-red-500 text-sm mt-2">{error}</div>}

        <button
          type="submit"
          disabled={
            loading ||
            !email ||
            !password ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
          }
          className={`relative group/btn ${
            loading ? "bg-gray-400" : "bg-[#1CAC78] hover:bg-[#18956A]"
          } disabled:bg-[#1cac77c5] disabled:hover:bg-[#1895698f] disabled:cursor-not-allowed block w-full text-white rounded-md h-10 font-medium transition-colors duration-200 shadow-[0px_1px_0px_0px_#1CAC7840_inset,0px_-1px_0px_0px_#1CAC7840_inset]`}
          title={error && password.length > 0 ? error : ""}
        >
          {loading ? "Loading..." : "Login"}
          <BottomGradient />
        </button>

        <div className="bg-gradient-to-r from-transparent via-neutral-300 dark:via-neutral-700 to-transparent my-8 h-[1px] w-full" />

        <div className="flex flex-col space-y-4">
          <Link
            href="/forgot"
            className="text-sm text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 text-center"
          >
            Forgot Password?
          </Link>

          <Link
            href="/register"
            className="relative group/btn flex space-x-2 items-center justify-center px-4 w-full text-black rounded-md h-10 font-medium shadow-input bg-gray-50 dark:bg-zinc-900 dark:shadow-[0px_0px_1px_1px_var(--neutral-800)]"
          >
            <span className="text-neutral-700 dark:text-neutral-300 text-sm">
              Create new account
            </span>
            <BottomGradient />
          </Link>
        </div>
      </form>

      {/* Hidden recaptcha container */}
      <div id="recaptcha-container"></div>

      {/* MFA Dialog */}
      <Dialog open={showMFADialog} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              {!verificationId
                ? `Please verify your identity by entering the code sent to your phone ${phoneHint}.`
                : "Enter the verification code sent to your phone."}
            </DialogDescription>
          </DialogHeader>

          {mfaError && (
            <Alert variant="destructive" className="mt-2">
              <AlertDescription>{mfaError}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 py-4">
            {!verificationId ? (
              <Button
                onClick={sendVerificationCode}
                disabled={isSendingCode}
                className="bg-[#1CAC78] hover:bg-[#18956A]"
              >
                {isSendingCode ? "Sending..." : "Send Verification Code"}
              </Button>
            ) : (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="verification-code">Verification Code</Label>
                  <Input
                    id="verification-code"
                    type="text"
                    placeholder="123456"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    maxLength={6}
                  />
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setVerificationId("")}
                    disabled={isVerifying}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={verifyMfaCode}
                    disabled={isVerifying || verificationCode.length < 6}
                    className="bg-[#1CAC78] hover:bg-[#18956A]"
                  >
                    {isVerifying ? "Verifying..." : "Verify"}
                  </Button>
                </DialogFooter>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const BottomGradient = () => {
  return (
    <>
      <span className="group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
      <span className="group-hover/btn:opacity-100 blur-sm block transition duration-500 opacity-0 absolute h-px w-1/2 mx-auto -bottom-px inset-x-10 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
    </>
  );
};

const LabelInputContainer = ({ children, className }) => {
  return (
    <div className={cn("flex flex-col space-y-2 w-full", className)}>
      {children}
    </div>
  );
};
