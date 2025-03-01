"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FileText, Mail, Clock } from "lucide-react";
import DonationReports from "@/components/reports/donation-reports";
// import ActivitiesReports from "@/components/reports/activities/activities-reports";
import MemberReports from "@/components/reports/member-reports";
import GraphGenerator from "@/components/reports/graph-generator";
import { PDFDownloadLink } from "@react-pdf/renderer";
import PDFTemplate from "@/components/reports/pdf-template";
import Loading from "@/components/loading/Loading";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import ActivitiesReports from "@/components/reports/activities/activities-reports";

export default function NGOReportsPage() {
  const [user, setUser] = useState(null);
  const [accessGranted, setAccessGranted] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [timeFrame, setTimeFrame] = useState("1month");
  const [isExporting, setIsExporting] = useState(false);
  const [reportData, setReportData] = useState({
    timeFrame: "1month",
    donations: {
      total: 150000,
      breakdown: [
        { method: "Cash", amount: 50000 },
        { method: "UPI", amount: 60000 },
        { method: "Bank Transfer", amount: 30000 },
        { method: "Cryptocurrency", amount: 10000 },
      ],
    },
    activities: {
      total: 25,
      volunteers: 150,
      fundsSpent: 75000,
    },
    members: {
      totalMembers: 500,
      newMembers: 50,
    },
  });
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

  const handleExportPDF = () => {
    setIsExporting(true);
    // The actual download will be handled by PDFDownloadLink
  };

  const handleShareReport = () => {
    // Placeholder for report sharing functionality
    console.log("Sharing report...");
  };

  const handleScheduleReport = () => {
    // Placeholder for report scheduling functionality
    console.log("Scheduling report...");
  };
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-4 space-y-8"
    >
      <h1 className="text-3xl font-bold mb-8">NGO Reports & Analytics</h1>

      <div className="flex justify-between items-center mb-6">
        <Select value={timeFrame} onValueChange={setTimeFrame}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time frame" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1month">1 Month</SelectItem>
            <SelectItem value="3months">3 Months</SelectItem>
            <SelectItem value="1year">1 Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="donations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="donations">Donations</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="graphs">Graph Generator</TabsTrigger>
        </TabsList>

        <TabsContent value="donations">
          <DonationReports timeFrame={timeFrame} />
        </TabsContent>

        <TabsContent value="activities">
          <ActivitiesReports timeFrame={timeFrame} />
        </TabsContent>

        <TabsContent value="members">
          <MemberReports timeFrame={timeFrame} />
        </TabsContent>

        <TabsContent value="graphs">
          <GraphGenerator timeFrame={timeFrame} />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
