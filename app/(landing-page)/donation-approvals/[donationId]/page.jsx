"use client";

import DonationVerification from "@/components/DonationVerification";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

const page = () => {
  const { donationId } = useParams();
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [donation, setDonation] = useState(null);

  useEffect(() => {
    const docRef = doc(db, "donationApprovals", donationId);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setDonation(docSnap.data());
        console.log("DONATION APPROVAL DATA", docSnap.data());
      } else {
        setDonation({ error: "Invalid Donation Approval ID" });
      }
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, [donationId]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  return (
    <div className="py-12 pt-[148px] w-full">
      {isAuthenticated === null ? (
        <p className="text-center">Loading...</p>
      ) : isAuthenticated ? (
        donation?.error ? (
          <p className="text-red-500 text-center">{donation.error}</p>
        ) : auth.currentUser.email === donation?.donorEmail ? (
          <DonationVerification
            donation={donation}
            donationApprovalId={donationId}
          />
        ) : (
          <p className="text-center">
            You are not authorized to approve or reject donation. Login using
            the same email.
          </p>
        )
      ) : (
        <p className="text-center">Please log in to access this feature.</p>
      )}
    </div>
  );
};

export default page;
