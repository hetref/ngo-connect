"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { auth, db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
// import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// import {Link} from
import {
  BellIcon,
  CalendarIcon,
  DollarSignIcon,
  UsersIcon,
  HandHelpingIcon,
  IndianRupee,
} from "lucide-react";
import Link from "next/link";

export default function UserDashboardPage() {
  const user = auth.currentUser;
  const [userData, setUserData] = useState(null);
  const [participations, setParticipations] = useState([]);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.uid) return;

      try {
        // Fetch user profile data
        const userDoc = await getDoc(doc(db, "users", user.uid));

        if (userDoc.exists()) {
          setUserData(userDoc.data());
          console.log("User Data:", userDoc.data());
          // Fetch participations data
          if (
            userDoc.data().participations &&
            userDoc.data().participations.length > 0
          ) {
            const participationsWithDetails = await Promise.all(
              userDoc.data().participations.map(async (participation) => {
                const eventDoc = await getDoc(
                  doc(db, "activities", participation.activityId)
                );
                return {
                  ...participation,
                  eventDetails: eventDoc.exists() ? eventDoc.data() : null,
                  eventDate: new Date(eventDoc.data().eventDate), // Convert eventDate to Date object
                };
              })
            );
            setParticipations(participationsWithDetails);
          }

          // Fetch donations data
          const donationsSnapshot = await getDocs(
            query(
              collection(db, "users", user.uid, "donatedTo"),
              orderBy("timestamp", "desc"),
              limit(5)
            )
          );

          const donationsData = await Promise.all(
            donationsSnapshot.docs.map(async (donationDoc) => {
              const ngoDoc = await getDoc(doc(db, "ngo", donationDoc.id));
              return {
                id: donationDoc.id,
                ...donationDoc.data(),
                ngoDetails: ngoDoc.exists() ? ngoDoc.data() : null,
                timestamp: new Date(donationDoc.data().timestamp), // Convert timestamp to Date object
              };
            })
          );

          setDonations(donationsData);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const attendedActivities = participations.filter(
    (participation) => participation.attendance === true
  );

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div
            className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"
            role="status"
          >
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-2 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-4 space-y-8"
    >
      <h1 className="text-3xl font-bold mb-8">My Dashboard</h1>

      {/* Personal Overview */}
      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <CardTitle>Personal Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={userData?.photoURL} alt={userData?.name} />
              <AvatarFallback>
                {userData?.name?.charAt(0) || user?.email?.charAt(0)}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-2 flex-1">
              <h2 className="text-2xl font-semibold">
                {userData?.name || "Anonymous Volunteer"}
              </h2>
              <p className="text-gray-500">{user?.email}</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <div className="bg-blue-50 p-4 rounded-lg flex items-center gap-3">
                  <IndianRupee className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-500">Total Donated</p>
                    <p className="text-xl font-bold">
                      ₹{userData?.totalDonated || 0}
                    </p>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg flex items-center gap-3">
                  <CalendarIcon className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-500">Events Participated</p>
                    <p className="text-xl font-bold">
                      {userData?.participations?.length || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Volunteer Activities Section */}
        <div className="lg:col-span-2">
          <Card className="shadow-md h-full">
            <CardHeader className="pb-2">
              <CardTitle>Participation Activities</CardTitle>
            </CardHeader>
            <CardContent>
              {attendedActivities.length > 0 ? (
                <div className="space-y-4">
                  {attendedActivities.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                    >
                      <div className="bg-green-100 p-2 rounded-full">
                        <UsersIcon className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">
                          {activity.eventDetails?.eventName || "Event Name"}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {activity.eventDate
                            ? activity.eventDate.toLocaleDateString()
                            : "Date not available"}
                        </p>
                        <p className="text-sm mt-1">
                          {activity.eventDetails?.shortDescription?.substring(
                            0,
                            100
                          )}
                          ...
                        </p>
                      </div>
                      <Badge className="bg-green-500">Participant</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <UsersIcon className="h-12 w-12 mx-auto text-gray-300" />
                  <h3 className="mt-2 text-xl font-medium text-gray-600">
                    No activities yet
                  </h3>
                  <p className="mt-1 text-gray-500">
                    Join an event to start your volunteering journey
                  </p>
                  <Button className="mt-4">Find Opportunities</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Notifications Panel */}
        <div>
          <Card className="shadow-md h-full">
            <CardHeader className="pb-2">
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                <Link
                  href="/dashboard/user/search-activity"
                  className="w-full flex items-center justify-center gap-2 bg-black text-white p-2 rounded-lg"
                  size="lg"
                >
                  <CalendarIcon className="h-5 w-5" />
                  <span>Browse Events</span>
                </Link>
                <Link
                  href="/ngo"
                  className="w-full flex items-center justify-center gap-2 bg-black text-white p-2 rounded-lg"
                  size="lg"
                  variant="outline"
                >
                  <DollarSignIcon className="h-5 w-5" />
                  <span>Make a Donation</span>
                </Link>

                <Link
                  href="/dashboard/user/donations"
                  className="w-full flex items-center justify-center gap-2 bg-black text-white p-2 rounded-lg"
                >
                  <HandHelpingIcon className="h-5 w-5" />
                  <span>View Your Donations</span>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* <div className="md:row-span-2">
          <Card className="shadow-md h-full">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between">
                <span>Notifications</span>
                <Badge variant="outline" className="text-xs font-normal">
                  {userData?.notifications?.length || 0} new
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userData?.notifications && userData.notifications.length > 0 ? (
                <div className="space-y-4">
                  {userData.notifications
                    .slice(0, 5)
                    .map((notification, index) => (
                      <div
                        key={index}
                        className="flex gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                      >
                        <div
                          className={`bg-${notification.type === "alert" ? "red" : "blue"}-100 p-2 rounded-full flex-shrink-0`}
                        >
                          <BellIcon
                            className={`h-5 w-5 text-${notification.type === "alert" ? "red" : "blue"}-500`}
                          />
                        </div>
                        <div>
                          <p className="font-medium">{notification.title}</p>
                          <p className="text-sm text-gray-500">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {notification.timestamp
                              ? new Date(
                                  notification.timestamp.toDate()
                                ).toLocaleString()
                              : ""}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BellIcon className="h-12 w-12 mx-auto text-gray-300" />
                  <h3 className="mt-2 text-xl font-medium text-gray-600">
                    All caught up!
                  </h3>
                  <p className="mt-1 text-gray-500">No new notifications</p>
                </div>
              )}

              {userData?.notifications && userData.notifications.length > 5 && (
                <button className="w-full mt-4 py-2 text-blue-600 text-sm font-medium hover:text-blue-800">
                  View all notifications
                </button>
              )}
            </CardContent>
          </Card>
        </div> */}

        {/* Recent Donations */}
        <div className="lg:col-span-2">
          <Card className="shadow-md h-full">
            <CardHeader className="pb-2">
              <CardTitle>Recent Donations</CardTitle>
            </CardHeader>
            <CardContent>
              {donations.length > 0 ? (
                <div className="space-y-4">
                  {donations.map((donation, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                    >
                      <Avatar>
                        <AvatarImage src={donation.ngoDetails?.photoURL} />
                        <AvatarFallback>
                          {donation.ngoDetails?.ngoName?.charAt(0) || "N"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-medium">
                          {donation.ngoDetails?.ngoName || "Organization Name"}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {donation.timestamp
                            ? donation.timestamp.toLocaleDateString()
                            : "Date not available"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          ₹ {donation.amount}
                        </p>
                        <Badge variant="outline" className="mt-1">
                          {donation.campaign || "General"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <DollarSignIcon className="h-12 w-12 mx-auto text-gray-300" />
                  <h3 className="mt-2 text-xl font-medium text-gray-600">
                    No donations yet
                  </h3>
                  <p className="mt-1 text-gray-500">
                    Make a donation to support a cause you care about
                  </p>
                  <Button className="mt-4">Donate Now</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Call to Actions */}
      </div>
    </motion.div>
  );
}
