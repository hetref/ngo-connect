"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Plus, Users } from "lucide-react";
import { getFirestore, doc, getDoc, onSnapshot } from "firebase/firestore";
// import { getAuth } from "firebase/auth";
import { auth } from "@/lib/firebase";
// import { useAuth } from "@/context/AuthContext"; // Adjust import based on your auth setup

export default function NGOActivitiesPage() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;
  const db = getFirestore();

  useEffect(() => {
    // if (!user?.uid) return;
    // console.log("user", user.uid);

    let unsubscribeActivities;

    const setupRealtimeActivities = async () => {
      try {
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

        // Get NGO document to watch activities array
        const ngoDoc = doc(db, "users", ngoId);
        const unsubscribeNGO = onSnapshot(ngoDoc, async (ngoSnapshot) => {
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
  }, [user?.uid, db]);

  if (loading) {
    return <div className="container mx-auto">Loading...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto"
    >
      <div className="flex justify-between items-center mb-8">
        <h1 className="mb-8 text-3xl font-bold">Activity Management</h1>
        <Link
          href="/dashboard/ngo/activities/new"
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-[#1CAC78] rounded-md shadow-sm"
        >
          Create Activity <Plus className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {activities.map((activity) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Link href={`/dashboard/ngo/activities/${activity.id}`}>
              <Card className="cursor-pointer overflow-hidden transition-shadow hover:shadow-lg">
                <img
                  src={activity.featuredImageUrl || "/placeholder.svg"}
                  alt={activity.eventName}
                  className="h-48 w-full object-cover"
                />
                <CardHeader>
                  <CardTitle>{activity.eventName}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>{activity.eventDate}</span>
                  </div>
                  <div className="mt-2 flex items-center space-x-2 text-sm text-gray-500">
                    <MapPin className="h-4 w-4" />
                    <span>{activity.location}</span>
                  </div>
                  <div className="mt-2 flex items-center space-x-2 text-sm text-gray-500">
                    <Users className="h-4 w-4" />
                    <span>{activity.coordinator}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
