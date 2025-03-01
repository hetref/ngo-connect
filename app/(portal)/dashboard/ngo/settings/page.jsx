"use client";

import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileInformation from "@/components/profile/ngo/ProfileInformation";
import VerificationInformation from "@/components/profile/ngo/VerificationInformation";
import DonationInformation from "@/components/profile/ngo/DonationInformation";
import NotificationInformation from "@/components/profile/ngo/NotificationInformation";
import SecurityInformation from "@/components/profile/ngo/SecurityInformation";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { doc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import { useState, useEffect } from "react";
import { useReadContract } from "wagmi";
import { NGOABI } from "@/constants/contract";
import { formatEther } from "viem";

const NGOSettingsPage = () => {
  const userId = auth.currentUser.uid;
  const [ngoProfile, setNgoProfile] = useState(null);
  const [approvalStatus, setApprovalStatus] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null);

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

  console.log(
    "NGO Contract Address:",
    ngoProfile?.donationsData?.ngoOwnerAddContract
  );
  console.log("NGO Balance:", ngoBalance);

  // const [darkMode, setDarkMode] = useState(false);

  // Effect to handle dark mode
  // useEffect(() => {
  //   if (darkMode) {
  //     document.documentElement.classList.add("dark");
  //   } else {
  //     document.documentElement.classList.remove("dark");
  //   }
  // }, [darkMode]);

  // Effect to fetch NGO profile and verification status
  useEffect(() => {
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
  }, [userId]);

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
      // Just
    } catch (error) {
      console.error("Error requesting editing:", error);
      alert("Failed to switch to editing mode. Please try again.");
    }
  };

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
          {/* <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger> */}
          <TabsTrigger value="donations">Donations</TabsTrigger>
          {/* <TabsTrigger value="notifications">Notifications</TabsTrigger> */}
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

        {/* <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle>Team Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>{member.name}</TableCell>
                      <TableCell>{member.role}</TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="ml-2">
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Button className="w-full md:w-auto bg-[#1CAC78] hover:bg-[#158f63]">
                Invite New Member
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Event & Campaign Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Default Event Categories</Label>
                <Select className="border-gray-300">
                  <SelectTrigger>
                    <SelectValue placeholder="Select categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="environment">Environment</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="health">Health</SelectItem>
                    <SelectItem value="community">Community</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Donation Campaign Goals</Label>
                <Input
                  type="number"
                  placeholder="Set default goal amount"
                  className="border-gray-300"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="event-privacy" className="border-gray-300" />
                <Label htmlFor="event-privacy">
                  Make events private by default
                </Label>
              </div>
              <Button className="w-full md:w-auto bg-[#1CAC78] hover:bg-[#158f63]">
                Save Event Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent> */}

        <TabsContent value="donations">
          <DonationInformation
            ngoId={userId}
            approvalStatus={approvalStatus}
            verificationStatus={verificationStatus}
          />
        </TabsContent>

        {/* <TabsContent value="notifications">
          <NotificationInformation />
        </TabsContent> */}

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
