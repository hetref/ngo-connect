"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Eye, EyeOff } from "lucide-react";

const NgoRegistrationPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    ngoName: "",
    phone: "",
    pan: "",
  });
  const [invalidInputs, setInvalidInputs] = useState([]);
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [sentOtp, setSentOtp] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Initialize error variable
    let newError = null;

    // Validate name
    if (name === "name") {
      const nameRegex = /^[A-Za-z]+ [A-Za-z]+$/;
      if (!nameRegex.test(value)) {
        newError =
          "Please enter your first and last name separated by a space.";
        setInvalidInputs((prev) => [...new Set([...prev, name])]); // Add to invalid inputs
      } else {
        setInvalidInputs((prev) => prev.filter((input) => input !== name)); // Remove from invalid inputs
      }
    }

    // Validate email
    if (name === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        newError = "Please enter a valid email address.";
        setInvalidInputs((prev) => [...new Set([...prev, name])]);
      } else {
        setInvalidInputs((prev) => prev.filter((input) => input !== name));
      }
    }

    // Validate phone number first
    if (name === "phone") {
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(value)) {
        newError = "Please enter a valid 10-digit phone number.";
        setInvalidInputs((prev) => [...new Set([...prev, name])]);
      } else {
        setInvalidInputs((prev) => prev.filter((input) => input !== name));
      }
    }

    // Validate PAN number second
    if (name === "pan") {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(value)) {
        newError = "Please enter a valid PAN number."; // Only set if no previous error
        setInvalidInputs((prev) => [...new Set([...prev, name])]);
      } else {
        setInvalidInputs((prev) => prev.filter((input) => input !== name));
      }
    }
  };

  const registerHandle = async (e) => {
    e.preventDefault();
    setInvalidInputs([]); // Reset invalid inputs on form submission

    const { name, ngoName, email, password, phone, pan } = formData;

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await Promise.all([
        setDoc(doc(db, "users", user.uid), {
          email,
          name,
          ngoName,
          type: "ngo",
          role: "admin",
          ngoId: user.uid,
          phone,
          pan,
          createdAt: serverTimestamp(),
        }),
        setDoc(doc(db, "ngo", user.uid), {
          email,
          ngoName,
          ngoId: user.uid,
          name,
          role: "admin",
          pan,
          phone,
          createdAt: serverTimestamp(),
        }),
      ]);

      router.push("/dashboard/ngo");
    } catch (err) {
      console.error("Error during registration:", err.message);

      if (err.code === "auth/email-already-in-use") {
        setError("Email already in use. Please use a different email.");
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (err.code === "auth/weak-password") {
        setError("Password must be at least 6 characters long.");
      } else if (err.code === "auth/invalid-credential") {
        setError("Invalid email or password.");
      } else if (err.code === "auth/invalid-password") {
        setError("Invalid password. Please enter a valid password.");
      } else {
        setError(err.code);
      }
    }
  };

  const otpSendingHandler = async (e) => {
    e.preventDefault();
    if (!formData.email) {
      setInvalidInputs((prev) => [...new Set([...prev, "email"])]);
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
      setInvalidInputs((prev) => prev.filter((input) => input !== "email")); // Remove email from invalid inputs
    }
  };

  const verifyOtpHandler = (e) => {
    e.preventDefault();
    if (parseInt(otp) === sentOtp) {
      setVerifiedEmail(true);
      setInvalidInputs((prev) => prev.filter((input) => input !== "otp")); // Remove OTP from invalid inputs
    } else {
      setInvalidInputs((prev) => [...new Set([...prev, "otp"])]);
    }
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
          <Label htmlFor="ngoName">NGO Name</Label>
          <Input
            id="ngoName"
            name="ngoName"
            placeholder="Your NGO Name"
            value={formData.ngoName}
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
            className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[#1CAC78] focus:border-transparent"
          />
          {invalidInputs.includes("name") && (
            <p className="text-red-500 text-sm">
              Please enter your first and last name separated by a space.
            </p>
          )}
        </LabelInputContainer>

        <LabelInputContainer className="mb-4">
          <Label htmlFor="email">NGO Email Address</Label>
          <Input
            id="email"
            name="email"
            placeholder="ngo@email.com"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={otpSent && !verifiedEmail}
            className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[#1CAC78] focus:border-transparent"
          />
          {invalidInputs.includes("email") && (
            <p className="text-red-500 text-sm">
              Please enter a valid email address.
            </p>
          )}
        </LabelInputContainer>

        <LabelInputContainer className="mb-4">
          <Label htmlFor="phone">NGO Phone Number</Label>
          <Input
            id="phone"
            name="phone"
            placeholder="9876543210"
            value={formData.phone}
            onChange={handleChange}
            required
            disabled={otpSent && !verifiedEmail}
            className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[#1CAC78] focus:border-transparent"
          />
          {invalidInputs.includes("phone") && (
            <p className="text-red-500 text-sm">
              Please enter a valid 10-digit phone number.
            </p>
          )}
        </LabelInputContainer>

        <LabelInputContainer className="mb-4">
          <Label htmlFor="pan">Pan Number</Label>
          <Input
            id="pan"
            name="pan"
            placeholder="A123456789"
            value={formData.pan}
            onChange={handleChange}
            required
            disabled={otpSent && !verifiedEmail}
            className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[#1CAC78] focus:border-transparent"
          />
          {invalidInputs.includes("pan") && (
            <p className="text-red-500 text-sm">
              Please enter a valid PAN number.
            </p>
          )}
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
            {invalidInputs.includes("otp") && (
              <p className="text-red-500 text-sm">
                Invalid OTP. Please try again.
              </p>
            )}
          </LabelInputContainer>
        )}

        <LabelInputContainer className="mb-4">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
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
            !(
              (
                formData.name &&
                formData.email &&
                formData.password &&
                formData.ngoName &&
                formData.phone &&
                formData.pan &&
                invalidInputs.length === 0
              ) // Ensure no validation error exists
            )
          }
          className="relative group/btn bg-[#1CAC78] hover:bg-[#18956A] disabled:bg-[#1cac77c5] disabled:hover:bg-[#1895698f] disabled:cursor-not-allowed block w-full text-white rounded-md h-10 font-medium transition-colors duration-200 shadow-[0px_1px_0px_0px_#1CAC7840_inset,0px_-1px_0px_0px_#1CAC7840_inset]"
        >
          Register &rarr;
          <BottomGradient />
        </button>

        <div className="bg-gradient-to-r from-transparent via-neutral-300 dark:via-neutral-700 to-transparent my-8 h-[1px] w-full" />

        <div className="flex flex-col space-y-4">
          <Link
            href="/register"
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

export default NgoRegistrationPage;
