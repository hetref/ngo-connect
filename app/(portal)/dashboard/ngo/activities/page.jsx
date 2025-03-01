"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  MapPin,
  Plus,
  Users,
  Filter,
  SortDesc,
  Clock,
} from "lucide-react";
import { MetricsOverview } from "@/components/ngo-dashboard/metrics-overview";
import { auth, db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  collection,
  getDocs,
} from "firebase/firestore";
import Image from "next/image";

export default function NGOActivitiesPage() {
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const user = auth.currentUser;

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [dateFilter, setDateFilter] = useState("all"); // all, upcoming, past
  const [sortOrder, setSortOrder] = useState("newest"); // newest, oldest
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    let unsubscribeActivities;

    const setupRealtimeActivities = async () => {
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

        // Fetch categories from ngo collection
        const ngoDocRef = doc(db, "ngo", ngoId);
        const ngoSnapshot = await getDoc(ngoDocRef);
        if (ngoSnapshot.exists() && ngoSnapshot.data().categories) {
          setCategories(ngoSnapshot.data().categories);
        }

        // Get NGO document to watch activities array
        const ngoUserDoc = doc(db, "users", ngoId);
        const unsubscribeNGO = onSnapshot(ngoUserDoc, async (ngoSnapshot) => {
          if (!ngoSnapshot.exists()) {
            console.error("NGO document not found");
            return;
          }

          const activitiesArray = ngoSnapshot.data().activities || [];

          // Set up listeners for each activity
          const unsubPromises = activitiesArray.map((activityId) => {
            return new Promise((resolve) => {
              const activityDoc = doc(db, "activities", activityId);
              const unsubActivity = onSnapshot(
                activityDoc,
                (activitySnapshot) => {
                  if (activitySnapshot.exists()) {
                    setActivities((prev) => {
                      const newActivities = prev.filter(
                        (a) => a.id !== activityId
                      );
                      return [
                        ...newActivities,
                        {
                          id: activityId,
                          ...activitySnapshot.data(),
                        },
                      ];
                    });
                  }
                }
              );
              resolve(unsubActivity);
            });
          });

          // Store all unsubscribe functions
          const unsubFunctions = await Promise.all(unsubPromises);
          unsubscribeActivities = () => {
            unsubFunctions.forEach((unsub) => unsub());
            unsubscribeNGO();
          };
        });

        setLoading(false);
      } catch (error) {
        console.error("Error setting up realtime activities:", error);
        setLoading(false);
      }
    };

    setupRealtimeActivities();

    return () => {
      if (unsubscribeActivities) {
        unsubscribeActivities();
      }
    };
  }, [user?.uid]);

  // Apply filters whenever the filter states or activities change
  useEffect(() => {
    if (!activities.length) {
      setFilteredActivities([]);
      return;
    }

    let result = [...activities];
    const today = new Date();

    // Apply category filter
    if (selectedCategory !== "all") {
      result = result.filter(
        (activity) => activity.category === selectedCategory
      );
    }

    // Apply date filter
    if (dateFilter === "upcoming") {
      result = result.filter((activity) => {
        const eventDate = new Date(activity.eventDate);
        return eventDate >= today;
      });
    } else if (dateFilter === "past") {
      result = result.filter((activity) => {
        const eventDate = new Date(activity.eventDate);
        return eventDate < today;
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      const dateA = new Date(a.eventDate);
      const dateB = new Date(b.eventDate);

      if (sortOrder === "newest") {
        return dateB - dateA;
      } else {
        return dateA - dateB;
      }
    });

    setFilteredActivities(result);
  }, [activities, selectedCategory, dateFilter, sortOrder]);

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const resetFilters = () => {
    setSelectedCategory("all");
    setDateFilter("all");
    setSortOrder("newest");
  };

  if (loading) {
    return <div className="container mx-auto p-8">Loading...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-4"
    >
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Activity Management</h1>
        <div className="flex gap-2">
          <button
            onClick={toggleFilters}
            className="flex items-center px-4 py-2 text-sm font-medium bg-gray-100 rounded-md shadow-sm hover:bg-gray-200"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
          <Link
            href="/dashboard/ngo/activities/new"
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-[#1CAC78] rounded-md shadow-sm hover:bg-[#18a06e]"
          >
            Create Activity <Plus className="h-4 w-4 ml-2" />
          </Link>
        </div>
      </div>

      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-gray-50 p-4 rounded-lg mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Date
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">All Events</option>
                <option value="upcoming">Upcoming Events</option>
                <option value="past">Past Events</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort Order
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <MetricsOverview />

      <div className="mt-8 mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          {filteredActivities.length}{" "}
          {filteredActivities.length === 1 ? "Activity" : "Activities"}{" "}
          {selectedCategory !== "all" ? `in ${selectedCategory}` : ""}
        </h2>
        <div className="flex items-center text-sm text-gray-500">
          <Clock className="h-4 w-4 mr-1" />
          <span>
            {dateFilter === "upcoming"
              ? "Upcoming Events"
              : dateFilter === "past"
                ? "Past Events"
                : "All Events"}
          </span>
          <SortDesc className="h-4 w-4 mx-1" />
          <span>
            {sortOrder === "newest" ? "Newest First" : "Oldest First"}
          </span>
        </div>
      </div>

      {filteredActivities.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <p className="text-gray-500">
            No activities found matching your filters.
          </p>
          {activities.length > 0 && (
            <button
              onClick={resetFilters}
              className="mt-4 px-4 py-2 text-sm font-medium text-[#1CAC78] bg-white border border-[#1CAC78] rounded-md hover:bg-[#f0f9f6]"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredActivities.map((activity) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Link href={`/dashboard/ngo/activities/${activity.id}`}>
                <Card className="cursor-pointer overflow-hidden transition-shadow hover:shadow-lg h-full">
                  <div className="relative h-48">
                    <Image
                      src={activity.featuredImageUrl || "/placeholder.svg"}
                      alt={activity.eventName}
                      layout="fill"
                      objectFit="contain"
                      className="absolute inset-0"
                    />
                  </div>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle>{activity.eventName}</CardTitle>
                      {activity.category && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {activity.category}
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(activity.eventDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center space-x-2 text-sm text-gray-500">
                      <MapPin className="h-4 w-4" />
                      <span>{activity.location}</span>
                    </div>
                    <div className="mt-2 flex items-center space-x-2 text-sm text-gray-500">
                      <Users className="h-4 w-4" />
                      <span>{activity.contactEmail}</span>
                    </div>
                    {new Date(activity.eventDate) < new Date() && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Past Event
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
