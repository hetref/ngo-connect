"use client";
import React, { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import Link from "next/link";
import Image from "next/image";
import { Calendar, MapPin, Users, Plus, QrCode } from "lucide-react";
import { motion } from "framer-motion";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const CoordinatedActivitiesPage = () => {
  const [activityIds, setActivityIds] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  useEffect(() => {
    const fetchCoordinatedActivities = async () => {
      try {
        // Make sure user is authenticated
        const user = auth.currentUser;
        if (!user) {
          setError("User not authenticated");
          setLoading(false);
          return;
        }

        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && docSnap.data().coordinatedEvents) {
          console.log("Document data:", docSnap.data().coordinatedEvents);
          setActivityIds(docSnap.data().coordinatedEvents);
        } else {
          console.log("No coordinated events found!");
          setActivityIds([]);
        }
      } catch (e) {
        console.error("Error getting user document:", e);
        setError("Failed to fetch coordinated events");
      } finally {
        setLoading(false);
      }
    };

    fetchCoordinatedActivities();
  }, []);

  useEffect(() => {
    const fetchActivities = async () => {
      if (activityIds.length === 0) {
        setActivities([]);
        return;
      }

      try {
        const fetchedActivities = [];

        for (const id of activityIds) {
          const activityRef = doc(db, "activities", id);
          const activitySnap = await getDoc(activityRef);

          if (activitySnap.exists()) {
            fetchedActivities.push({
              id: activitySnap.id,
              ...activitySnap.data(),
            });
          } else {
            console.log(`Activity with ID ${id} not found`);
          }
        }

        console.log("Fetched Activities:", fetchedActivities);
        setActivities(fetchedActivities);
      } catch (e) {
        console.error("Error fetching activities:", e);
        setError("Failed to fetch activity details");
      }
    };

    if (activityIds.length > 0) {
      fetchActivities();
    }
  }, [activityIds]);

  const handleScanNow = (activityId) => {
    console.log(`Scanning activity: ${activityId}`);
    // Navigate to scan page or open scanner
    // You can implement this based on your application's requirements
    router.push(`/dashboard/scan/volunteers/${activityId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-500 text-lg">{error}</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1 className="text-3xl font-bold mb-4 md:mb-0">
          Coordinated Activities
        </h1>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4 font-bold text-2xl">
            You are not a co-ordinator of any activities yet!!!
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
          {activities.map((activity) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="h-full flex flex-col overflow-hidden transition-shadow hover:shadow-lg">
                <div className="relative h-48 bg-gray-100">
                  <Image
                    src={activity.featuredImageUrl || "/placeholder.svg"}
                    alt={activity.eventName || "Activity"}
                    fill
                    className="object-cover"
                  />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">
                    {activity.eventName || "Unnamed Activity"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4 flex-grow">
                  <div className="space-y-2">
                    {activity.eventDate && (
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Calendar className="h-4 w-4 flex-shrink-0" />
                        <span>{activity.eventDate}</span>
                      </div>
                    )}
                    {activity.location && (
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span>{activity.location}</span>
                      </div>
                    )}
                    {activity.coordinator && (
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Users className="h-4 w-4 flex-shrink-0" />
                        <span>{activity.coordinator}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="pt-0 flex justify-between">
                  <Link href={`/dashboard/ngo/activities/${activity.id}`}>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </Link>
                  <Button
                    onClick={() => handleScanNow(activity.id)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                  >
                    <QrCode className="mr-2 h-4 w-4" />
                    Scan Now
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default CoordinatedActivitiesPage;
