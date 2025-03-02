"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { collectionGroup, getDocs, doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { startOfWeek, format, addDays, subWeeks, parseISO } from "date-fns";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export function DonationsDashboard() {
  const [donationStats, setDonationStats] = useState({
    totalDonated: 0,
    cashDonated: 0,
    onlineDonated: 0,
    weeklyData: [],
    lastWeekData: [],
    onlineDonationsByDay: [],
    cashDonationsByDay: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState("thisWeek");
  const [viewMode, setViewMode] = useState("all"); // all, cash, online
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          console.log("No user found");
          setLoading(false);
          return;
        }

        // Get user document to check role and type
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (!userDoc.exists()) {
          console.log("User document not found");
          setLoading(false);
          return;
        }

        const userDataFromFirestore = userDoc.data();
        setUserData(userDataFromFirestore);

        // Now that we have user data, fetch donation data
        await fetchDonationData(userDataFromFirestore);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const fetchDonationData = async (userDataFromFirestore) => {
    try {
      // Determine which NGO ID to use based on user type and role
      let ngoId;

      if (userDataFromFirestore.type === "ngo") {
        if (userDataFromFirestore.role === "admin") {
          // For NGO admin, use their own ID
          ngoId = auth.currentUser.uid;
        } else if (userDataFromFirestore.role === "member") {
          // For NGO member, use the ngoId from their user data
          ngoId = userDataFromFirestore.ngoId;
        }
      } else {
        // For other user types, use their own ID (fallback)
        ngoId = auth.currentUser.uid;
      }

      if (!ngoId) {
        console.log("No NGO ID found");
        setLoading(false);
        return;
      }

      console.log("Using NGO ID for donations:", ngoId);

      const currentYear = new Date().getFullYear().toString();
      let allDonations = [];
      let cashDonationsArray = [];
      let onlineDonationsArray = [];

      // Fetch all cash donations
      const cashDonations = await getDocs(collectionGroup(db, "cash"));
      cashDonations.forEach((doc) => {
        const path = doc.ref.path;
        if (path.includes(`donations/${ngoId}/${currentYear}`)) {
          const donationData = {
            id: doc.id,
            ...doc.data(),
            paymentMethod: "Cash",
          };

          // Ensure donation has a date
          donationData.donationDate = extractDonationDate(donationData);

          allDonations.push(donationData);
          cashDonationsArray.push(donationData);
        }
      });

      // Fetch all online donations
      const onlineDonations = await getDocs(collectionGroup(db, "online"));
      onlineDonations.forEach((doc) => {
        const path = doc.ref.path;
        if (path.includes(`donations/${ngoId}/${currentYear}`)) {
          const donationData = {
            id: doc.id,
            ...doc.data(),
            paymentMethod: "Online",
          };

          // Ensure donation has a date
          donationData.donationDate = extractDonationDate(donationData);

          allDonations.push(donationData);
          onlineDonationsArray.push(donationData);
        }
      });

      console.log("Cash donations:", cashDonationsArray);
      console.log("Online donations:", onlineDonationsArray);

      // Calculate total donations
      const totalDonated = allDonations.reduce(
        (sum, donation) => sum + Number(donation.amount || 0),
        0
      );

      // Calculate cash donations
      const cashDonated = cashDonationsArray.reduce(
        (sum, donation) => sum + Number(donation.amount || 0),
        0
      );

      // Calculate online donations
      const onlineDonated = onlineDonationsArray.reduce(
        (sum, donation) => sum + Number(donation.amount || 0),
        0
      );

      // Generate weekly data for this week (all donations)
      const weeklyData = generateWeeklyData(allDonations, false);

      // Generate weekly data for last week (all donations)
      const lastWeekData = generateWeeklyData(allDonations, true);

      // Generate weekly data for this week (cash donations only)
      const cashDonationsByDay = generateWeeklyData(cashDonationsArray, false);

      // Generate weekly data for this week (online donations only)
      const onlineDonationsByDay = generateWeeklyData(
        onlineDonationsArray,
        false
      );

      setDonationStats({
        totalDonated,
        cashDonated,
        onlineDonated,
        weeklyData,
        lastWeekData,
        cashDonationsByDay,
        onlineDonationsByDay,
      });
      setLoading(false);
    } catch (error) {
      console.error("Error fetching donation data:", error);
      setLoading(false);
    }
  };

  // Extract donation date from various possible fields
  const extractDonationDate = (donation) => {
    // Try different date fields in order of preference
    if (donation.donatedOn) {
      return donation.donatedOn;
    } else if (donation.timestamp) {
      // Handle timestamp as string or Date object
      if (donation.timestamp instanceof Date) {
        return donation.timestamp.toISOString().split("T")[0];
      } else if (typeof donation.timestamp === "string") {
        // Try to parse as ISO date first
        try {
          return donation.timestamp.includes("T")
            ? donation.timestamp.split("T")[0]
            : donation.timestamp;
        } catch (e) {
          // If not ISO format, might be a locale string or other format
          try {
            return new Date(donation.timestamp).toISOString().split("T")[0];
          } catch (e2) {
            console.warn("Could not parse timestamp:", donation.timestamp);
            return null;
          }
        }
      }
    } else if (donation.createdAt) {
      // Handle createdAt field if it exists
      if (donation.createdAt instanceof Date) {
        return donation.createdAt.toISOString().split("T")[0];
      } else if (typeof donation.createdAt === "string") {
        try {
          return donation.createdAt.includes("T")
            ? donation.createdAt.split("T")[0]
            : donation.createdAt;
        } catch (e) {
          return new Date(donation.createdAt).toISOString().split("T")[0];
        }
      }
    }

    // If no date field found, use current date
    console.warn("No date field found for donation:", donation.id);
    return new Date().toISOString().split("T")[0];
  };

  // Generate data for the current week or last week
  const generateWeeklyData = (donations, isLastWeek) => {
    const today = new Date();
    let weekStart = startOfWeek(today);

    // If we want last week's data, subtract a week
    if (isLastWeek) {
      weekStart = subWeeks(weekStart, 1);
    }

    // Initialize data for each day of the week
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      weekDays.push({
        name: format(day, "EEE"),
        date: format(day, "yyyy-MM-dd"),
        total: 0,
      });
    }

    // Add donation amounts to the corresponding days
    donations.forEach((donation) => {
      const donationDate = donation.donationDate;

      if (donationDate) {
        const dayIndex = weekDays.findIndex((day) => day.date === donationDate);
        if (dayIndex !== -1) {
          weekDays[dayIndex].total += Number(donation.amount || 0);
        }
      }
    });

    return weekDays;
  };

  // Get the appropriate data based on selection
  const getChartData = () => {
    // First determine which week we're looking at
    const weekData =
      selectedWeek === "thisWeek"
        ? donationStats.weeklyData
        : donationStats.lastWeekData;

    // If we're in "all" view mode, return the combined data
    if (viewMode === "all") {
      return weekData;
    }

    // Otherwise, return the specific donation type data
    if (viewMode === "cash") {
      return donationStats.cashDonationsByDay;
    } else if (viewMode === "online") {
      return donationStats.onlineDonationsByDay;
    }

    // Default fallback
    return weekData;
  };

  // Handle radio button change for week selection
  const handleWeekChange = (value) => {
    setSelectedWeek(value);
  };

  // Handle radio button change for view mode
  const handleViewModeChange = (value) => {
    setViewMode(value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
      {/* Stats Cards */}
      <div className="md:col-span-3 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Donations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading
                ? "Loading..."
                : `₹${donationStats.totalDonated.toLocaleString()}`}
            </div>
            <p className="text-xs text-muted-foreground">
              Combined cash and online donations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Cash Donations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading
                ? "Loading..."
                : `₹${donationStats.cashDonated.toLocaleString()}`}
            </div>
            <p className="text-xs text-muted-foreground">
              Total cash donations received
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Online Donations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading
                ? "Loading..."
                : `₹${donationStats.onlineDonated.toLocaleString()}`}
            </div>
            <p className="text-xs text-muted-foreground">
              Total online donations received
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Donations Chart */}
      <div className="md:col-span-9">
        <Card>
          <CardHeader className="flex flex-col space-y-4">
            <div className="flex flex-row items-center justify-between">
              <CardTitle>Weekly Donations</CardTitle>
              <RadioGroup
                defaultValue="thisWeek"
                className="flex flex-row space-x-4"
                value={selectedWeek}
                onValueChange={handleWeekChange}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="thisWeek" id="thisWeek" />
                  <Label htmlFor="thisWeek">This Week</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="lastWeek" id="lastWeek" />
                  <Label htmlFor="lastWeek">Last Week</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex justify-end">
              <RadioGroup
                defaultValue="all"
                className="flex flex-row space-x-4"
                value={viewMode}
                onValueChange={handleViewModeChange}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all">All Donations</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cash" id="cash" />
                  <Label htmlFor="cash">Cash Only</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="online" id="online" />
                  <Label htmlFor="online">Online Only</Label>
                </div>
              </RadioGroup>
            </div>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value) => [
                    `₹${value.toLocaleString()}`,
                    "Amount",
                  ]}
                />
                <Bar dataKey="total" fill="#1CAC78" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default DonationsDashboard;
