"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function UserActivitiesPage() {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "activities"));
        const activitiesList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setActivities(activitiesList);
      } catch (error) {
        console.error("Error fetching activities:", error);
      }
    };

    fetchActivities();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto"
    >
      <h1 className="mb-8 text-3xl font-bold">Activity Management</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {activities.length > 0 ? (
          activities.map((event) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Link href={`/dashboard/user/activities/${event.id}`}>
                <Card className="cursor-pointer overflow-hidden transition-shadow hover:shadow-lg">
                  <img
                    src={event.featuredImageUrl || "/placeholder.svg"}
                    alt={event.title}
                    className="h-48 w-full object-cover"
                  />
                  <CardHeader>
                    <CardTitle>{event.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>{event.eventDate || "No Date"}</span>
                    </div>
                    <div className="mt-2 flex items-center space-x-2 text-sm text-gray-500">
                      <MapPin className="h-4 w-4" />
                      <span>{event.location || "No Location"}</span>
                    </div>
                    <div className="mt-2 flex items-center space-x-2 text-sm text-gray-500">
                      <Users className="h-4 w-4" />
                      <span>
                        Accepting {event.acceptingVolunteers || "0"} Volunteers
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))
        ) : (
          <p className="text-gray-500">No activities found.</p>
        )}
      </div>
    </motion.div>
  );
}
