"use client";

import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Loading from "@/components/loading/Loading";

const NGOReportPage = () => {
  const [user, setUser] = useState(null);
  const [accessGranted, setAccessGranted] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Monitor authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        checkAccess(currentUser.uid);
      } else {
        // No user is signed in, redirect to login
        router.replace("/login");
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Check if user has access to this page
  const checkAccess = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));

      if (!userDoc.exists()) {
        router.replace("/login");
        return;
      }

      const userData = userDoc.data();

      // If user is level1 member, redirect them
      if (
        userData.type === "ngo" &&
        userData.role === "member" &&
        userData.accessLevel === "level1"
      ) {
        router.replace("/dashboard/ngo");
        return;
      }

      // Access is granted, allow the component to render
      setAccessGranted(true);
      setInitialized(true);
      setLoading(false);
    } catch (error) {
      console.error("Error checking access:", error);
      router.replace("/login");
    }
  };

  // Render loading state until we've checked access
  if (loading) {
    return <Loading />;
  }

  // Only render the component if access is granted
  if (!accessGranted) {
    return null;
  }

  return <div>NGOReportPage</div>;
};

export default NGOReportPage;
