"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const OrganizationRegistrationPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    orgName: "",
  });
  const [error, setError] = useState(null);
  const router = useRouter();
  const [userType, setUserType] = useState("organizations");
  const [otp, setOtp] = useState("");
  const [sentOtp, setSentOtp] = useState();
  const [otpSent, setOtpSent] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUserTypeChange = (value) => {
    setUserType(value);
    console.log("Selected user type:", value);
  };

  const registerHandle = async (e) => {
    e.preventDefault();
    setError(null);

    const { name, orgName, email, password } = formData;

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        email,
        name,
        orgName,
        type: userType,
        role: "admin",
        organizationId: user.uid,
      });

      await setDoc(doc(db, userType, user.uid), {
        email,
        name: orgName,
        orgAdmin: user.uid,
        orgAdminName: name,
        role: userType,
        plan: "free",
        info: false,
      });

      router.push("/dashboard");
    } catch (err) {
      console.error("Error during registration:", err.message);
      setError(err.message);
      toast.error(err.code);
    }
  };

  const otpSendingHandler = async (e) => {
    e.preventDefault();
    if (!formData.email) {
      setError("Please enter a valid email address.");
      return;
    }
    const otp = Math.floor(100000 + Math.random() * 900000);
    setSentOtp(otp);

    const sendingOtpEmail = await fetch("/api/verify-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: formData.email,
        verificationCode: otp, // Use the generated OTP
      }),
    });

    if (sendingOtpEmail.ok) {
      setOtpSent(true);
      setError("OTP sent successfully!");
    }
  };

  const verifyOtpHandler = (e) => {
    e.preventDefault();
    if (parseInt(otp) === sentOtp) {
      setVerifiedEmail(true);
      setError("Email verified successfully!");
    } else {
      setError("Invalid OTP. Please try again.");
    }
  };

  const handleEmailChange = (e) => {
    setFormData((prev) => ({ ...prev, email: e.target.value }));
    // if (otpSent) {
    setVerifiedEmail(false); // Reset verifiedEmail if email changes after OTP is sent
    setOtpSent(false);
    setOtp("");
    // }
  };

  return (
    <div className="max-w-md w-full mx-auto rounded-none md:rounded-2xl p-4 md:p-8 bg-white dark:bg-black shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(255,255,255,0.1)] transform hover:translate-y-[-2px] transition-all duration-300 ease-in-out border border-gray-200 dark:border-gray-800">
      <h2 className="font-bold text-xl text-neutral-800 dark:text-neutral-200">
        NGO Registration
      </h2>
      <p className="text-neutral-600 dark:text-neutral-400 text-sm mt-2">
        Get your NGO registered to access exclusive features!
      </p>

      <form className="my-8" onSubmit={registerHandle}>
        <LabelInputContainer className="mb-4">
          <Label htmlFor="orgName">NGO Name</Label>
          <Input
            id="orgName"
            name="orgName"
            placeholder="Your Organization Name"
            value={formData.orgName}
            onChange={handleChange}
            required
          />
        </LabelInputContainer>

        <LabelInputContainer className="mb-4">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            name="name"
            placeholder="Your name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </LabelInputContainer>

        <LabelInputContainer className="mb-4">
          <Label htmlFor="email">NGO Email Address</Label>
          <div className="flex gap-2">
            <Input
              id="email"
              name="email"
              placeholder="ngo@email.com"
              value={formData.email}
              onChange={handleEmailChange}
              required
              disabled={otpSent && !verifiedEmail}
            />
          </div>
        </LabelInputContainer>

        <LabelInputContainer className="mb-4">
          <Label htmlFor="email">NGO Phone Number</Label>
          <div className="flex gap-2">
            <Input
              id="phone"
              name="phone"
              placeholder="9876543210"
              value={formData.phone}
              onChange={handleEmailChange}
              required
              disabled={otpSent && !verifiedEmail}
            />
          </div>
        </LabelInputContainer>
        <LabelInputContainer className="mb-4">
          <Label htmlFor="email">Pan Number</Label>
          <div className="flex gap-2">
            <Input
              id="PAN"
              name="PAN"
              placeholder="A123456789"
              value={formData.PAN}
              onChange={handleEmailChange}
              required
              disabled={otpSent && !verifiedEmail}
            />
          </div>
        </LabelInputContainer>

        {otpSent && !verifiedEmail && (
          <LabelInputContainer className="mb-4">
            <Label htmlFor="otp">Enter OTP</Label>
            <div className="flex gap-2">
              <Input
                id="otp"
                type="number"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                disabled={verifiedEmail}
              />
              <Button
                type="button"
                onClick={verifyOtpHandler}
                disabled={verifiedEmail}
              >
                Verify
              </Button>
            </div>
          </LabelInputContainer>
        )}

        <LabelInputContainer className="mb-4">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </LabelInputContainer>

        {error && (
          <p
            className={cn(
              "text-sm mb-4",
              error.includes("successful") ? "text-green-500" : "text-red-500"
            )}
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={
            !(
              formData.name &&
              formData.email &&
              formData.password &&
              verifiedEmail
            )
          }
          className="bg-black text-white hover:bg-gray-800 block w-full rounded-md h-10 font-medium transition-all duration-300 ease-in-out"
        >
          Register &rarr;
          <BottomGradient />
        </button>

        <div className="bg-gradient-to-r from-transparent via-neutral-300 dark:via-neutral-700 to-transparent my-8 h-[1px] w-full" />

        <div className="flex flex-col space-y-4">
          <Link
            href="/register/user"
            className="text-sm text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 text-center"
          >
            Register as User
          </Link>

          <Link
            href="/login"
            className="relative group/btn flex space-x-2 items-center justify-center px-4 w-full text-black rounded-md h-10 font-medium shadow-input bg-gray-50 dark:bg-zinc-900 dark:shadow-[0px_0px_1px_1px_var(--neutral-800)]"
          >
            <span className="text-neutral-700 dark:text-neutral-300 text-sm">
              Already have an organization account? Login
            </span>
            <BottomGradient />
          </Link>
        </div>
      </form>
    </div>
  );
};

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

export default OrganizationRegistrationPage;