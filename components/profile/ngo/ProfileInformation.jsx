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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ProfileInformation = ({ userId, approvalStatus, verificationStatus }) => {
  const [ngoProfile, setNgoProfile] = useState({
    ngoName: "",
    name: "",
    registrationNumber: "",
    description: "",
    phone: "",
    type: "",
    customType: "",
    categories: [], // Changed from single category to categories array
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
  const [showCustomType, setShowCustomType] = useState(false);

  // NGO Types and Categories mapping
  const ngoTypesAndCategories = {
    "Child Welfare Organizations": [
      "Foster Care Programs",
      "Early Childhood Development (ECD)",
      "Holistic Child Rehabilitation",
      "Vulnerable Child Protection Initiatives",
    ],
    "Environmental Conservation Organizations": [
      "Sustainable Development Programs",
      "Climate Resilience & Adaptation Strategies",
      "Biodiversity & Ecosystem Conservation",
      "Renewable Energy Advocacy",
    ],
    "Public Health & Medical Relief Organizations": [
      "Epidemic & Pandemic Preparedness",
      "Maternal & Child Health (MCH) Programs",
      "Disease Prevention & Control Campaigns",
      "Mental Health & Psychosocial Support (MHPSS)",
    ],
    "Educational Empowerment Organizations": [
      "Literacy & Numeracy Enhancement Programs",
      "Inclusive & Equitable Education Initiatives",
      "Digital & Technological Skill-building",
      "Vocational & Workforce Readiness Programs",
    ],
    Other: [],
  };

  const shouldDisableInputs =
    (verificationStatus === "verified" && approvalStatus === "verified") ||
    (verificationStatus === "pending" && approvalStatus === "pending");

  const pendingTitle =
    "You cannot update the profile while the verification is in progress";

  useEffect(() => {
    const docRef = doc(db, "ngo", userId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setNgoProfile((prevProfile) => ({
          ...prevProfile,
          ...data,
          // Ensure categories is an array
          categories: data.categories || (data.category ? [data.category] : []),
        }));

        // Check if type is "Other" to show custom type field
        if (data.type === "Other") {
          setShowCustomType(true);
        }
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
    if (!ngoProfile.type?.trim()) newErrors.type = "NGO Type is required";
    if (ngoProfile.type === "Other" && !ngoProfile.customType?.trim())
      newErrors.customType = "Custom NGO Type is required";
    if (ngoProfile.type === "Other" && !ngoProfile.customCategory?.trim())
      newErrors.customCategory = "Custom NGO Category is required";

    // Check categories only for "Other" type
    if (
      ngoProfile.type === "Other" &&
      (!ngoProfile.categories || ngoProfile.categories.length === 0)
    ) {
      newErrors.categories = "At least one category is required";
    }

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

  const handleTypeChange = (value) => {
    setShowCustomType(value === "Other");

    // When type changes, automatically assign all categories for that type
    setNgoProfile((prevProfile) => {
      const updatedProfile = {
        ...prevProfile,
        type: value,
        customType: value === "Other" ? prevProfile.customType : "",
      };

      // If non-Other type, assign all categories from that type
      if (value !== "Other") {
        updatedProfile.categories = [...ngoTypesAndCategories[value]];
        updatedProfile.customCategory = "";
      } else {
        // For "Other" type, keep existing custom categories or empty array
        updatedProfile.categories = prevProfile.categories;
      }

      return updatedProfile;
    });

    if (errors.type) {
      setErrors({ ...errors, type: undefined });
    }
  };

  const handleCustomCategoryChange = (value) => {
    setNgoProfile((prevProfile) => ({
      ...prevProfile,
      customCategory: value,
      categories: value ? [value] : [],
    }));

    if (errors.customCategory) {
      setErrors({ ...errors, customCategory: undefined });
    }
  };

  const handleSaveChanges = async () => {
    const toasting = toast.loading("Saving changes...");
    if (validateInputs()) {
      let logoFileUrl = ngoProfile.logoUrl;

      // Prepare the profile data to save
      const profileToSave = { ...ngoProfile };

      // If type is "Other", use the customType as the actual type in the database
      if (profileToSave.type === "Other") {
        profileToSave.displayType = profileToSave.customType; // Store custom type in a new field for display
      } else {
        profileToSave.displayType = profileToSave.type; // Standard type
      }

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
              Object.entries(profileToSave).filter(
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
          Object.entries(profileToSave).filter(
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
                disabled={shouldDisableInputs}
                title={shouldDisableInputs ? pendingTitle : ""}
              />
            </AvatarFallback>
          </Avatar>
          <div>
            <Button
              variant="destructive"
              onClick={() =>
                setNgoProfile({ ...ngoProfile, logoUrl: "", logoFile: null })
              }
              disabled={!ngoProfile?.logoUrl || shouldDisableInputs}
              title={shouldDisableInputs ? pendingTitle : ""}
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
              disabled={shouldDisableInputs}
              title={shouldDisableInputs ? pendingTitle : ""}
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
              disabled={shouldDisableInputs}
              title={shouldDisableInputs ? pendingTitle : ""}
            />
            {errors.name && <p className="text-red-500">{errors.name}</p>}
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="ngo-type">NGO Type</Label>
            <Select
              id="ngo-type"
              value={ngoProfile?.type || ""}
              onValueChange={handleTypeChange}
              className="border-gray-300"
              required
              disabled={shouldDisableInputs}
              title={shouldDisableInputs ? pendingTitle : ""}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select NGO Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Child Welfare Organizations">
                  Child Welfare Organizations
                </SelectItem>
                <SelectItem value="Environmental Conservation Organizations">
                  Environmental Conservation Organizations
                </SelectItem>
                <SelectItem value="Public Health & Medical Relief Organizations">
                  Public Health & Medical Relief Organizations
                </SelectItem>
                <SelectItem value="Educational Empowerment Organizations">
                  Educational Empowerment Organizations
                </SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && <p className="text-red-500">{errors.type}</p>}
          </div>

          {/* Custom Type Input - only shown when "Other" is selected */}
          {showCustomType && (
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="custom-type">Specify NGO Type</Label>
              <Input
                id="custom-type"
                value={ngoProfile?.customType || ""}
                onChange={(e) =>
                  handleInputChange("customType", e.target.value)
                }
                className="border-gray-300"
                required
                disabled={shouldDisableInputs}
                title={shouldDisableInputs ? pendingTitle : ""}
                placeholder="Enter your NGO type"
              />
              {errors.customType && (
                <p className="text-red-500">{errors.customType}</p>
              )}
            </div>
          )}

          {/* Custom Category Input - only shown when "Other" is selected for type */}
          {showCustomType && (
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="custom-category">Specify NGO Category</Label>
              <Input
                id="custom-category"
                value={ngoProfile?.customCategory || ""}
                onChange={(e) => handleCustomCategoryChange(e.target.value)}
                className="border-gray-300"
                required
                disabled={shouldDisableInputs}
                title={shouldDisableInputs ? pendingTitle : ""}
                placeholder="Enter your NGO category for activities"
              />
              {errors.customCategory && (
                <p className="text-red-500">{errors.customCategory}</p>
              )}
            </div>
          )}

          {/* Display the categories that will be stored (for user information) */}
          {ngoProfile.type &&
            ngoProfile.categories &&
            ngoProfile.categories.length > 0 && (
              <div className="space-y-2 md:col-span-2">
                <Label>Categories (automatically assigned)</Label>
                <div className="p-3 bg-gray-50 rounded-md">
                  {ngoProfile.categories.map((category, index) => (
                    <span
                      key={index}
                      className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2 mb-2"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>
            )}

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="registration-number">
              Darpan Registration Number
            </Label>
            <Input
              id="registration-number"
              value={ngoProfile?.registrationNumber || ""}
              onChange={(e) =>
                handleInputChange("registrationNumber", e.target.value)
              }
              className="border-gray-300"
              required
              disabled={shouldDisableInputs}
              title={shouldDisableInputs ? pendingTitle : ""}
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
              disabled={shouldDisableInputs}
              title={shouldDisableInputs ? pendingTitle : ""}
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
              disabled={shouldDisableInputs}
              title={shouldDisableInputs ? pendingTitle : ""}
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
              disabled={shouldDisableInputs}
              title={shouldDisableInputs ? pendingTitle : ""}
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
              disabled={shouldDisableInputs}
              title={shouldDisableInputs ? pendingTitle : ""}
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
              disabled={shouldDisableInputs}
              title={shouldDisableInputs ? pendingTitle : ""}
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
              disabled={shouldDisableInputs}
              title={shouldDisableInputs ? pendingTitle : ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pan">PAN Number</Label>
            <Input
              id="pan"
              value={ngoProfile?.pan || ""}
              onChange={(e) => handleInputChange("pan", e.target.value)}
              className="border-gray-300"
              disabled={shouldDisableInputs}
              title={shouldDisableInputs ? pendingTitle : ""}
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
                disabled={shouldDisableInputs}
                title={shouldDisableInputs ? pendingTitle : ""}
              />
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
              disabled={shouldDisableInputs}
              title={shouldDisableInputs ? pendingTitle : ""}
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
              disabled={shouldDisableInputs}
              title={shouldDisableInputs ? pendingTitle : ""}
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
                disabled={shouldDisableInputs}
                title={shouldDisableInputs ? pendingTitle : ""}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Twitter className="h-5 w-5 text-blue-400" />
              <Input
                value={ngoProfile?.twitter || ""}
                onChange={(e) => handleInputChange("twitter", e.target.value)}
                className="border-gray-300"
                disabled={shouldDisableInputs}
                title={shouldDisableInputs ? pendingTitle : ""}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Instagram className="h-5 w-5 text-pink-600" />
              <Input
                value={ngoProfile?.instagram || ""}
                onChange={(e) => handleInputChange("instagram", e.target.value)}
                className="border-gray-300"
                disabled={shouldDisableInputs}
                title={shouldDisableInputs ? pendingTitle : ""}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Linkedin className="h-5 w-5 text-blue-700" />
              <Input
                value={ngoProfile?.linkedin || ""}
                onChange={(e) => handleInputChange("linkedin", e.target.value)}
                className="border-gray-300"
                disabled={shouldDisableInputs}
                title={shouldDisableInputs ? pendingTitle : ""}
              />
            </div>
          </div>
        </div>
        <Button
          className="w-full md:w-auto bg-[#1CAC78] hover:bg-[#158f63]"
          onClick={handleSaveChanges}
          disabled={shouldDisableInputs}
          title={shouldDisableInputs ? pendingTitle : ""}
        >
          Save Profile Changes
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProfileInformation;
