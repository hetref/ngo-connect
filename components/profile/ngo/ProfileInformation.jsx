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
import React, { useState, useEffect, useCallback, useMemo } from "react";
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
    categories: [],
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
    state: "",
    district: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCustomType, setShowCustomType] = useState(false);

  // Memoize NGO types and categories to prevent recreation on each render
  const ngoTypesAndCategories = useMemo(
    () => ({
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
    }),
    []
  );

  // Memoize computed values
  const shouldDisableInputs = useMemo(
    () =>
      (verificationStatus === "verified" && approvalStatus === "verified") ||
      (verificationStatus === "pending" && approvalStatus === "pending") ||
      isSubmitting,
    [verificationStatus, approvalStatus, isSubmitting]
  );

  const pendingTitle =
    "You cannot update the profile while the verification is in progress";

  // Use useCallback for event handlers to prevent recreation on each render
  const handleInputChange = useCallback((field, value) => {
    setNgoProfile((prevProfile) => ({
      ...prevProfile,
      [field]: value,
    }));
    setErrors((prevErrors) => ({
      ...prevErrors,
      [field]: undefined,
    }));
  }, []);

  const handleTypeChange = useCallback(
    (value) => {
      setShowCustomType(value === "Other");

      setNgoProfile((prevProfile) => {
        const updatedProfile = {
          ...prevProfile,
          type: value,
          customType: value === "Other" ? prevProfile.customType : "",
        };

        if (value !== "Other") {
          updatedProfile.categories = [...ngoTypesAndCategories[value]];
          updatedProfile.customCategory = "";
        } else {
          updatedProfile.categories = prevProfile.categories;
        }

        return updatedProfile;
      });

      setErrors((prevErrors) => ({
        ...prevErrors,
        type: undefined,
      }));
    },
    [ngoTypesAndCategories]
  );

  const handleCustomCategoryChange = useCallback((value) => {
    setNgoProfile((prevProfile) => ({
      ...prevProfile,
      customCategory: value,
      categories: value ? [value] : [],
    }));

    setErrors((prevErrors) => ({
      ...prevErrors,
      customCategory: undefined,
    }));
  }, []);

  const handleLogoUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          logoFile: "Logo file must be less than 2MB",
        }));
        return;
      }

      // Validate file type
      if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          logoFile: "Only JPG and PNG formats are allowed",
        }));
        return;
      }

      const fileURL = URL.createObjectURL(file);
      setNgoProfile((prev) => ({
        ...prev,
        logoUrl: fileURL,
        logoFile: file,
      }));

      setErrors((prev) => ({
        ...prev,
        logoFile: undefined,
      }));
    }
  }, []);

  // Fetch NGO profile data
  useEffect(() => {
    const docRef = doc(db, "ngo", userId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setNgoProfile((prevProfile) => ({
          ...prevProfile,
          ...data,
          categories: data.categories || (data.category ? [data.category] : []),
        }));

        setShowCustomType(data.type === "Other");
      }
    });

    return () => unsubscribe();
  }, [userId]);

  // Improved validation with more specific error messages
  const validateInputs = useCallback(() => {
    const newErrors = {};
    if (!ngoProfile.ngoName?.trim()) newErrors.ngoName = "NGO Name is required";
    if (!ngoProfile.name?.trim()) newErrors.name = "Name is required";
    if (!ngoProfile.registrationNumber?.trim())
      newErrors.registrationNumber = "Registration number is required";
    if (!ngoProfile.description?.trim())
      newErrors.description = "Description is required";
    if (!ngoProfile.phone?.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!ngoProfile.phone.match(/^\+?\d{10,}$/)) {
      newErrors.phone =
        "Please enter a valid phone number with at least 10 digits";
    }

    if (!ngoProfile.email?.trim()) {
      newErrors.email = "Email is required";
    } else if (!ngoProfile.email.includes("@")) {
      newErrors.email = "Please enter a valid email address";
    }

    if (ngoProfile.pan && !ngoProfile.pan.match(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)) {
      newErrors.pan = "PAN must be in format ABCDE1234F";
    }

    if (!ngoProfile.mission?.trim()) newErrors.mission = "Mission is required";
    if (!ngoProfile.vision?.trim()) newErrors.vision = "Vision is required";
    if (!ngoProfile.state?.trim()) newErrors.state = "State is required";
    if (!ngoProfile.district?.trim())
      newErrors.district = "District is required";
    if (!ngoProfile.type?.trim()) newErrors.type = "NGO Type is required";

    if (ngoProfile.type === "Other") {
      if (!ngoProfile.customType?.trim()) {
        newErrors.customType = "Custom NGO Type is required";
      }
      if (!ngoProfile.customCategory?.trim()) {
        newErrors.customCategory = "Custom NGO Category is required";
      }
      if (!ngoProfile.categories || ngoProfile.categories.length === 0) {
        newErrors.categories = "At least one category is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [ngoProfile]);

  // Optimized save changes function with better error handling
  const handleSaveChanges = useCallback(async () => {
    const toasting = toast.loading("Saving changes...");
    setIsSubmitting(true);

    try {
      if (!validateInputs()) {
        toast.error("Please fill in all required fields", { id: toasting });
        setIsSubmitting(false);
        return;
      }

      let logoFileUrl = ngoProfile.logoUrl;
      const profileToSave = { ...ngoProfile };

      if (profileToSave.type === "Other") {
        profileToSave.displayType = profileToSave.customType;
      } else {
        profileToSave.displayType = profileToSave.type;
      }

      // Handle logo upload if there's a new file
      if (ngoProfile.logoFile) {
        const logoRef = ref(storage, `ngo/${userId}/logo`);

        // Delete existing logo if it exists
        if (ngoProfile.logoUrl && ngoProfile.logoUrl.startsWith("https")) {
          try {
            await deleteObject(ref(storage, ngoProfile.logoUrl));
          } catch (error) {
            console.error("Error deleting previous logo:", error);
          }
        }

        const uploadTask = uploadBytesResumable(logoRef, ngoProfile.logoFile);

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            toast.loading(`Uploading logo: ${Math.round(progress)}%`, {
              id: toasting,
            });
          },
          (error) => {
            toast.error(`Error uploading logo: ${error.message}`, {
              id: toasting,
            });
            setIsSubmitting(false);
          },
          async () => {
            try {
              logoFileUrl = await getDownloadURL(uploadTask.snapshot.ref);

              // Clean up the profile data before saving
              const filteredProfile = prepareProfileForSave(
                profileToSave,
                logoFileUrl
              );

              await saveProfileToFirestore(filteredProfile, toasting);
            } catch (error) {
              toast.error(`Error finalizing upload: ${error.message}`, {
                id: toasting,
              });
              setIsSubmitting(false);
            }
          }
        );
      } else {
        // No new logo file, just save the profile
        const filteredProfile = prepareProfileForSave(
          profileToSave,
          logoFileUrl
        );
        await saveProfileToFirestore(filteredProfile, toasting);
      }
    } catch (error) {
      toast.error(`An unexpected error occurred: ${error.message}`, {
        id: toasting,
      });
      setIsSubmitting(false);
    }
  }, [ngoProfile, userId, validateInputs]);

  // Helper function to prepare profile data for saving
  const prepareProfileForSave = useCallback((profileData, logoUrl) => {
    // Remove empty values and null values
    const filteredProfile = Object.fromEntries(
      Object.entries(profileData).filter(
        ([key, value]) => value !== null && value !== "" && key !== "logoFile" // Explicitly exclude logoFile
      )
    );

    return {
      ...filteredProfile,
      logoUrl,
      logoFile: null, // Explicitly set logoFile to null
      updatedAt: new Date(), // Add timestamp for when profile was last updated
    };
  }, []);

  // Helper function to save profile to Firestore
  const saveProfileToFirestore = useCallback(
    async (profileData, toastId) => {
      try {
        await setDoc(doc(db, "ngo", userId), profileData, { merge: true });

        // Update local state to reflect saved changes
        setNgoProfile((prev) => ({
          ...prev,
          ...profileData,
          logoFile: null,
        }));

        toast.success("Profile updated successfully", { id: toastId });
      } catch (error) {
        toast.error(`Error updating profile: ${error.message}`, {
          id: toastId,
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [userId]
  );

  // Add this RequiredLabel component
  const RequiredLabel = ({ htmlFor, children }) => (
    <Label htmlFor={htmlFor} className="flex items-center gap-1">
      <span className="text-red-500">*</span>
      {children}
    </Label>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>NGO Profile Information</CardTitle>
        <div className="text-sm text-gray-500 mt-2">
          <span className="text-red-500">*</span> Required fields
        </div>
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
                accept="image/jpeg,image/png,image/jpg"
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
            {errors.logoFile && (
              <p className="text-red-500 text-sm mt-1">{errors.logoFile}</p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <RequiredLabel htmlFor="ngo-name">NGO Name</RequiredLabel>
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
            <RequiredLabel htmlFor="name">Your Name</RequiredLabel>
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
            <RequiredLabel htmlFor="ngo-type">NGO Type</RequiredLabel>
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
              <RequiredLabel htmlFor="custom-type">
                Specify NGO Type
              </RequiredLabel>
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
              <RequiredLabel htmlFor="custom-category">
                Specify NGO Category
              </RequiredLabel>
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
            <RequiredLabel htmlFor="registration-number">
              Darpan Registration Number
            </RequiredLabel>
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
            <RequiredLabel htmlFor="description">
              Description/About
            </RequiredLabel>
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
            <RequiredLabel htmlFor="mission">Mission</RequiredLabel>
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
            <RequiredLabel htmlFor="vision">Vision</RequiredLabel>
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
            <RequiredLabel htmlFor="phone">Phone</RequiredLabel>
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
            <RequiredLabel htmlFor="email">Email</RequiredLabel>
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
            <RequiredLabel htmlFor="state">State</RequiredLabel>
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
            <RequiredLabel htmlFor="district">District</RequiredLabel>
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
          {isSubmitting ? "Saving..." : "Save Profile Changes"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default React.memo(ProfileInformation);
