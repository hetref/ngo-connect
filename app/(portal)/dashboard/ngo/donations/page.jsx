"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DonationsDashboard } from "@/components/donations-dashboard";
import { DonationsTransactions } from "@/components/donations-transactions";
import { PayoutManagement } from "@/components/payout-management";
import { DonorsTable } from "@/components/donors-table";
import CashDonation from "@/components/ngo/CashDonation";
import { CashDonationTable } from "@/components/CashDonationTable";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Loading from "@/components/loading/Loading";
import { ResDonationTable } from "@/components/ResDonationTable";
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { NGOABI } from "@/constants/contract";
import { formatEther, parseEther } from "viem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import toast from "react-hot-toast";
import { parseUnits } from "ethers";
import ResourcesDonation from "@/components/ngo/ResourcesDonation";

export default function NGODonationsPage() {
  const [user, setUser] = useState(null);
  const [accessGranted, setAccessGranted] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ngoProfile, setNgoProfile] = useState(null);
  const router = useRouter();
  const [payoutAmount, setPayoutAmount] = useState("");
  const [proofImage, setProofImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const { writeContract, data: hash } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess) {
      toast.success("Payout has been added successfully");
      setPayoutAmount("");
      setProofImage(null);
      setIsSubmitting(false);
    }
  }, [isSuccess]);

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
      const ngoDoc = await getDoc(doc(db, "ngo", uid));

      if (!userDoc.exists()) {
        router.replace("/login");
        return;
      }

      if (ngoDoc.exists()) {
        setNgoProfile(ngoDoc.data());
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

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setProofImage(e.target.files[0]);
    }
  };

  const handleRequestPayout = async () => {
    try {
      setIsSubmitting(true);

      if (!ngoProfile?.donationsData?.ngoOwnerAddContract) {
        throw new Error("No contract address found");
      }

      const amount = parseFloat(payoutAmount);
      const payoutAmountUpdated = parseUnits(amount.toString(), 18);
      const balance = parseFloat(formatEther(ngoBalance || 0n));

      if (amount < 1 || amount > balance) {
        throw new Error(`Amount must be between 1 and ${balance} NGC`);
      }

      if (!proofImage) {
        throw new Error("Please upload a proof image");
      }

      // Upload image to Firebase Storage
      const timestamp = Date.now().toString();
      const storageRef = ref(storage, `ngo/${user.uid}/payouts/${timestamp}`);
      await uploadBytes(storageRef, proofImage);
      const imageUrl = await getDownloadURL(storageRef);

      // Request payout through smart contract
      writeContract({
        address: ngoProfile.donationsData.ngoOwnerAddContract,
        abi: NGOABI,
        functionName: "requestPayout",
        args: [payoutAmountUpdated, imageUrl],
      });
    } catch (error) {
      console.error("Error requesting payout:", error);
      toast.error(error.message || "Failed to request payout");
      setIsSubmitting(false);
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

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">NGO Donations Dashboard</h1>
        <ResourcesDonation />
        <CashDonation />
        <div className="flex items-center gap-4">
          {ngoProfile?.donationsData?.isCryptoTransferEnabled &&
            ngoProfile?.donationsData?.ngoOwnerAddContract && (
              <>
                <div className="text-green-600 font-semibold px-4 py-2 bg-green-100 rounded-full">
                  Balance:{" "}
                  {ngoBalancePending
                    ? "Loading..."
                    : ngoBalanceError
                      ? "Error loading balance"
                      : `${formatEther(ngoBalance || 0n)} NGC`}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Amount (NGC)"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    min="1"
                    max={formatEther(ngoBalance || 0n)}
                    className="w-32"
                  />
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-48"
                  />
                  <Button
                    onClick={handleRequestPayout}
                    disabled={isSubmitting || !payoutAmount || !proofImage}
                  >
                    {isSubmitting ? "Processing..." : "Request Payout"}
                  </Button>
                </div>
              </>
            )}
        </div>
      </div>

      {/* Stats and Charts - Always visible */}
      <DonationsDashboard />

      {/* Tabs Section - Below Stats and Charts */}
      <Tabs defaultValue="donors" className="mt-6">
        <TabsList>
          <TabsTrigger value="donors">Donors</TabsTrigger>
          <TabsTrigger value="cash">Cash</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="donors">
          <DonorsTable />
        </TabsContent>

        <TabsContent value="cash">
          <CashDonationTable />
        </TabsContent>

        <TabsContent value="resources">
          <ResDonationTable />
        </TabsContent>

        <TabsContent value="payouts">
          <PayoutManagement />
        </TabsContent>

        <TabsContent value="transactions">
          <DonationsTransactions />
        </TabsContent>
      </Tabs>
    </div>
  );
}
