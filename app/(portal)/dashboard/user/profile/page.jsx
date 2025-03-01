"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Upload, MapPin, Download, Star, Trophy, Users } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { auth } from "@/lib/firebase"
import { useAuth } from "@/context/AuthContext"
import { db } from "@/lib/firebase"
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore"

export default function UserSettingsPage() {
  const { user } = useAuth();
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [userProfile, setUserProfile] = useState({
    name: "",
    email: "",
    phone: "",
    address: ""
  });

  const [donations, setDonations] = useState([]);
  const [events, setEvents] = useState([]);
  const [achievements, setAchievements] = useState([]);

  const fetchDonations = async (userId) => {
    try {
      console.log('Fetching donations for user:', userId);
      const donationsRef = collection(db, "users", userId, "donatedTo");
      const querySnapshot = await getDocs(donationsRef);
      const userDonations = [];
      
      console.log('Total donations in collection:', querySnapshot.size);
      
      for (const docSnapshot of querySnapshot.docs) {
        const donation = docSnapshot.data();
        console.log('Checking donation:', { id: docSnapshot.id, ...donation });
        
        // Fetch NGO details
        try {
          const ngoDocRef = doc(db, "ngo", docSnapshot.id);
          const ngoDoc = await getDoc(ngoDocRef);
          const ngoData = ngoDoc.exists() ? ngoDoc.data() : null;
          
          // Format the timestamp
          const formattedDate = new Date(donation.timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });

          userDonations.push({
            id: docSnapshot.id,
            ...donation,
            ngoName: ngoData?.ngoName || 'Unknown NGO',
            formattedDate
          });
        } catch (error) {
          console.error("Error fetching NGO details:", error);
          userDonations.push({
            id: docSnapshot.id,
            ...donation,
            ngoName: 'Unknown NGO',
            formattedDate: new Date(donation.timestamp).toLocaleDateString()
          });
        }
      }
      
      console.log('Filtered donations for user:', userDonations);
      setDonations(userDonations);
    } catch (error) {
      console.error("Error fetching donations:", error);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        setUserId(user.uid);
        try {
          setUserProfile(prev => ({
            ...prev,
            email: user.email || ""
          }));
          
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserProfile(prev => ({
              ...prev,
              name: userData.name || user.displayName || "",
              phone: userData.phone || "",
              address: userData.address || ""
            }));

            if (userData.participations) {
              setEvents(userData.participations.map(participation => ({
                id: participation.id || Math.random().toString(),
                name: participation.eventName || "Event",
                date: participation.date || "N/A",
                status: participation.status || "Pending"
              })));
            }
            
            // Fetch donations separately
            await fetchDonations(user.uid);
            
            if (userData.achievements) {
              setAchievements(userData.achievements);
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const handleProfileUpdate = async () => {
    if (!userId) return;
    
    try {
      const userDocRef = doc(db, "users", userId);
      await updateDoc(userDocRef, {
        name: userProfile.name,
        phone: userProfile.phone,
        address: userProfile.address
      });
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  if (isLoading) {
    return <div className="container mx-auto p-4">Loading user data...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-4 space-y-8"
    >
      <h1 className="text-3xl font-bold mb-8">User Settings</h1>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          {/* <TabsTrigger value="volunteer">Volunteer</TabsTrigger> */}
          <TabsTrigger value="donations">Donations</TabsTrigger>
          {/* <TabsTrigger value="events">Events</TabsTrigger>
         <TabsTrigger value="social">Social</TabsTrigger> */}
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Personal Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src="/placeholder.svg?height=80&width=80" alt="Profile Picture" />
                  <AvatarFallback>{userProfile.name?.split(' ').map(n => n[0]).join('') || 'U'}</AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" /> Upload Picture
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={userProfile.name}
                    onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userProfile.email}
                    onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })}
                    disabled // Email should be changed through Firebase Auth
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={userProfile.phone}
                    onChange={(e) => setUserProfile({ ...userProfile, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={userProfile.address}
                    onChange={(e) => setUserProfile({ ...userProfile, address: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline">
                  <MapPin className="mr-2 h-4 w-4" /> Set Location Preferences
                </Button>
              </div>
              <Button 
                className="w-full md:w-auto bg-[#1CAC78] hover:bg-[#158f63]"
                onClick={handleProfileUpdate}
              >
                Save Profile Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="donations">
          <Card>
            <CardHeader>
              <CardTitle>Donation History & Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NGO Name</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {donations.length > 0 ? donations.map((donation) => (
                    <TableRow key={donation.id}>
                      <TableCell>{donation.ngoName}</TableCell>
                      <TableCell>₹{donation.amount}</TableCell>
                      <TableCell>{donation.formattedDate}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center">No donations yet</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <Button className="w-full md:w-auto bg-[#1CAC78] hover:bg-[#158f63]">
                Download Tax Exemption Certificate
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification & Communication</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch id="email-notifications" />
                <Label htmlFor="email-notifications">Receive email notifications</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="sms-notifications" />
                <Label htmlFor="sms-notifications">Receive SMS notifications</Label>
              </div>
              <div className="space-y-2">
                <Label>Notification Preferences</Label>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="notify-donations" />
                    <Label htmlFor="notify-donations">Donation updates</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="notify-events" />
                    <Label htmlFor="notify-events">Event reminders</Label>  
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="notify-ngo-updates" />
                    <Label htmlFor="notify-ngo-updates">NGO updates</Label>
                  </div>
                </div>
              </div>
              <Button className="w-full md:w-auto bg-[#1CAC78] hover:bg-[#158f63]">
                Save Notification Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security & Privacy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input id="confirm-password" type="password" />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="two-factor-auth" />
                <Label htmlFor="two-factor-auth">Enable Two-Factor Authentication (2FA)</Label>
              </div>
              <div className="space-y-2">
                <Label>Account Deactivation</Label>
                <Button variant="destructive">Deactivate Account</Button>
              </div>
              <Button className="w-full md:w-auto bg-[#1CAC78] hover:bg-[#158f63]">Save Security Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}