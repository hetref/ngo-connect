"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { IndianRupee, Calendar, Users } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collectionGroup,
  getDocs,
  collection,
  query,
  where,
} from "firebase/firestore";

export function MetricsOverview() {
  const [totalDonations, setTotalDonations] = useState(0);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [totalEvents, setTotalEvents] = useState(0);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        if (!user?.uid) return;

        // Get user document to check role
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) {
          console.error("User not found");
          return;
        }

        const userData = userDoc.data();
        const userRole = userData.role;
        let ngoId;

        if (userRole === "admin") {
          ngoId = user.uid;
        } else if (userRole === "member") {
          ngoId = userData.ngoId;
          if (!ngoId) {
            console.error("NGO ID not found for member");
            return;
          }
        } else {
          console.error("Invalid user role");
          return;
        }

        // Fetch total donations
        await fetchTotalDonations(ngoId);

        // Fetch total participants
        await fetchTotalParticipants(ngoId);

        // Fetch total events
        await fetchTotalEvents(ngoId);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching metrics:", error);
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [user?.uid]);

  // Fetch total donations
  const fetchTotalDonations = async (ngoId) => {
    try {
      // Get current year
      const currentYear = new Date().getFullYear().toString();

      let allDonations = [];

      // Fetch all cash donations using collectionGroup
      const cashDonations = await getDocs(collectionGroup(db, "cash"));
      cashDonations.forEach((doc) => {
        // Only include donations that belong to this NGO and year
        const path = doc.ref.path;
        if (path.includes(`donations/${ngoId}/${currentYear}`)) {
          allDonations.push({
            id: doc.id,
            ...doc.data(),
            paymentMethod: "Cash",
          });
        }
      });

      // Fetch all online donations
      const onlineDonations = await getDocs(collectionGroup(db, "online"));
      onlineDonations.forEach((doc) => {
        // Only include donations that belong to this NGO and year
        const path = doc.ref.path;
        if (path.includes(`donations/${ngoId}/${currentYear}`)) {
          allDonations.push({
            id: doc.id,
            ...doc.data(),
            paymentMethod: "Online",
          });
        }
      });

      // Calculate total donations (excluding crypto)
      const total = allDonations
        .filter((donation) => donation.paymentMethod !== "Crypto")
        .reduce((sum, donation) => sum + Number(donation.amount || 0), 0);

      setTotalDonations(total);
    } catch (error) {
      console.error("Error fetching donations:", error);
      setTotalDonations(0);
    }
  };

  // Fetch total participants
  const fetchTotalParticipants = async (ngoId) => {
    try {
      // Query activities by NGO ID
      const activitiesQuery = query(
        collection(db, "activities"),
        where("ngoId", "==", ngoId)
      );

      const activitiesSnapshot = await getDocs(activitiesQuery);

      let participants = 0;

      activitiesSnapshot.forEach((activityDoc) => {
        const activity = activityDoc.data();
        participants += parseInt(activity.noOfParticipants || 0);
      });

      setTotalParticipants(participants);
    } catch (error) {
      console.error("Error fetching participants:", error);
      setTotalParticipants(0);
    }
  };

  // Fetch total events
  const fetchTotalEvents = async (ngoId) => {
    try {
      // Get NGO document to check activities array
      const ngoUserDoc = await getDoc(doc(db, "users", ngoId));

      if (ngoUserDoc.exists()) {
        const activitiesArray = ngoUserDoc.data().activities || [];
        setTotalEvents(activitiesArray.length);
      } else {
        setTotalEvents(0);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      setTotalEvents(0);
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Total Donations
              </p>
              <h3 className="mt-1 text-2xl font-bold">
                ₹{totalDonations ? totalDonations.toLocaleString() : "0"}
              </h3>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <IndianRupee className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Total Participants
              </p>
              <h3 className="mt-1 text-2xl font-bold">
                {totalParticipants ? totalParticipants.toLocaleString() : "0"}
              </h3>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Events</p>
              <h3 className="mt-1 text-2xl font-bold">
                {totalEvents ? totalEvents.toLocaleString() : "0"}
              </h3>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
