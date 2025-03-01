import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { collection, getDocs, query, limit, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"

const getEventStatus = (eventDate) => {
  const now = new Date();
  const event = new Date(eventDate);
  const oneDayInMs = 24 * 60 * 60 * 1000;
  
  // Set time to start of day for accurate comparison
  const eventStart = new Date(event.setHours(0, 0, 0, 0));
  const eventEnd = new Date(event.setHours(23, 59, 59, 999));
  
  if (now < eventStart) {
    // Event is in the future
    const daysUntil = Math.ceil((eventStart - now) / oneDayInMs);
    if (daysUntil <= 7) {
      return { status: "Soon", variant: "warning" };
    }
    return { status: "Upcoming", variant: "outline" };
  } else if (now >= eventStart && now <= eventEnd) {
    // Event is today
    return { status: "Live", variant: "success" };
  } else {
    // Event has passed
    const daysAgo = Math.ceil((now - eventEnd) / oneDayInMs);
    if (daysAgo <= 7) {
      return { status: "Recent", variant: "secondary" };
    }
    return { status: "Past", variant: "default" };
  }
};

export function EventInsights() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRandomEvents = async () => {
      try {
        // Query to get 3 random recent events
        const activitiesRef = collection(db, "activities");
        const q = query(activitiesRef, orderBy("createdAt", "desc"), limit(3));
        const querySnapshot = await getDocs(q);
        
        // Fetch events and their participant counts
        const eventsData = await Promise.all(querySnapshot.docs.map(async doc => {
          const data = doc.data();
          const eventStatus = getEventStatus(data.eventDate);
          
          // Get participants count from subcollection
          const participantsRef = collection(db, "activities", doc.id, "participants");
          const participantsSnapshot = await getDocs(participantsRef);
          const participantsCount = participantsSnapshot.size;
          
          return {
            id: doc.id,
            name: data.eventName,
            date: data.eventDate,
            volunteers: data.noOfVolunteers || 0,
            participants: participantsCount,
            status: eventStatus.status,
            statusVariant: eventStatus.variant,
            successRate: data.successRate || null
          };
        }));
        
        setEvents(eventsData);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRandomEvents();
  }, []);

  if (loading) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Event Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-40">
            Loading events...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Event Insights</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {events.map((event) => (
            <li key={event.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{event.name}</p>
                <p className="text-sm text-muted-foreground">{new Date(event.date).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm">
                  {event.volunteers} volunteers, {event.participants} participants
                </p>
                <Badge variant={event.statusVariant}>{event.status}</Badge>
                {event.successRate && <p className="text-sm text-green-600">Success rate: {event.successRate}</p>}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

