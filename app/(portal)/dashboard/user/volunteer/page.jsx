"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  MapPin,
  Award,
  Clock,
  Building,
  AlertCircle,
  Download,
  Maximize2,
  Scan,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQRCode } from "next-qrcode";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
// import { getAuth } from "firebase/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

// Mock data for demonstration
const volunteeringStats = {
  totalEvents: 15,
  totalHours: 75,
  topCauses: ["Environment", "Education", "Healthcare"],
};

const volunteeringHistory = [
  {
    id: 1,
    name: "Beach Cleanup",
    date: "2023-07-15",
    ngo: "Clean Oceans",
    role: "Volunteer",
    badge: "5x Volunteer",
  },
  {
    id: 2,
    name: "Tree Planting",
    date: "2023-06-20",
    ngo: "Green Earth",
    role: "Team Leader",
    badge: "Community Hero",
  },
  {
    id: 3,
    name: "Food Distribution",
    date: "2023-05-10",
    ngo: "Feeding India",
    role: "Coordinator",
    badge: "Impact Maker",
  },
];

export default function UserVolunteerPage() {
  const [upcomingActivities, setUpcomingActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedQRCode, setExpandedQRCode] = useState(null);
  const [expandedQRTitle, setExpandedQRTitle] = useState("");
  const { Canvas } = useQRCode();
  const router = useRouter();

  const handleRedirect = () => {
    router.push("/dashboard/user/activities/search-activity");
};

  // Function to extract timestamp from activity ID
  const getEventTimestamp = (activityId) => {
    if (!activityId) return 0;
    const parts = activityId.split("_");
    if (parts.length > 1) {
      return parseInt(parts[1]);
    }
    return 0;
  };
  const handleScan = (activityId) => {
    router.push(`/dashboard/scan/participants/${activityId}`);
  };
  useEffect(() => {
    const fetchUpcomingActivities = async () => {
      try {
        // Get current user ID
        const currentUserId = auth.currentUser?.uid;
        if (!currentUserId) {
          throw new Error("User not authenticated");
        }

        // Get user's volunteering data
        const userDoc = await getDoc(doc(db, "users", currentUserId));
        if (!userDoc.exists()) {
          throw new Error("User data not found");
        }

        const userData = userDoc.data();
        const volunteeringArray = userData.volunteering || [];

        // Fetch full details for each volunteering activity
        const activitiesWithDetails = await Promise.all(
          volunteeringArray.map(async (volunteer) => {
            // Get activity details
            const activityDoc = await getDoc(
              doc(db, "activities", volunteer.activityId)
            );
            if (!activityDoc.exists()) return null;

            // Get NGO details
            const ngoDoc = await getDoc(doc(db, "ngo", volunteer.ngoId));

            return {
              ...volunteer,
              activityDetails: activityDoc.data(),
              ngoName: ngoDoc.exists() ? ngoDoc.data().ngoName : "Unknown NGO",
              // Create QR code data that includes activity ID and volunteer ID
              qrData: JSON.stringify({
                activityId: volunteer.activityId,
                volunteerId: currentUserId,
                // activityId: volunteer.activityId,
                sId: volunteer.sId,
                ngoId: volunteer.ngoId,
                timestamp: new Date().toISOString(),
              }),
            };
          })
        );

        // Filter out null entries and set state
        setUpcomingActivities(
          activitiesWithDetails.filter((activity) => activity !== null)
        );
      } catch (err) {
        console.error("Error fetching upcoming activities:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingActivities();
  }, []);

  // Function to format date string to more readable format
  const formatDate = (dateString) => {
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Function to download QR code as image

  // Function to open expanded QR code dialog
  const showExpandedQR = (qrData, activityName) => {
    setExpandedQRCode(qrData);
    setExpandedQRTitle(activityName);
  };

  // Function to close expanded QR code dialog
  const closeExpandedQR = () => {
    setExpandedQRCode(null);
    setExpandedQRTitle("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-4 space-y-8"
    >
      <h1 className="text-3xl font-bold mb-8">Volunteering Dashboard</h1>

      {/* Upcoming Activities Section with QR Codes */}
      <Card>
        <CardHeader>
          <CardTitle>Your Volunteering Activities</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center p-4">Loading your activities...</div>
          ) : error ? (
            <div className="text-center p-4 text-red-500">
              <AlertCircle className="w-8 h-8 mx-auto mb-2" />
              <p>{error}</p>
            </div>
          ) : upcomingActivities.length === 0 ? (
            <div className="text-center p-8">
              <p className="mb-4">
                You haven't signed up for any upcoming volunteering activities.
              </p>
              <Button className="bg-[#1CAC78] hover:bg-[#158f63]" onClick={handleRedirect}>
                Browse Activities
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <Tabs defaultValue="upcoming" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  <TabsTrigger value="attended">Attended</TabsTrigger>
                </TabsList>

                <TabsContent value="upcoming">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {upcomingActivities
                      .filter(
                        (activity) =>
                          activity.attendance === false &&
                          getEventTimestamp(activity.activityId) > Date.now()
                      )
                      .map((activity) => (
                        <Card
                          key={activity.activityId}
                          className="overflow-hidden border-l-4 border-l-[#1CAC78]"
                        >
                          <div className="flex flex-col md:flex-row">
                            <div className="p-4 flex-grow">
                              <h3 className="font-semibold text-lg">
                                {activity.activityDetails?.eventName}
                              </h3>
                              <p className="text-sm mb-2">{activity.ngoName}</p>

                              <div className="space-y-2 mt-4">
                                <div className="flex items-center text-sm text-gray-500">
                                  <Calendar className="w-4 h-4 mr-2" />
                                  <span>
                                    {formatDate(
                                      activity.activityDetails?.eventDate
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center text-sm text-gray-500">
                                  <MapPin className="w-4 h-4 mr-2" />
                                  <span>
                                    {activity.activityDetails?.location}
                                  </span>
                                </div>
                                <div className="flex items-center text-sm text-gray-500">
                                  <Clock className="w-4 h-4 mr-2" />
                                  <span>
                                    {activity.activityDetails?.contactEmail}
                                  </span>
                                </div>
                              </div>

                              <Badge className="mt-4" variant="outline">
                                Pending
                              </Badge>
                            </div>

                            <div className="p-4 bg-gray-50 flex flex-col items-center justify-center min-w-[160px]">
                              <p className="text-xs text-gray-500 mb-2">
                                Show QR at event
                              </p>
                              <Canvas
                                text={activity.qrData}
                                options={{
                                  errorCorrectionLevel: "M",
                                  margin: 3,
                                  scale: 4,
                                  width: 120,
                                  color: {
                                    dark: "#1CAC78",
                                    light: "#FFFFFF",
                                  },
                                }}
                              />
                              <div className="flex mt-3 space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex items-center text-xs"
                                  onClick={() =>
                                    showExpandedQR(
                                      activity.qrData,
                                      activity.activityDetails?.name
                                    )
                                  }
                                >
                                  <Maximize2 className="w-3 h-3 mr-1" />
                                  Expand
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                  </div>

                  {upcomingActivities.filter(
                    (activity) =>
                      activity.attendance === false &&
                      getEventTimestamp(activity.activityId) > Date.now()
                  ).length === 0 && (
                    <div className="text-center p-6 bg-gray-50 rounded-lg">
                      <p>No upcoming activities found.</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="attended">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {upcomingActivities
                      .filter(
                        (activity) =>
                          activity.attendance === true ||
                          getEventTimestamp(activity.activityId) < Date.now()
                      )
                      .map((activity) => (
                        <Card
                          key={activity.activityId}
                          className="overflow-hidden border-l-4 border-l-green-500"
                        >
                          <div className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h3 className="font-semibold text-lg">
                                  {activity.activityDetails?.eventName}
                                </h3>
                                <p className="text-sm">{activity.ngoName}</p>
                              </div>
                              <Badge variant="outline" className="bg-green-50">
                                Attended
                              </Badge>
                            </div>
                            <div className="flex justify-between items-end ">
                              <div className="space-y-2 mt-4">
                                <div className="flex items-center text-sm text-gray-500">
                                  <Calendar className="w-4 h-4 mr-2" />
                                  <span>
                                    {formatDate(
                                      activity.activityDetails?.eventDate
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center text-sm text-gray-500">
                                  <MapPin className="w-4 h-4 mr-2" />
                                  <span>
                                    {activity.activityDetails?.location}
                                  </span>
                                </div>
                                <div className="flex items-center text-sm text-gray-500">
                                  <Clock className="w-4 h-4 mr-2" />
                                  <span>
                                    {activity.activityDetails?.contactEmail}
                                  </span>
                                </div>
                              </div>
                              <Button
                                className="bg-green-500"
                                onClick={() => handleScan(activity.activityId)}
                              >
                                <Scan /> Scan Now
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                  </div>

                  {upcomingActivities.filter(
                    (activity) =>
                      activity.attendance === false &&
                      getEventTimestamp(activity.activityId) > Date.now()
                  ).length === 0 && (
                    <div className="text-center p-6 bg-gray-50 rounded-lg">
                      <p>No attended activities found.</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Total Volunteering Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <h3 className="text-2xl font-bold">
                {volunteeringStats.totalEvents}
              </h3>
              <p className="text-gray-500">Total Events</p>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold">
                {volunteeringStats.totalHours}
              </h3>
              <p className="text-gray-500">Total Hours</p>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold">
                {volunteeringStats.topCauses.join(", ")}
              </h3>
              <p className="text-gray-500">Top Causes Supported</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Volunteering History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {volunteeringHistory.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between border-b pb-4"
              >
                <div>
                  <h3 className="font-semibold">{event.name}</h3>
                  <p className="text-sm text-gray-500">{event.ngo}</p>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>{event.date}</span>
                    <Badge className="ml-2">{event.role}</Badge>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="secondary">
                    <Award className="w-4 h-4 mr-1" />
                    {event.badge}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-100 rounded-lg">
              <Award className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <h3 className="font-semibold">5x Volunteer</h3>
              <p className="text-sm text-gray-500">Participated in 5 events</p>
            </div>
            <div className="text-center p-4 bg-gray-100 rounded-lg">
              <Award className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <h3 className="font-semibold">Community Hero</h3>
              <p className="text-sm text-gray-500">Led a team in an event</p>
            </div>
            <div className="text-center p-4 bg-gray-100 rounded-lg">
              <Award className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <h3 className="font-semibold">Impact Maker</h3>
              <p className="text-sm text-gray-500">Coordinated a major event</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <Button className="bg-[#1CAC78] hover:bg-[#158f63]" onClick={handleRedirect}>
          Join More Events!
        </Button>
      </div>

      {/* Expanded QR Code Alert Dialog */}
      <AlertDialog
        open={expandedQRCode !== null}
        onOpenChange={closeExpandedQR}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center">
              {expandedQRTitle} QR Code
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Present this QR code at the event check-in
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex justify-center py-6">
            {expandedQRCode && (
              <Canvas
                text={expandedQRCode}
                options={{
                  errorCorrectionLevel: "M",
                  margin: 3,
                  scale: 8,
                  width: 250,
                  color: {
                    dark: "#1CAC78",
                    light: "#FFFFFF",
                  },
                }}
              />
            )}
          </div>

          <AlertDialogFooter className="flex-col space-y-2">
            <AlertDialogAction className="w-full">Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
