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
import DonationReports from "@/components/reports/donations/donation-reports";
// import ActivitiesReports from "@/components/reports/activities/activities-reports";
import GraphGenerator from "@/components/reports/graph-generator";
import { PDFDownloadLink } from "@react-pdf/renderer";
import PDFTemplate from "@/components/reports/pdf-template";
import Loading from "@/components/loading/Loading";
import { useRouter } from "next/navigation";
import { doc, getDoc, collection, getDocs, query, where, collectionGroup } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import ActivitiesReports from "@/components/reports/activities/activities-reports";
// import ActivitiesReports from "@/components/reports/activities/activities-reports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NGOReportsPage() {
  const [user, setUser] = useState(null);
  const [accessGranted, setAccessGranted] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [timeFrame, setTimeFrame] = useState("1month");
  const [isExporting, setIsExporting] = useState(false);
  const [donationsData, setDonationsData] = useState([]);
  const [activitiesData, setActivitiesData] = useState([]);
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
      const userData = userDoc.data();

      if (!userDoc.exists() || userData.role !== "admin") {
        router.replace("/dashboard");
        return;
      }

      setAccessGranted(true);
      fetchDonationsData(uid);
      fetchActivitiesData(uid);
    } catch (error) {
      console.error("Error checking access:", error);
      router.replace("/dashboard");
    }
  };

  const fetchDonationsData = async (ngoId) => {
    try {
      const currentYear = new Date().getFullYear().toString();
      let allDonations = [];

      // Fetch cash donations
      const cashDonations = await getDocs(collectionGroup(db, "cash"));
      cashDonations.forEach((doc) => {
        const path = doc.ref.path;
        if (path.includes(`donations/${ngoId}/${currentYear}`)) {
          const donationData = {
            id: doc.id,
            ...doc.data(),
            paymentMethod: "Cash",
          };
          allDonations.push(donationData);
        }
      });

      // Fetch online donations
      const onlineDonations = await getDocs(collectionGroup(db, "online"));
      onlineDonations.forEach((doc) => {
        const path = doc.ref.path;
        if (path.includes(`donations/${ngoId}/${currentYear}`)) {
          const donationData = {
            id: doc.id,
            ...doc.data(),
            paymentMethod: "Online",
          };
          allDonations.push(donationData);
        }
      });

      setDonationsData(allDonations);
    } catch (error) {
      console.error("Error fetching donations data:", error);
    }
  };

  const fetchActivitiesData = async (ngoId) => {
    try {
      // Get user document to get activities IDs
      const userDoc = await getDoc(doc(db, "users", ngoId));
      if (!userDoc.exists()) {
        console.error("User document not found");
        setLoading(false);
        return;
      }

      const activitiesIds = userDoc.data().activities || [];
      
      // Fetch each activity document
      const activitiesPromises = activitiesIds.map(async (activityId) => {
        const activityDoc = await getDoc(doc(db, "activities", activityId));
        if (activityDoc.exists()) {
          return { id: activityId, ...activityDoc.data() };
        }
        return null;
      });

      const activitiesResults = await Promise.all(activitiesPromises);
      const validActivities = activitiesResults.filter(activity => activity !== null);
      
      setActivitiesData(validActivities);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching activities data:", error);
      setLoading(false);
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

      <Tabs defaultValue="charts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="donations">Donations</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="charts">Charts & Graphs</TabsTrigger>
          {/* <TabsTrigger value="exports">Exports & Downloads</TabsTrigger> */}
        </TabsList>

        <TabsContent value="donations">
          <DonationReports timeFrame={timeFrame} />
        </TabsContent>

        <TabsContent value="activities">
          <ActivitiesReports timeFrame={timeFrame} />
        </TabsContent>

        <TabsContent value="charts">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Data Visualization</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  Generate charts from your donations and activities data. Select your data source and chart type, then download as PNG.
                </p>
                
                <GraphGenerator 
                  donationsData={donationsData} 
                  activitiesData={activitiesData} 
                />
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Donation Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-2 text-sm text-muted-foreground">
                    Total Donations: {donationsData.length}
                  </p>
                  <p className="mb-2 text-sm text-muted-foreground">
                    Total Amount: ${donationsData.reduce((sum, donation) => sum + Number(donation.amount || 0), 0).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Activity Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-2 text-sm text-muted-foreground">
                    Total Activities: {activitiesData.length}
                  </p>
                  <p className="mb-2 text-sm text-muted-foreground">
                    Participants: {activitiesData.reduce((sum, activity) => sum + Number(activity.participants || activity.registeredCount || 0), 0)}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="exports">
          <Card>
            <CardHeader>
              <CardTitle>Export Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                This section will allow you to export detailed reports as PDF or CSV. 
                Currently, you can generate and download charts from the Charts & Graphs tab.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
