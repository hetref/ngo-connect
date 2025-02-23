"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Facebook,
  Instagram,
  Linkedin,
  MapPin,
  Twitter,
  Upload,
} from "lucide-react";
import React, { useState } from "react";

const ProfileInformation = () => {
  const [ngoProfile, setNgoProfile] = useState({
    name: "Green Earth Initiative",
    registrationNumber: "NGO123456",
    description:
      "We are committed to environmental conservation and sustainable development.",
    phone: "+91 9876543210",
    email: "contact@greenearth.org",
    address: "123 Green Street, Eco City, India",
    website: "https://www.greenearth.org",
    facebook: "https://www.facebook.com/greenearth",
    twitter: "https://www.twitter.com/greenearth",
    instagram: "https://www.instagram.com/greenearth",
    linkedin: "https://www.linkedin.com/company/greenearth",
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>NGO Profile Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          <Avatar className="w-20 h-20">
            <AvatarImage
              src="/placeholder.svg?height=80&width=80"
              alt="NGO Logo"
            />
            <AvatarFallback>NGO</AvatarFallback>
          </Avatar>
          <div>
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" /> Upload Logo
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              Recommended: 600x600px PNG or JPG
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="ngo-name">NGO Name</Label>
            <Input
              id="ngo-name"
              value={ngoProfile.name}
              onChange={(e) =>
                setNgoProfile({ ...ngoProfile, name: e.target.value })
              }
              className="border-gray-300"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="registration-number">Registration Number</Label>
            <Input
              id="registration-number"
              value={ngoProfile.registrationNumber}
              onChange={(e) =>
                setNgoProfile({
                  ...ngoProfile,
                  registrationNumber: e.target.value,
                })
              }
              className="border-gray-300"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Description/About</Label>
            <Textarea
              id="description"
              value={ngoProfile.description}
              onChange={(e) =>
                setNgoProfile({
                  ...ngoProfile,
                  description: e.target.value,
                })
              }
              className="border-gray-300"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={ngoProfile.phone}
              onChange={(e) =>
                setNgoProfile({ ...ngoProfile, phone: e.target.value })
              }
              className="border-gray-300"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={ngoProfile.email}
              onChange={(e) =>
                setNgoProfile({ ...ngoProfile, email: e.target.value })
              }
              className="border-gray-300"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Address</Label>
            <div className="flex space-x-2">
              <Input
                id="address"
                value={ngoProfile.address}
                onChange={(e) =>
                  setNgoProfile({
                    ...ngoProfile,
                    address: e.target.value,
                  })
                }
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
              onChange={(e) =>
                setNgoProfile({ ...ngoProfile, website: e.target.value })
              }
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
                onChange={(e) =>
                  setNgoProfile({
                    ...ngoProfile,
                    facebook: e.target.value,
                  })
                }
                className="border-gray-300"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Twitter className="h-5 w-5 text-blue-400" />
              <Input
                value={ngoProfile.twitter}
                onChange={(e) =>
                  setNgoProfile({
                    ...ngoProfile,
                    twitter: e.target.value,
                  })
                }
                className="border-gray-300"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Instagram className="h-5 w-5 text-pink-600" />
              <Input
                value={ngoProfile.instagram}
                onChange={(e) =>
                  setNgoProfile({
                    ...ngoProfile,
                    instagram: e.target.value,
                  })
                }
                className="border-gray-300"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Linkedin className="h-5 w-5 text-blue-700" />
              <Input
                value={ngoProfile.linkedin}
                onChange={(e) =>
                  setNgoProfile({
                    ...ngoProfile,
                    linkedin: e.target.value,
                  })
                }
                className="border-gray-300"
              />
            </div>
          </div>
        </div>
        <Button className="w-full md:w-auto bg-[#1CAC78] hover:bg-[#158f63]">
          Save Profile Changes
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProfileInformation;
