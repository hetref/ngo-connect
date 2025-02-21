"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, MapPin, Facebook, Twitter, Instagram, Linkedin, Lock, CreditCard, Moon, Sun } from "lucide-react";


const NGOSettingsPage = () => {
  const [darkMode, setDarkMode] = useState(false);

  // Effect to handle dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const [ngoProfile, setNgoProfile] = useState({
    name: "Green Earth Initiative",
    registrationNumber: "NGO123456",
    description: "We are committed to environmental conservation and sustainable development.",
    phone: "+91 9876543210",
    email: "contact@greenearth.org",
    address: "123 Green Street, Eco City, India",
    website: "https://www.greenearth.org",
    facebook: "https://www.facebook.com/greenearth",
    twitter: "https://www.twitter.com/greenearth",
    instagram: "https://www.instagram.com/greenearth",
    linkedin: "https://www.linkedin.com/company/greenearth",
  });

  const [teamMembers] = useState([
    { id: 1, name: "John Doe", role: "Admin", email: "john@greenearth.org" },
    { id: 2, name: "Jane Smith", role: "Coordinator", email: "jane@greenearth.org" },
    { id: 3, name: "Alice Johnson", role: "Volunteer", email: "alice@greenearth.org" },
  ]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-4 space-y-8"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">NGO Settings</h1>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setDarkMode(!darkMode)}
          className="rounded-full"
        >
          {darkMode ? (
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          ) : (
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          )}
        </Button>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="donations">Donations</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>NGO Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src="/placeholder.svg?height=80&width=80" alt="NGO Logo" />
                  <AvatarFallback>NGO</AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" /> Upload Logo
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">Recommended: 200x200px PNG or JPG</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ngo-name">NGO Name</Label>
                  <Input
                    id="ngo-name"
                    value={ngoProfile.name}
                    onChange={(e) => setNgoProfile({ ...ngoProfile, name: e.target.value })}
                    className="border-gray-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registration-number">Registration Number</Label>
                  <Input
                    id="registration-number"
                    value={ngoProfile.registrationNumber}
                    onChange={(e) => setNgoProfile({ ...ngoProfile, registrationNumber: e.target.value })}
                    className="border-gray-300"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description/About</Label>
                  <Textarea
                    id="description"
                    value={ngoProfile.description}
                    onChange={(e) => setNgoProfile({ ...ngoProfile, description: e.target.value })}
                    className="border-gray-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={ngoProfile.phone}
                    onChange={(e) => setNgoProfile({ ...ngoProfile, phone: e.target.value })}
                    className="border-gray-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={ngoProfile.email}
                    onChange={(e) => setNgoProfile({ ...ngoProfile, email: e.target.value })}
                    className="border-gray-300"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="address"
                      value={ngoProfile.address}
                      onChange={(e) => setNgoProfile({ ...ngoProfile, address: e.target.value })}
                      className="border-gray-300"
                    />
                    <Button variant="outline">
                      <MapPin className="mr-2 h-4 w-4" /> Set on Map
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={ngoProfile.website}
                    onChange={(e) => setNgoProfile({ ...ngoProfile, website: e.target.value })}
                    className="border-gray-300"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Social Media Links</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Facebook className="h-5 w-5 text-blue-600" />
                    <Input
                      value={ngoProfile.facebook}
                      onChange={(e) => setNgoProfile({ ...ngoProfile, facebook: e.target.value })}
                      className="border-gray-300"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Twitter className="h-5 w-5 text-blue-400" />
                    <Input
                      value={ngoProfile.twitter}
                      onChange={(e) => setNgoProfile({ ...ngoProfile, twitter: e.target.value })}
                      className="border-gray-300"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Instagram className="h-5 w-5 text-pink-600" />
                    <Input
                      value={ngoProfile.instagram}
                      onChange={(e) => setNgoProfile({ ...ngoProfile, instagram: e.target.value })}
                      className="border-gray-300"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Linkedin className="h-5 w-5 text-blue-700" />
                    <Input
                      value={ngoProfile.linkedin}
                      onChange={(e) => setNgoProfile({ ...ngoProfile, linkedin: e.target.value })}
                      className="border-gray-300"
                    />
                  </div>
                </div>
              </div>
              <Button className="w-full md:w-auto bg-[#1CAC78] hover:bg-[#158f63]">Save Profile Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verification">
          <Card>
            <CardHeader>
              <CardTitle>Verification & Compliance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>NGO Registration Certificate</Label>
                <div className="flex items-center space-x-2">
                  <Input type="file" className="border-gray-300" />
                  <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" /> Upload
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Government Recognition Status</Label>
                <Select className="border-gray-300">
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recognized">Recognized</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="not-applicable">Not Applicable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tax Exemption Certificate</Label>
                <div className="flex items-center space-x-2">
                  <Input type="file" className="border-gray-300" />
                  <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" /> Upload
                  </Button>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">Verified</Badge>
                <span className="text-sm text-muted-foreground">Your NGO is verified</span>
              </div>
              <Button className="w-full md:w-auto bg-[#1CAC78] hover:bg-[#158f63]">
                Update Verification Documents
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle>Team Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>{member.name}</TableCell>
                      <TableCell>{member.role}</TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="ml-2">
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Button className="w-full md:w-auto bg-[#1CAC78] hover:bg-[#158f63]">Invite New Member</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Event & Campaign Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Default Event Categories</Label>
                <Select className="border-gray-300">
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
                <Label>Donation Campaign Goals</Label>
                <Input type="number" placeholder="Set default goal amount" className="border-gray-300" />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="event-privacy" className="border-gray-300" />
                <Label htmlFor="event-privacy">Make events private by default</Label>
              </div>
              <Button className="w-full md:w-auto bg-[#1CAC78] hover:bg-[#158f63]">Save Event Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="donations">
          <Card>
            <CardHeader>
              <CardTitle>Donation & Payout Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Bank Account Details</Label>
                <Input placeholder="Account Number" className="border-gray-300" />
                <Input placeholder="IFSC Code" className="border-gray-300" />
                <Input placeholder="Account Holder Name" className="border-gray-300" />
              </div>
              <div className="space-y-2">
                <Label>Preferred Payment Methods</Label>
                <div className="flex space-x-2">
                  <Button variant="outline">
                    <CreditCard className="mr-2 h-4 w-4" /> UPI
                  </Button>
                  <Button variant="outline">
                    <CreditCard className="mr-2 h-4 w-4" /> Bank Transfer
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Donation Acknowledgment Message</Label>
                <Textarea placeholder="Enter your custom thank you message for donors" className="border-gray-300" />
              </div>
              <Button className="w-full md:w-auto bg-[#1CAC78] hover:bg-[#158f63]">Save Donation Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification & Communication Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch id="email-alerts" className="border-gray-300" />
                <Label htmlFor="email-alerts">Receive email alerts for new donations</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="sms-alerts" className="border-gray-300" />
                <Label htmlFor="sms-alerts">Receive SMS alerts for new volunteers</Label>
              </div>
              <div className="space-y-2">
                <Label>Custom Thank You Messages</Label>
                <Textarea placeholder="Enter your custom thank you message for donors" className="border-gray-300" />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="automated-reports" className="border-gray-300" />
                <Label htmlFor="automated-reports">Send automated monthly reports</Label>
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
                <Input id="current-password" type="password" className="border-gray-300" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" className="border-gray-300" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input id="confirm-password" type="password" className="border-gray-300" />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="two-factor-auth" className="border-gray-300" />
                <Label htmlFor="two-factor-auth">Enable Two-Factor Authentication (2FA)</Label>
              </div>
              <div className="space-y-2">
                <Label>Data Access Logs</Label>
                <Button variant="outline">
                  <Lock className="mr-2 h-4 w-4" /> View Access Logs
                </Button>
              </div>
              <Button className="w-full md:w-auto bg-[#1CAC78] hover:bg-[#158f63]">Update Security Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default NGOSettingsPage;