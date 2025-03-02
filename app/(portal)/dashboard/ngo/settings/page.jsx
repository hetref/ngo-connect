"use client";

import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileInformation from "@/components/profile/ngo/ProfileInformation";
import VerificationInformation from "@/components/profile/ngo/VerificationInformation";
import DonationInformation from "@/components/profile/ngo/DonationInformation";
import SecurityInformation from "@/components/profile/ngo/SecurityInformation";
import MemberProfile from "@/components/profile/ngo/MemberProfile";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { doc, onSnapshot, setDoc, updateDoc, getDoc } from "firebase/firestore";
import { useState, useEffect } from "react";
import { useReadContract } from "wagmi";
import { NGOABI } from "@/constants/contract";
import { formatEther } from "viem";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

const NGOSettingsPage = () => {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [ngoProfile, setNgoProfile] = useState(null);
  const [approvalStatus, setApprovalStatus] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [userType, setUserType] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [ngoId, setNgoId] = useState(null);

  const {
    data: ngoBalance,
    error: ngoBalanceError,
    isPending: ngoBalancePending,
  } = useReadContract({
    address: ngoProfile?.donationsData?.ngoOwnerAddContract || undefined,
    abi: NGOABI,
    functionName: "getAvailableBalance",
    enabled: Boolean(ngoProfile?.donationsData?.ngoOwnerAddContract),
  });

  // Effect to check user authentication and type/role
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUserId(currentUser.uid);

        // Get user data to check type and role
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserType(userData.type);
            setUserRole(userData.role);

            // If user is NGO member, set the NGO ID
            if (userData.type === "ngo" && userData.role === "member") {
              setNgoId(userData.ngoId);
            } else if (userData.type === "ngo" && userData.role === "admin") {
              setNgoId(currentUser.uid);
            }
          }

          setIsLoading(false);
        } catch (error) {
          console.error("Error fetching user data:", error);
          setIsLoading(false);
        }
      } else {
        // No user is signed in, redirect to login
        router.replace("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Effect to fetch NGO profile and verification status (only for NGO admins)
  useEffect(() => {
    if (!userId || userType !== "ngo" || userRole !== "admin") return;

    const ngoDocRef = doc(db, "ngo", userId);
    const approvalDocRef = doc(db, "approvals", userId);

    // Listen to NGO document changes
    const unsubscribeNgo = onSnapshot(ngoDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setNgoProfile((prevProfile) => ({
          ...prevProfile,
          ...data,
        }));
        setVerificationStatus(data.isVerified);
        console.log("NGO Data:", data);
      }
    });

    // Listen to Approval document changes
    const unsubscribeApproval = onSnapshot(approvalDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setApprovalStatus(docSnap.data().approval);
      } else {
        setApprovalStatus(null);
      }
    });

    // Cleanup listeners on component unmount
    return () => {
      unsubscribeNgo();
      unsubscribeApproval();
    };
  }, [userId, userType, userRole]);

  const handleVerifyProfile = async () => {
    try {
      // TODO: Check if the all information of the NGO is filled in or not.

      // Create a new document in approvals collection with timestamp as ID
      const timestamp = Date.now().toString();
      const approvalRef = doc(db, "approvals", `${userId}`);
      await setDoc(approvalRef, {
        ngoId: userId,
        timestamp: timestamp,
        approval: "pending",
      });

      // Update the NGO document with verification status
      const ngoRef = doc(db, "ngo", userId);
      await updateDoc(ngoRef, {
        isVerified: "pending",
      });

      // Optional: Show success message to user
      alert("Verification request submitted successfully!");
    } catch (error) {
      console.error("Error submitting verification request:", error);
      alert("Failed to submit verification request. Please try again.");
    }
  };

  const handleSwitchToEditingMode = async () => {
    try {
      console.log("Requesting editing...");
      const confirmation = confirm(
        "Are you sure you want to switch to editing mode?"
      );
      if (confirmation) {
        console.log("Switching to editing mode...");
        // Update the isVerified inside the "ngo/[ngoId]" to pending again"
        const ngoRef = doc(db, "ngo", userId);
        await updateDoc(ngoRef, {
          isVerified: "pending",
        });
      }
    } catch (error) {
      console.error("Error requesting editing:", error);
      alert("Failed to switch to editing mode. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <p>Loading user data...</p>
      </div>
    );
  }

  // Render the member profile if user is an NGO member
  if (userType === "ngo" && userRole === "member") {
    return <MemberProfile />;
  }

  // Render the NGO admin settings page
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-4 space-y-8"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">NGO Settings</h1>
        <div>
          {verificationStatus === "verified" ? (
            <div className="flex items-center justify-center gap-3">
              <div className="text-green-600 font-semibold px-4 py-2 bg-green-100 rounded-full">
                Profile Verified ✓
              </div>
              <Button
                className="rounded-full bg-yellow-600 hover:bg-yellow-700"
                onClick={handleSwitchToEditingMode}
              >
                Edit Profile
              </Button>
            </div>
          ) : approvalStatus === "pending" &&
            verificationStatus === "pending" ? (
            <div className="text-yellow-600 font-semibold px-4 py-2 bg-yellow-100 rounded-full">
              Profile is in process to be verified
            </div>
          ) : (
            <Button
              className="rounded-full bg-yellow-600 hover:bg-yellow-700"
              onClick={handleVerifyProfile}
            >
              Verify Profile
            </Button>
          )}
          {ngoProfile?.donationsData?.isCryptoTransferEnabled &&
            ngoProfile?.donationsData?.ngoOwnerAddContract && (
              <div className="text-green-600 font-semibold px-4 py-2 bg-green-100 rounded-full">
                Balance:{" "}
                {ngoBalancePending
                  ? "Loading..."
                  : ngoBalanceError
                    ? "Error loading balance"
                    : `${formatEther(ngoBalance || 0n)} NGC`}
              </div>
            )}
        </div>
      </div>

      {/* Add Awards & Recognitions Tab where the NGO can add the Awards and Recognition they received */}

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
          <TabsTrigger value="bank-info">Bank Info</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileInformation
            userId={userId}
            approvalStatus={approvalStatus}
            verificationStatus={verificationStatus}
          />
        </TabsContent>

        <TabsContent value="verification">
          <VerificationInformation
            ngoId={userId}
            approvalStatus={approvalStatus}
            verificationStatus={verificationStatus}
          />
        </TabsContent>

        <TabsContent value="bank-info">
          <DonationInformation
            ngoId={userId}
            approvalStatus={approvalStatus}
            verificationStatus={verificationStatus}
          />
        </TabsContent>

        <TabsContent value="security">
          <SecurityInformation
            userId={userId}
            approvalStatus={approvalStatus}
            verificationStatus={verificationStatus}
          />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default NGOSettingsPage;
