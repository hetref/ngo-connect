"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase"; // Adjust import path as needed
import { MetricsOverview } from "@/components/metrics-overview";
import { QuickActions } from "@/components/quick-actions";
import { RecentActivities } from "@/components/recent-activities";
import { EventInsights } from "@/components/event-insights";
import { ReportsSection } from "@/components/reports-section";
import { SponsorshipOverview } from "@/components/sponsorship-overview";
import { Notifications } from "@/components/notifications";
import { SearchAndFilters } from "@/components/search-and-filters";

export default function DashboardPage() {
  const [ngoName, setNgoName] = useState("Loading...");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNgoName = async () => {
      try {
        // Get current user
        const currentUser = auth.currentUser;
        if (!currentUser) {
          setError("User not authenticated");
          setLoading(false);
          return;
        }

        // Get user document to find ngoId
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          setError("User not found");
          setLoading(false);
          return;
        }

        const ngoId = userDoc.data().ngoId;
        if (!ngoId) {
          setError("No NGO associated with this user");
          setLoading(false);
          return;
        }

        // Get NGO document to find ngoName
        const ngoDocRef = doc(db, "ngo", ngoId);
        const ngoDoc = await getDoc(ngoDocRef);

        if (!ngoDoc.exists()) {
          setError("NGO not found");
          setLoading(false);
          return;
        }

        setNgoName(ngoDoc.data().ngoName || "Unnamed NGO");
        setLoading(false);
      } catch (err) {
        console.error("Error fetching NGO name:", err);
        setError("Failed to load NGO information");
        setLoading(false);
      }
    };

    fetchNgoName();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto"
    >
      <h1 className="mb-8 text-3xl font-bold md:text-4xl">
        {loading
          ? "Loading..."
          : error
            ? "NGO Dashboard"
            : `${ngoName} NGO Dashboard`}
      </h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="col-span-full sm:col-span-2 lg:col-span-4">
          <MetricsOverview />
        </div>
        <div className="sm:col-span-1 lg:col-span-2">
          <QuickActions />
        </div>
        <div className="sm:col-span-1 lg:col-span-2">
          <RecentActivities />
        </div>
        {/* <div className="sm:col-span-2 lg:col-span-2">
          <EventInsights />
        </div> */}
        <div className="col-span-full sm:col-span-2 lg:col-span-4">
          <ReportsSection />
        </div>
        {/* <div className="sm:col-span-1">
          <SponsorshipOverview />
        </div> */}
        {/* <div className="sm:col-span-2 lg:col-span-1">
          <Notifications />
        </div> */}
      </div>
    </motion.div>
  );
}
