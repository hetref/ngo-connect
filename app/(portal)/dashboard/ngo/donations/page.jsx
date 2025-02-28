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

export default function NGODonationsPage() {
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

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">NGO Donations Dashboard</h1>

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
