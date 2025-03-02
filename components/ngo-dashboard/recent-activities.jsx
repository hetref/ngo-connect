import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase"; // Adjust the import path to your firebase config

export function RecentActivities() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);

        // Get current user
        const currentUser = auth.currentUser;
        if (!currentUser) {
          setError("User not authenticated");
          setLoading(false);
          return;
        }

        // Get the NGO ID from the user's document
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));

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

        // Fetch events for this NGO, ordered by eventDate
        const eventsQuery = query(
          collection(db, "activities"),
          where("ngoId", "==", ngoId),
          orderBy("eventDate", "desc"),
          limit(3)
        );

        const eventsSnapshot = await getDocs(eventsQuery);

        const activitiesData = eventsSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            type: "event",
            name: data.eventName,
            description: data.shortDescription,
            tagline: data.tagline,
            location: data.location,
            volunteerStatus: data.volunteerFormStatus,
            volunteers: {
              needed: data.acceptingVolunteers,
              current: data.noOfVolunteers,
            },
            image: data.featuredImageUrl || data.logoUrl,
            date: formatRelativeTime(new Date(data.createdAt)),
          };
        });

        setActivities(activitiesData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching activities:", err);
        setError("Failed to load activities");
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  // Helper function to format dates as relative time
  const formatRelativeTime = (date) => {
    if (!date) return "Unknown time";

    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  // Handle display of different activity types
  const getActivityDescription = (activity) => {
    switch (activity.type) {
      case "event":
        return `Created "${activity.name}" in ${activity.location}`;
      case "volunteer":
        return `Volunteers: ${activity.volunteers.current}/${activity.volunteers.needed}`;
      default:
        return activity.description || "New activity";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activities</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-center py-4">Loading activities...</p>
        ) : error ? (
          <p className="text-sm text-center text-red-500 py-4">{error}</p>
        ) : activities.length === 0 ? (
          <p className="text-sm text-center py-4">No recent activities found</p>
        ) : (
          <ul className="space-y-4">
            {activities.map((activity) => (
              <li key={activity.id} className="flex items-center space-x-4">
                <Avatar>
                  <AvatarImage
                    src={
                      activity.image ||
                      `https://api.dicebear.com/6.x/initials/svg?seed=${activity.name || "Event"}`
                    }
                  />
                  <AvatarFallback>
                    {activity.name
                      ? activity.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                      : "E"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {activity.name || "Unnamed Event"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getActivityDescription(activity)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activity.volunteerStatus === "accepting"
                      ? `Accepting volunteers: ${activity.volunteers.current}/${activity.volunteers.needed}`
                      : "Not accepting volunteers"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activity.date}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
