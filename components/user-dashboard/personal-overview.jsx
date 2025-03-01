import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase"; // Make sure you have this firebase config file
import { auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth";

export function PersonalOverview() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userId = currentUser.uid; // Get logged-in user's UID
          const userDoc = await getDoc(doc(db, "users", userId));

          if (userDoc.exists()) {
            const userData = userDoc.data();

            setUser({
              name: userData.name || "User",
              avatar: userData.avatar || "/placeholder-avatar.jpg",
              address: userData.address,
              email: userData.email,
              phone: userData.phone,
              membershipStatus: userData.membershipStatus || "Member",
              badges: userData.badges || ["Community Member"],
              stats: {
                eventsVolunteered: userData.eventsVolunteered || 0,
                totalDonations: userData.totalDonations || 0,
                badgesEarned: userData.badgesEarned || 0,
                upcomingEvents: userData.upcomingEvents || 0,
              },
            });
          } else {
            setError("User not found");
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
          setError("Failed to load user data");
        } finally {
          setLoading(false);
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 flex justify-center items-center">
          <div className="animate-pulse text-center">
            <p>Loading your profile...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error || !user) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-red-500">
            <p>{error || "Something went wrong"}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl">
          Welcome back, {user.name}! Here's your impact summary.
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>
              {user.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-bold">{user.name}</h2>
            <p className="text-muted-foreground">{user.membershipStatus}</p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
              {user.badges.map((badge, index) => (
                <Badge key={index} variant="secondary">
                  {badge}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        
        {/* User contact info */}
        <div className="p-4 bg-secondary/30 rounded-lg space-y-2">
          <p><span className="font-medium">Email:</span> {user.email}</p>
          <p><span className="font-medium">Phone:</span> {user.phone}</p>
          <p><span className="font-medium">Address:</span> {user.address}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="flex flex-col items-center p-3 bg-secondary rounded-lg">
            <span className="text-xl sm:text-2xl font-bold">
              ✅ {user.stats.eventsVolunteered}
            </span>
            <span className="text-xs sm:text-sm text-muted-foreground text-center">
              Events Volunteered
            </span>
          </div>
          <div className="flex flex-col items-center p-3 bg-secondary rounded-lg">
            <span className="text-xl sm:text-2xl font-bold">
              ❤️ ₹{user.stats.totalDonations.toLocaleString()}
            </span>
            <span className="text-xs sm:text-sm text-muted-foreground text-center">
              Total Donations
            </span>
          </div>
          <div className="flex flex-col items-center p-3 bg-secondary rounded-lg">
            <span className="text-xl sm:text-2xl font-bold">
              🎖 {user.stats.badgesEarned}
            </span>
            <span className="text-xs sm:text-sm text-muted-foreground text-center">
              Badges Earned
            </span>
          </div>
          <div className="flex flex-col items-center p-3 bg-secondary rounded-lg">
            <span className="text-xl sm:text-2xl font-bold">
              📅 {user.stats.upcomingEvents}
            </span>
            <span className="text-xs sm:text-sm text-muted-foreground text-center">
              Upcoming Events
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}