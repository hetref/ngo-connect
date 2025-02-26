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
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase" // Make sure you have this firebase config file

export default function UserSettingsPage() {
  // User profile state with default values
  const [userProfile, setUserProfile] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    userId: "",
    type: "",
    createdAt: null
  })

  // Loading state
  const [isLoading, setIsLoading] = useState(true)
  
  // Other states remain the same
  const [volunteerPreferences, setVolunteerPreferences] = useState({
    skills: ["Communication", "Event Planning"],
    interests: ["Environment", "Education"],
    availability: {
      days: ["Monday", "Wednesday", "Friday"],
      hours: [9, 17],
    },
    experience: "2 years of experience in community service",
  })

  const donations = [
    { id: 1, ngo: "Green Earth", amount: 1000, date: "2023-07-15" },
    { id: 2, ngo: "Education for All", amount: 500, date: "2023-06-20" },
  ]

  const events = [
    { id: 1, name: "Beach Cleanup", date: "2023-08-01", status: "Attended" },
    { id: 2, name: "Tree Planting", date: "2023-09-15", status: "Registered" },
  ]

  const achievements = [
    { id: 1, name: "Eco Warrior", description: "Participated in 5 environmental events" },
    { id: 2, name: "Generous Donor", description: "Donated over ₹10,000" },
  ]

  // Fetch user data from Firebase on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // For this example, we'll use the userId from your provided data
        const userId = "2qHbGFAD5uMZsdqGQGFGvB13Ge82"
        const userDocRef = doc(db, "users", userId)
        const userDoc = await getDoc(userDocRef)
        
        if (userDoc.exists()) {
          const userData = userDoc.data()
          setUserProfile({
            name: userData.name || "",
            email: userData.email || "",
            // Get phone from Firebase and format it with +91 prefix if needed
            phone: userData.phone ? `+91 ${userData.phone}` : "",
            address: userData.address || "",
            userId: userData.userId || userId,
            type: userData.type || "user",
            createdAt: userData.createdAt || null
          })
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [])

  // Save profile changes to Firebase
  const saveProfileChanges = async () => {
    try {
      const userDocRef = doc(db, "users", userProfile.userId)
      
      // Process phone number to remove +91 prefix if present
      let phoneNumber = userProfile.phone
      if (phoneNumber.startsWith("+91 ")) {
        phoneNumber = phoneNumber.substring(4)
      }
      
      // Convert to number for Firebase storage
      const phoneAsNumber = Number(phoneNumber.replace(/\D/g, ''))
      
      await updateDoc(userDocRef, {
        name: userProfile.name,
        email: userProfile.email,
        phone: phoneAsNumber, // Save as number in Firebase
        address: userProfile.address
      })
      
      alert("Profile updated successfully!")
    } catch (error) {
      console.error("Error updating profile:", error)
      alert("Failed to update profile. Please try again.")
    }
  }

  // Show loading state while fetching data
  if (isLoading) {
    return <div className="container mx-auto p-4">Loading user data...</div>
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
          <TabsTrigger value="volunteer">Volunteer</TabsTrigger>
          <TabsTrigger value="donations">Donations</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
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
                onClick={saveProfileChanges}
              >
                Save Profile Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="volunteer">
          <Card>
            <CardHeader>
              <CardTitle>Volunteer Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Skills & Interests</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select skills" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="communication">Communication</SelectItem>
                    <SelectItem value="event-planning">Event Planning</SelectItem>
                    <SelectItem value="teaching">Teaching</SelectItem>
                    <SelectItem value="fundraising">Fundraising</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Preferred Volunteering Categories</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="environment">Environment</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="health">Health</SelectItem>
                    <SelectItem value="community">Community</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Availability</Label>
                <div className="flex flex-wrap gap-2">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                    <Button key={day} variant="outline" size="sm">
                      {day}
                    </Button>
                  ))}
                </div>
                <div className="pt-4">
                  <Label>Hours</Label>
                  <Slider defaultValue={[9, 17]} max={24} step={1} className="mt-2" />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>9 AM</span>
                    <span>5 PM</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience">Past Volunteer Experience</Label>
                <Textarea
                  id="experience"
                  value={volunteerPreferences.experience}
                  onChange={(e) => setVolunteerPreferences({ ...volunteerPreferences, experience: e.target.value })}
                />
              </div>
              <Button className="w-full md:w-auto bg-[#1CAC78] hover:bg-[#158f63]">Save Volunteer Preferences</Button>
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
                    <TableHead>NGO</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {donations.map((donation) => (
                    <TableRow key={donation.id}>
                      <TableCell>{donation.ngo}</TableCell>
                      <TableCell>₹{donation.amount}</TableCell>
                      <TableCell>{donation.date}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" /> Receipt
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="space-y-2">
                <Label>Set Monthly Recurring Donation</Label>
                <div className="flex space-x-2">
                  <Input type="number" placeholder="Amount" />
                  <Button variant="outline">Set Recurring</Button>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="anonymous-donation" />
                <Label htmlFor="anonymous-donation">Make donations anonymous by default</Label>
              </div>
              <Button className="w-full md:w-auto bg-[#1CAC78] hover:bg-[#158f63]">
                Download Tax Exemption Certificate
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Event Participation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>{event.name}</TableCell>
                      <TableCell>{event.date}</TableCell>
                      <TableCell>
                        <Badge variant={event.status === "Attended" ? "default" : "secondary"}>{event.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <Star className="mr-2 h-4 w-4" /> Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Button className="w-full md:w-auto bg-[#1CAC78] hover:bg-[#158f63]">Browse Upcoming Events</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle>Social & Gamification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Achievements & Badges</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {achievements.map((achievement) => (
                    <div key={achievement.id} className="flex items-center space-x-2 p-2 bg-secondary rounded-lg">
                      <Trophy className="h-8 w-8 text-[#1CAC78]" />
                      <div>
                        <p className="font-semibold">{achievement.name}</p>
                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Leaderboard Status</Label>
                <p>You are in the top 10% of volunteers this month!</p>
              </div>
              <div className="space-y-2">
                <Label>Invite Friends</Label>
                <div className="flex space-x-2">
                  <Input placeholder="Friend's email" />
                  <Button variant="outline">
                    <Users className="mr-2 h-4 w-4" /> Invite
                  </Button>
                </div>
              </div>
              <Button className="w-full md:w-auto bg-[#1CAC78] hover:bg-[#158f63]">View Full Leaderboard</Button>
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
              <div className="space-y-2">
                <Label>NGO Follow List</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select NGOs to follow" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="green-earth">Green Earth</SelectItem>
                    <SelectItem value="education-for-all">Education for All</SelectItem>
                    <SelectItem value="health-first">Health First</SelectItem>
                  </SelectContent>
                </Select>
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
              <div className="space-y-2">
                <Label>Profile Visibility</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="friends">Friends Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full md:w-auto bg-[#1CAC78] hover:bg-[#158f63]">Save Security Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}