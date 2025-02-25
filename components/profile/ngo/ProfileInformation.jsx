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
  X,
} from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";
import { db, storage } from "@/lib/firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  uploadBytesResumable,
} from "firebase/storage";
import toast from "react-hot-toast";

const ProfileInformation = ({ userId }) => {
  const [ngoProfile, setNgoProfile] = useState({
    ngoName: "",
    name: "",
    registrationNumber: "",
    description: "",
    phone: "",
    email: "",
    website: "",
    pan: "",
    address: "",
    facebook: "",
    twitter: "",
    instagram: "",
    linkedin: "",
    logoUrl: "",
    logoFile: null,
    mission: "",
    vision: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const docRef = doc(db, "ngo", userId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setNgoProfile((prevProfile) => ({
          ...prevProfile,
          ...docSnap.data(),
        }));
      }
    });

    // Cleanup the listener on component unmount
    return () => unsubscribe();
  }, [userId]);

  const validateInputs = () => {
    const newErrors = {};
    if (!ngoProfile.ngoName?.trim()) newErrors.ngoName = "NGO Name is required";
    if (!ngoProfile.name?.trim()) newErrors.name = "Name is required";
    if (!ngoProfile.registrationNumber?.trim())
      newErrors.registrationNumber = "Registration number is required";
    if (!ngoProfile.description?.trim())
      newErrors.description = "Description is required";
    if (!ngoProfile.phone?.trim()) newErrors.phone = "Phone number is required";
    if (!ngoProfile.email?.trim()) newErrors.email = "Email is required";
    if (ngoProfile.email && !ngoProfile.email.includes("@"))
      newErrors.email = "Invalid email address";
    if (ngoProfile.phone && !ngoProfile.phone.match(/^\+?\d{10,}$/))
      newErrors.phone = "Invalid phone number";
    if (ngoProfile.pan && !ngoProfile.pan.match(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/))
      newErrors.pan = "Invalid PAN number";
    if (!ngoProfile.mission?.trim()) newErrors.mission = "Mission is required";
    if (!ngoProfile.vision?.trim()) newErrors.vision = "Vision is required";
    if (!ngoProfile.state?.trim()) newErrors.state = "State is required";
    if (!ngoProfile.district?.trim())
      newErrors.district = "District is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileURL = URL.createObjectURL(file);
      setNgoProfile({ ...ngoProfile, logoUrl: fileURL, logoFile: file });
    }
  };

  const handleInputChange = (field, value) => {
    setNgoProfile((prevProfile) => ({
      ...prevProfile,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  const handleSaveChanges = async () => {
    const toasting = toast.loading("Saving changes...");
    if (validateInputs()) {
      console.log(ngoProfile);
      let logoFileUrl = ngoProfile.logoUrl;
      if (ngoProfile.logoFile) {
        const logoRef = ref(storage, `ngo/${userId}/logo`);
        if (ngoProfile.logoUrl && ngoProfile.logoUrl.startsWith("https")) {
          await deleteObject(ref(storage, ngoProfile.logoUrl));
          console.log("DELETED LOGO");
        }
        const uploadTask = uploadBytesResumable(logoRef, ngoProfile.logoFile);

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            // Calculate the progress percentage
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            toast.loading(`Uploading logo: ${Math.round(progress)}%`, {
              id: toasting,
            });
          },
          (error) => {
            // Handle unsuccessful uploads
            toast.error("Error uploading logo", { id: toasting });
            console.log("ERROR", error);
          },
          async () => {
            // Handle successful uploads on complete
            const logoUrl = await getDownloadURL(uploadTask.snapshot.ref);
            logoFileUrl = logoUrl;
            setNgoProfile((prevProfile) => ({
              ...prevProfile,
              logoUrl,
              logoFile: null,
            }));
            console.log("LOGOFILEURL", logoFileUrl);

            // Proceed with saving the profile
            const filteredProfile = Object.fromEntries(
              Object.entries(ngoProfile).filter(
                ([key, value]) => value !== null && value !== ""
              )
            );

            // Explicitly set logoFile to null
            filteredProfile.logoFile = null;

            await setDoc(
              doc(db, "ngo", userId),
              {
                ...filteredProfile,
                logoUrl: logoFileUrl,
              },
              { merge: true }
            )
              .then(() => {
                toast.success("Profile updated successfully", { id: toasting });
              })
              .catch((error) => {
                toast.error("Error updating profile", { id: toasting });
              });
          }
        );
      } else {
        // If no logo file, proceed with saving the profile
        const filteredProfile = Object.fromEntries(
          Object.entries(ngoProfile).filter(
            ([key, value]) => value !== null && value !== ""
          )
        );

        // Explicitly set logoFile to null
        filteredProfile.logoFile = null;

        await setDoc(
          doc(db, "ngo", userId),
          {
            ...filteredProfile,
            logoUrl: logoFileUrl,
          },
          { merge: true }
        )
          .then(() => {
            toast.success("Profile updated successfully", { id: toasting });
          })
          .catch((error) => {
            toast.error("Error updating profile", { id: toasting });
          });
      }
    } else {
      toast.error("Please fill in all required fields", { id: toasting });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>NGO Profile Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center space-x-4">
          <Avatar className="w-40 h-40 p-2 border border-black/20">
            <AvatarImage
              src={ngoProfile?.logoUrl || "/placeholder.svg?height=80&width=80"}
              alt="NGO Logo"
              className="object-contain"
            />
            <AvatarFallback className="w-full h-full">
              <Label
                htmlFor="upload-ngo-logo"
                className="flex items-center justify-center gap-2 flex-col w-full h-full cursor-pointer"
              >
                <Upload className="h-6 w-6 text-gray-500" />
              </Label>
              <Input
                type="file"
                id="upload-ngo-logo"
                onChange={handleLogoUpload}
                accept="image/*"
                className="border-gray-300 hidden"
              />
            </AvatarFallback>
          </Avatar>
          <div>
            <Button
              variant="destructive"
              onClick={() =>
                setNgoProfile({ ...ngoProfile, logoUrl: "", logoFile: null })
              }
              disabled={!ngoProfile?.logoUrl}
            >
              <X className="h-4 w-4" /> Remove
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              600 x 600px PNG/JPG
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="ngo-name">NGO Name</Label>
            <Input
              id="ngo-name"
              value={ngoProfile?.ngoName || ""}
              onChange={(e) => handleInputChange("ngoName", e.target.value)}
              className="border-gray-300"
              required
            />
            {errors.ngoName && <p className="text-red-500">{errors.ngoName}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              value={ngoProfile?.name || ""}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className="border-gray-300"
              required
            />
            {errors.name && <p className="text-red-500">{errors.name}</p>}
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="registration-number">Registration Number</Label>
            <Input
              id="registration-number"
              value={ngoProfile?.registrationNumber || ""}
              onChange={(e) =>
                handleInputChange("registrationNumber", e.target.value)
              }
              className="border-gray-300"
              required
            />
            {errors.registrationNumber && (
              <p className="text-red-500">{errors.registrationNumber}</p>
            )}
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Description/About</Label>
            <Textarea
              id="description"
              value={ngoProfile?.description || ""}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className="border-gray-300 resize-none"
              rows={3}
              required
            />
            {errors.description && (
              <p className="text-red-500">{errors.description}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="mission">Mission</Label>
            <Textarea
              id="mission"
              value={ngoProfile?.mission || ""}
              onChange={(e) => handleInputChange("mission", e.target.value)}
              className="border-gray-300 resize-none"
              rows={3}
              required
            />
            {errors.mission && <p className="text-red-500">{errors.mission}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="vision">Vision</Label>
            <Textarea
              id="vision"
              value={ngoProfile?.vision || ""}
              onChange={(e) => handleInputChange("vision", e.target.value)}
              className="border-gray-300 resize-none"
              rows={3}
              required
            />
            {errors.vision && <p className="text-red-500">{errors.vision}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={ngoProfile?.phone || ""}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              className="border-gray-300"
              required
            />
            {errors.phone && <p className="text-red-500">{errors.phone}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={ngoProfile?.email || ""}
              readOnly
              className="border-gray-300"
              required
            />
            {errors.email && <p className="text-red-500">{errors.email}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={ngoProfile?.website || ""}
              onChange={(e) => handleInputChange("website", e.target.value)}
              className="border-gray-300"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pan">PAN Number</Label>
            <Input
              id="pan"
              value={ngoProfile?.pan || ""}
              onChange={(e) => handleInputChange("pan", e.target.value)}
              className="border-gray-300"
            />
            {errors.pan && <p className="text-red-500">{errors.pan}</p>}
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Address</Label>
            <div className="flex space-x-2">
              <Input
                id="address"
                value={ngoProfile?.address || ""}
                onChange={(e) => handleInputChange("address", e.target.value)}
                className="border-gray-300"
              />
              {/* TODO: Add the Set Location using MAP Feature */}
              {/* <Button variant="outline">
                <MapPin className="mr-2 h-4 w-4" /> Set on Map
              </Button> */}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              value={ngoProfile?.state || ""}
              onChange={(e) => handleInputChange("state", e.target.value)}
              className="border-gray-300"
              required
            />
            {errors.state && <p className="text-red-500">{errors.state}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="district">District</Label>
            <Input
              id="district"
              value={ngoProfile?.district || ""}
              onChange={(e) => handleInputChange("district", e.target.value)}
              className="border-gray-300"
              required
            />
            {errors.district && (
              <p className="text-red-500">{errors.district}</p>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Social Media Links</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Facebook className="h-5 w-5 text-blue-600" />
              <Input
                value={ngoProfile?.facebook || ""}
                onChange={(e) => handleInputChange("facebook", e.target.value)}
                className="border-gray-300"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Twitter className="h-5 w-5 text-blue-400" />
              <Input
                value={ngoProfile?.twitter || ""}
                onChange={(e) => handleInputChange("twitter", e.target.value)}
                className="border-gray-300"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Instagram className="h-5 w-5 text-pink-600" />
              <Input
                value={ngoProfile?.instagram || ""}
                onChange={(e) => handleInputChange("instagram", e.target.value)}
                className="border-gray-300"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Linkedin className="h-5 w-5 text-blue-700" />
              <Input
                value={ngoProfile?.linkedin || ""}
                onChange={(e) => handleInputChange("linkedin", e.target.value)}
                className="border-gray-300"
              />
            </div>
          </div>
        </div>
        <Button
          className="w-full md:w-auto bg-[#1CAC78] hover:bg-[#158f63]"
          onClick={handleSaveChanges}
        >
          Save Profile Changes
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProfileInformation;
