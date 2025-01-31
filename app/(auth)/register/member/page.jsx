"use client";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Building2, Key } from "lucide-react";
import { cn } from "@/lib/utils";

const Page = () => {
  const router = useRouter();
  const [ngoId, setNgoId] = useState("");
  const [verificationCode, setVerificationCode] = useState("");

  const submitHandler = () => {
    router.push(`/register/member/${ngoId}/${verificationCode}`);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="max-w-md w-full mx-auto rounded-2xl p-8 relative">
        {/* Removed 3D Shadow Effects */}
        <div className="relative bg-white dark:bg-black rounded-2xl p-6 shadow-md transition-all duration-300">
          <h2 className="font-bold text-xl text-neutral-800 dark:text-neutral-200">
            Member Verification
          </h2>
          <p className="text-neutral-600 text-sm max-w-sm mt-2 dark:text-neutral-300">
            To register as a member, please fill in your organization details
            below
          </p>

          <form className="my-8">
            <LabelInputContainer className="mb-4">
              <Label
                htmlFor="ngoId"
                className="text-neutral-700 dark:text-neutral-300"
              >
                NGO ID
              </Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 h-5 w-5 text-neutral-500" />
                <Input
                  id="ngoId"
                  name="ngoId"
                  placeholder="Enter Ngo ID"
                  className="pl-10 h-12 shadow-sm bg-neutral-50 dark:bg-zinc-900 border dark:border-zinc-800 focus:border-neutral-400 dark:focus:border-neutral-600"
                  onChange={(e) => setNgoId(e.target.value)}
                />
              </div>
            </LabelInputContainer>

            <LabelInputContainer className="mb-8">
              <Label
                htmlFor="verificationCode"
                className="text-neutral-700 dark:text-neutral-300"
              >
                Verification Code
              </Label>
              <div className="relative">
                <Key className="absolute left-3 top-3 h-5 w-5 text-neutral-500" />
                <Input
                  id="verificationCode"
                  name="verificationCode"
                  placeholder="Enter Verification Code"
                  className="pl-10 h-12 shadow-sm bg-neutral-50 dark:bg-zinc-900 border dark:border-zinc-800 focus:border-neutral-400 dark:focus:border-neutral-600"
                  onChange={(e) => setVerificationCode(e.target.value)}
                />
              </div>
            </LabelInputContainer>

            <button
              onClick={submitHandler}
              type="button"
              className="bg-gradient-to-br relative group/btn from-black dark:from-zinc-900 dark:to-zinc-900 to-neutral-600 block dark:bg-zinc-800 w-full text-white rounded-md h-12 font-medium shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] hover:scale-[1.02] transition-all duration-200"
            >
              Validate &rarr;
              <BottomGradient />
            </button>
          </form>
        </div>
      </div>
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

export default Page;
