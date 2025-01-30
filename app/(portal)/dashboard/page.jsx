"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Loading from "@/components/loading/Loading";

const page = () => {
  const router = useRouter();

  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        console.log("User is not logged in.");
        router.push("/login");
        return;
      }

      const db = getFirestore();
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userType = userDoc.data().type;
        console.log("User type:", userType);
        router.push(`/dashboard/${userType}`);
      } else {
        console.log("User document does not exist.");
        router.push("/login");
      }
    });
  }, [router]);

  return <Loading />;
};

export default page;
