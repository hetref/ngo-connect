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

// Static data for achievements
const achievements = [
  {
    id: 1,
    title: "5x Volunteer",
    description: "Participated in 5 events",
    icon: <Award className="w-8 h-8 mx-auto mb-2 text-yellow-500" />,
  },
  {
    id: 2,
    title: "Community Hero",
    description: "Led a team in an event",
    icon: <Award className="w-8 h-8 mx-auto mb-2 text-blue-500" />,
  },
  {
    id: 3,
    title: "Impact Maker",
    description: "Coordinated a major event",
    icon: <Award className="w-8 h-8 mx-auto mb-2 text-green-500" />,
  },
];

export default function UserVolunteerPage() {
  const [upcomingActivities, setUpcomingActivities] = useState([]);
  const [pastActivities, setPastActivities] = useState([]);
  const [attendedActivities, setAttendedActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedQRCode, setExpandedQRCode] = useState(null);
  const [expandedQRTitle, setExpandedQRTitle] = useState("");
  const [volunteeringStats, setVolunteeringStats] = useState({
    totalEvents: 0,
    totalHours: 0,
    topCauses: [],
  });
  const { Canvas } = useQRCode();
  const router = useRouter();

  // Function to check if an event is expired
  const isEventExpired = (eventDate) => {
    return new Date(eventDate) < new Date();
  };

  // Function to handle scan button click
  const handleScan = (activityId) => {
    router.push(`/dashboard/scan/participants/${activityId}`);
  };

  // Function to handle certificate download
  const handleDownloadCertificate = (activity) => {
    // In a real implementation, this would generate and download a certificate
    // For now, we'll just log that we're downloading a certificate
    console.log(
      "Downloading certificate for:",
      activity.activityDetails?.eventName
    );

    // You could implement actual certificate generation here
    // For example, redirect to a certificate generation API endpoint
    // window.open(`/api/generate-certificate/${activity.activityId}/${activity.volunteerId}`, '_blank');

    // Or you could generate a PDF client-side using a library like jsPDF
    alert(
      "Certificate download started for: " + activity.activityDetails?.eventName
    );
  };

  useEffect(() => {
    const fetchVolunteerActivities = async () => {
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
                sId: volunteer.sId,
                ngoId: volunteer.ngoId,
                timestamp: new Date().toISOString(),
              }),
            };
          })
        );

        // Filter out null entries
        const validActivities = activitiesWithDetails.filter(
          (activity) => activity !== null
        );

        // Separate activities into upcoming, past, and attended
        const upcoming = [];
        const past = [];
        const attended = [];

        validActivities.forEach((activity) => {
          const eventExpired = isEventExpired(
            activity.activityDetails?.eventDate
          );

          if (activity.attendance === true) {
            // All attended activities go to attended array
            attended.push(activity);

            // If event is in the past and was attended, also add to past activities
            if (eventExpired) {
              past.push(activity);
            }
          } else if (eventExpired) {
            // Expired but not attended go to past
            past.push(activity);
          } else {
            // Non-expired and not attended go to upcoming
            upcoming.push(activity);
          }
        });

        setUpcomingActivities(upcoming);
        setPastActivities(past);
        setAttendedActivities(attended);

        // Calculate statistics based only on attended events
        setVolunteeringStats({
          totalEvents: attended.length,
          totalHours: attended.length * 5, // Assuming average 5 hours per event
          topCauses: calculateTopCauses(attended),
        });
      } catch (err) {
        console.error("Error fetching volunteer activities:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVolunteerActivities();
  }, []);

  // Helper function to calculate top causes from attended events
  const calculateTopCauses = (attendedEvents) => {
    // This is a placeholder for actual calculation
    // In a real app, you would categorize events by cause and count them
    const causesCount = {};

    attendedEvents.forEach((event) => {
      const cause = event.activityDetails?.category || "General";
      causesCount[cause] = (causesCount[cause] || 0) + 1;
    });

    // Sort causes by count and take top 3
    const topCauses = Object.keys(causesCount)
      .sort((a, b) => causesCount[b] - causesCount[a])
      .slice(0, 3);

    return topCauses.length > 0
      ? topCauses
      : ["Environment", "Education", "Healthcare"];
  };

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
          ) : upcomingActivities.length === 0 &&
            attendedActivities.length === 0 ? (
            <div className="text-center p-8">
              <p className="mb-4">
                You haven't signed up for any upcoming volunteering activities.
              </p>
              <Button className="bg-[#1CAC78] hover:bg-[#158f63]">
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
                    {upcomingActivities.map((activity) => (
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
                                    activity.activityDetails?.eventName
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

                  {upcomingActivities.length === 0 && (
                    <div className="text-center p-6 bg-gray-50 rounded-lg">
                      <p>No upcoming activities found.</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="attended">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {attendedActivities.map((activity) => (
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
                          <div className="flex justify-between items-end">
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
                            {!isEventExpired(
                              activity.activityDetails?.eventDate
                            ) && (
                              <Button
                                className="bg-green-500"
                                onClick={() => handleScan(activity.activityId)}
                              >
                                <Scan className="mr-2" /> Scan Now
                              </Button>
                            )}
                            {isEventExpired(
                              activity.activityDetails?.eventDate
                            ) && (
                              <Button
                                className="bg-blue-500 hover:bg-blue-600"
                                onClick={() =>
                                  handleDownloadCertificate(activity)
                                }
                              >
                                <Download className="mr-2" /> Certificate
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {attendedActivities.length === 0 && (
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
            {pastActivities.map((activity) => (
              <div
                key={activity.activityId}
                className="flex items-center justify-between border-b pb-4"
              >
                <div>
                  <h3 className="font-semibold">
                    {activity.activityDetails?.eventName}
                  </h3>
                  <p className="text-sm text-gray-500">{activity.ngoName}</p>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {formatDate(activity.activityDetails?.eventDate)}
                    </span>
                    <Badge className="ml-2">
                      {activity.attendance ? "Attended" : "Missed"}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">
                    <Award className="w-4 h-4 mr-1" />
                    Event Expired
                  </Badge>

                  {/* Add certificate download button for attended past events */}
                  {activity.attendance && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex items-center text-blue-500 border-blue-500 hover:bg-blue-50"
                      onClick={() => handleDownloadCertificate(activity)}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Certificate
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {pastActivities.length === 0 && (
              <div className="text-center p-4 text-gray-500">
                <p>No past volunteering history found.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="text-center p-4 bg-gray-100 rounded-lg"
              >
                {achievement.icon}
                <h3 className="font-semibold">{achievement.title}</h3>
                <p className="text-sm text-gray-500">
                  {achievement.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <Button className="bg-[#1CAC78] hover:bg-[#158f63]">
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
