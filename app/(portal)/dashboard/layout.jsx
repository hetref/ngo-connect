"use client";

import React, { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"

const layout = ({ children }) => {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Add your layout here
  return (
    <>
      {children}
      <Toaster />
    </>
  );
};

export default layout;
