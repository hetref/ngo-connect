"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase"; // Ensure correct Firebase setup

export default function UserActivitiesPage() {
  const params = useParams();
  const eventId = params["activity-id"];
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    async function fetchEvent() {
      if (!eventId) return;
      try {
        const docRef = doc(db, "activities", eventId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setEvent(docSnap.data());
        } else {
          setEvent(null);
        }
      } catch (error) {
        console.error("Error fetching event:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
  }, [eventId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <h2 className="text-2xl font-semibold">Event not found</h2>
      </div>
    );
  }

  const nextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % 1);
  };

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + 1) % 1);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto"
    >
      <Card className="overflow-hidden relative">
        <div className="relative h-96">
          <img
            src={event.featuredImageUrl || "/placeholder.svg"}
            alt={event.eventName}
            className="h-full w-full object-cover"
          />
          <div className="absolute bottom-4 right-4 space-x-2">
            <Button variant="secondary" size="sm" onClick={prevImage}>
              Previous
            </Button>
            <Button variant="secondary" size="sm" onClick={nextImage}>
              Next
            </Button>
          </div>
        </div>
        <CardHeader>
          <CardTitle className="text-3xl">{event.eventName}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center space-x-4 text-gray-500">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>{event.eventDate}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>{event.location}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Accepting {event.acceptingVolunteers} volunteers</span>
            </div>
          </div>
          <p className="mb-6 text-gray-700">{event.shortDescription}</p>
          <div className="flex space-x-4">
            <Button asChild>
              <a href={`/opt-in-volunteer/${event.ngoId}/${event.eventId}`}>
                Register as Volunteer
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href={`/opt-in-participant/${event.ngoId}/${event.eventId}`}>
                Register as Participant
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
