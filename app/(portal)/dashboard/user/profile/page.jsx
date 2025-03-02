"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Upload,
  MapPin,
  Download,
  Star,
  Trophy,
  Users,
  X,
  AlertCircle,
  CheckCircle,
  Mail,
  Lock,
  Shield,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { db, storage } from "@/lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  setDoc,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import toast from "react-hot-toast";
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendEmailVerification,
  verifyBeforeUpdateEmail,
  multiFactor,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  RecaptchaVerifier,
} from "firebase/auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function UserSettingsPage() {
  const { user } = useAuth();
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileImage, setProfileImage] = useState(null);
  const [profileImageURL, setProfileImageURL] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Security related states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Email verification states
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [isChangingEmail, setIsChangingEmail] = useState(false);

  // 2FA states
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [isEnabling2FA, setIsEnabling2FA] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [recaptchaVerifier, setRecaptchaVerifier] = useState(null);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const recaptchaContainerRef = useRef(null);

  const [userProfile, setUserProfile] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const [donations, setDonations] = useState([]);
  const [events, setEvents] = useState([]);
  const [achievements, setAchievements] = useState([]);

  const fetchDonations = async (userId) => {
    try {
      console.log("Fetching donations for user:", userId);
      const donationsRef = collection(db, "users", userId, "donatedTo");
      const querySnapshot = await getDocs(donationsRef);
      const userDonations = [];

      console.log("Total donations in collection:", querySnapshot.size);

      for (const docSnapshot of querySnapshot.docs) {
        const donation = docSnapshot.data();
        console.log("Checking donation:", { id: docSnapshot.id, ...donation });

        // Fetch NGO details
        try {
          const ngoDocRef = doc(db, "ngo", docSnapshot.id);
          const ngoDoc = await getDoc(ngoDocRef);
          const ngoData = ngoDoc.exists() ? ngoDoc.data() : null;

          // Format the timestamp
          const formattedDate = new Date(donation.timestamp).toLocaleDateString(
            "en-US",
            {
              year: "numeric",
              month: "long",
              day: "numeric",
            }
          );

          userDonations.push({
            id: docSnapshot.id,
            ...donation,
            ngoName: ngoData?.ngoName || "Unknown NGO",
            formattedDate,
          });
        } catch (error) {
          console.error("Error fetching NGO details:", error);
          userDonations.push({
            id: docSnapshot.id,
            ...donation,
            ngoName: "Unknown NGO",
            formattedDate: new Date(donation.timestamp).toLocaleDateString(),
          });
        }
      }

      console.log("Filtered donations for user:", userDonations);
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
          setUserProfile((prev) => ({
            ...prev,
            email: user.email || "",
          }));

          // Set email verification status
          setIsEmailVerified(user.emailVerified);

          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserProfile((prev) => ({
              ...prev,
              name: userData.name || user.displayName || "",
              phone: userData.phone || "",
              address: userData.address || "",
            }));

            // Set 2FA status if available
            setIs2FAEnabled(userData.is2FAEnabled || false);

            // Fetch profile image if exists
            if (userData.profileImageURL) {
              setProfileImageURL(userData.profileImageURL);
            }

            if (userData.participations) {
              setEvents(
                userData.participations.map((participation) => ({
                  id: participation.id || Math.random().toString(),
                  name: participation.eventName || "Event",
                  date: participation.date || "N/A",
                  status: participation.status || "Pending",
                }))
              );
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

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }

      // Check file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }

      setProfileImage(file);
      setProfileImageURL(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    setProfileImageURL(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadProfileImage = async () => {
    if (!profileImage || !userId) return null;

    try {
      setIsUploading(true);

      // Create a reference to the user's profile image in Firebase Storage
      const storageRef = ref(storage, `users/${userId}/userlogo`);

      // Check if there's an existing image to delete
      try {
        await getDownloadURL(storageRef);
        // If we get here, the file exists, so delete it
        await deleteObject(storageRef);
      } catch (error) {
        // File doesn't exist, which is fine
        console.log("No existing profile image to delete");
      }

      // Upload the new image
      await uploadBytes(storageRef, profileImage);

      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);

      return downloadURL;
    } catch (error) {
      console.error("Error uploading profile image:", error);
      toast.error("Failed to upload profile image");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleProfileUpdate = async () => {
    if (!userId) return;

    const profileUpdating = toast.loading("Updating profile...");

    try {
      // Upload profile image if there's a new one
      let profileImageURL = null;
      if (profileImage) {
        profileImageURL = await uploadProfileImage();
      }

      const userDocRef = doc(db, "users", userId);
      const updateData = {
        name: userProfile.name,
        phone: userProfile.phone,
        address: userProfile.address,
      };

      // Only add profileImageURL to update data if we have a new URL or explicitly removed it
      if (profileImageURL !== null) {
        updateData.profileImageURL = profileImageURL;
      } else if (profileImage === null && profileImageURL === null) {
        // User removed the image
        updateData.profileImageURL = null;
      }

      await updateDoc(userDocRef, updateData);

      // Reset the file input and clear the selected file
      if (profileImage) {
        setProfileImage(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }

      toast.success("Profile updated successfully", {
        id: profileUpdating,
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Error updating profile", {
        id: profileUpdating,
      });
    }
  };

  // Password reset functionality
  const handlePasswordChange = async () => {
    // Reset states
    setPasswordError("");
    setPasswordSuccess("");
    setIsChangingPassword(true);

    try {
      // Validate passwords
      if (newPassword !== confirmPassword) {
        setPasswordError("New passwords don't match");
        setIsChangingPassword(false);
        return;
      }

      if (newPassword.length < 8) {
        setPasswordError("Password must be at least 8 characters long");
        setIsChangingPassword(false);
        return;
      }

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );

      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);

      // Clear form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setPasswordSuccess("Password updated successfully");
      toast.success("Password updated successfully");
    } catch (error) {
      console.error("Error updating password:", error);

      if (error.code === "auth/wrong-password") {
        setPasswordError("Current password is incorrect");
      } else if (error.code === "auth/weak-password") {
        setPasswordError("Password is too weak");
      } else {
        setPasswordError("Failed to update password: " + error.message);
      }

      toast.error("Failed to update password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Email verification functionality
  const handleSendVerificationEmail = async () => {
    try {
      await sendEmailVerification(user);
      setIsVerificationSent(true);
      toast.success("Verification email sent. Please check your inbox.");
    } catch (error) {
      console.error("Error sending verification email:", error);
      toast.error("Failed to send verification email");
    }
  };

  const handleUpdateEmail = async () => {
    setIsChangingEmail(true);

    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmail)) {
        toast.error("Please enter a valid email address");
        setIsChangingEmail(false);
        return;
      }

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );

      await reauthenticateWithCredential(user, credential);

      // Update email
      await verifyBeforeUpdateEmail(user, newEmail);

      toast.success(
        "Verification email sent to your new email address. Please check your inbox and verify to complete the change."
      );
      setNewEmail("");
    } catch (error) {
      console.error("Error updating email:", error);

      if (error.code === "auth/wrong-password") {
        toast.error("Current password is incorrect");
      } else if (error.code === "auth/email-already-in-use") {
        toast.error("Email is already in use by another account");
      } else {
        toast.error("Failed to update email: " + error.message);
      }
    } finally {
      setIsChangingEmail(false);
    }
  };

  // 2FA functionality
  const setup2FA = async () => {
    try {
      if (!user) {
        throw new Error("You must be logged in to enable 2FA");
      }

      setIsEnabling2FA(true);

      // Clear any existing reCAPTCHA instance
      if (recaptchaVerifier) {
        recaptchaVerifier.clear();
      }

      // Create a new reCAPTCHA verifier
      const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: () => {
          console.log("reCAPTCHA verified");
        },
        "expired-callback": () => {
          toast.error("reCAPTCHA expired. Please try again.");
        },
      });

      // Render the reCAPTCHA
      await verifier.render();
      setRecaptchaVerifier(verifier);

      // Get multifactor session
      const multiFactorUser = multiFactor(user);
      const multiFactorSession = await multiFactorUser.getSession();

      // Format phone number (ensure it has country code)
      const formattedPhone = phoneNumber.startsWith("+")
        ? phoneNumber
        : `+91${phoneNumber}`; // Adjust country code as needed

      // Send verification code
      const phoneInfoOptions = {
        phoneNumber: formattedPhone,
        session: multiFactorSession,
      };

      const phoneAuthProvider = new PhoneAuthProvider(auth);
      const verificationId = await phoneAuthProvider.verifyPhoneNumber(
        phoneInfoOptions,
        verifier
      );

      setVerificationId(verificationId);
      toast.success("Verification code sent to your phone");
    } catch (error) {
      console.error("Error setting up 2FA:", error);
      toast.error("Failed to set up 2FA: " + error.message);

      if (error.code === "auth/requires-recent-login") {
        // Show re-authentication modal if needed
        setPendingAction("enable2FA");
        setShowReauthModal(true);
      }
    } finally {
      setIsEnabling2FA(false);
    }
  };

  const verifyAndEnroll2FA = async () => {
    try {
      // Create credential with the verification ID and code
      const cred = PhoneAuthProvider.credential(
        verificationId,
        verificationCode
      );
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);

      // Enroll the second factor
      const multiFactorUser = multiFactor(user);
      await multiFactorUser.enroll(multiFactorAssertion, "Phone Number");

      // Update user document to reflect 2FA status
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        is2FAEnabled: true,
        phoneFor2FA: phoneNumber,
      });

      setIs2FAEnabled(true);
      setShowVerificationDialog(false);
      toast.success("Two-factor authentication enabled successfully");
    } catch (error) {
      console.error("Error verifying 2FA:", error);
      toast.error("Failed to verify code: " + error.message);
    }
  };

  const disable2FA = async () => {
    try {
      const confirmation = confirm(
        "Are you sure you want to disable two-factor authentication? This will make your account less secure."
      );

      if (confirmation) {
        const multiFactorUser = multiFactor(user);

        // Get enrolled factors
        const enrolledFactors = multiFactorUser.enrolledFactors;

        if (enrolledFactors.length > 0) {
          // Unenroll the first factor (assuming there's only one)
          await multiFactorUser.unenroll(enrolledFactors[0]);

          // Update user document
          const userDocRef = doc(db, "users", user.uid);
          await updateDoc(userDocRef, {
            is2FAEnabled: false,
            phoneFor2FA: null,
          });

          setIs2FAEnabled(false);
          toast.success("Two-factor authentication disabled");
        }
      }
    } catch (error) {
      console.error("Error disabling 2FA:", error);
      toast.error("Failed to disable 2FA: " + error.message);
    }
  };

  // Add this useEffect to clean up reCAPTCHA when component unmounts
  useEffect(() => {
    return () => {
      if (recaptchaVerifier) {
        recaptchaVerifier.clear();
      }
    };
  }, [recaptchaVerifier]);

  if (isLoading) {
    return <div className="container mx-auto p-4">Loading user data...</div>;
  }

  // Make sure the dialog doesn't remove the reCAPTCHA container when closed
  const handleCloseVerificationDialog = () => {
    // Don't clear the reCAPTCHA verifier here
    setShowVerificationDialog(false);
  };

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
          {/* <TabsTrigger value="donations">Donations</TabsTrigger> */}
          {/* <TabsTrigger value="events">Events</TabsTrigger>
         <TabsTrigger value="social">Social</TabsTrigger> */}
          {/* <TabsTrigger value="notifications">Notifications</TabsTrigger> */}
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Personal Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="relative">
                  <Avatar className="w-20 h-20">
                    <AvatarImage
                      src={
                        profileImageURL || "/placeholder.svg?height=80&width=80"
                      }
                      alt="Profile Picture"
                    />
                    <AvatarFallback>
                      {userProfile.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("") || "U"}
                    </AvatarFallback>
                  </Avatar>
                  {profileImageURL && (
                    <button
                      onClick={handleRemoveImage}
                      className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 text-white hover:bg-red-600"
                      title="Remove image"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <div className="flex flex-col space-y-2">
                  <input
                    type="file"
                    id="profile-image"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    ref={fileInputRef}
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {profileImageURL ? "Change Picture" : "Upload Picture"}
                  </Button>
                  {isUploading && (
                    <p className="text-sm text-gray-500">Uploading...</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={userProfile.name}
                    onChange={(e) =>
                      setUserProfile({ ...userProfile, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userProfile.email}
                    onChange={(e) =>
                      setUserProfile({ ...userProfile, email: e.target.value })
                    }
                    disabled // Email should be changed through Firebase Auth
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={userProfile.phone}
                    onChange={(e) =>
                      setUserProfile({ ...userProfile, phone: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={userProfile.address}
                    onChange={(e) =>
                      setUserProfile({
                        ...userProfile,
                        address: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              {/* <div className="flex items-center space-x-2">
                <Button variant="outline">
                  <MapPin className="mr-2 h-4 w-4" /> Set Location Preferences
                </Button>
              </div> */}
              <Button
                className="w-full md:w-auto bg-[#1CAC78] hover:bg-[#158f63]"
                onClick={handleProfileUpdate}
                disabled={isUploading}
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
                  {donations.length > 0 ? (
                    donations.map((donation) => (
                      <TableRow key={donation.id}>
                        <TableCell>{donation.ngoName}</TableCell>
                        <TableCell>₹{donation.amount}</TableCell>
                        <TableCell>{donation.formattedDate}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center">
                        No donations yet
                      </TableCell>
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
                <Label htmlFor="email-notifications">
                  Receive email notifications
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="sms-notifications" />
                <Label htmlFor="sms-notifications">
                  Receive SMS notifications
                </Label>
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
              {/* Email Verification Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Email Verification</h3>

                {user && (
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`p-1 rounded-full ${isEmailVerified ? "bg-green-100" : "bg-yellow-100"}`}
                      >
                        <CheckCircle
                          className={`h-5 w-5 ${isEmailVerified ? "text-green-500" : "text-yellow-500"}`}
                        />
                      </div>
                      <span>
                        {isEmailVerified
                          ? `Your email (${userProfile.email}) is verified`
                          : `Your email (${userProfile.email}) is not verified`}
                      </span>
                    </div>

                    {!isEmailVerified && (
                      <div className="flex flex-col space-y-2">
                        <Alert className="bg-yellow-50 border-yellow-200">
                          <AlertDescription className="text-yellow-700">
                            Please verify your email address to enhance your
                            account security.
                          </AlertDescription>
                        </Alert>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            className="flex items-center space-x-2"
                            onClick={handleSendVerificationEmail}
                            disabled={isVerificationSent}
                          >
                            <Mail className="h-4 w-4" />
                            <span>
                              {isVerificationSent
                                ? "Sending..."
                                : "Send Verification Email"}
                            </span>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <hr className="my-6" />

              {/* Password Reset Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Password Reset</h3>

                {passwordError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{passwordError}</AlertDescription>
                  </Alert>
                )}

                {passwordSuccess && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <AlertTitle className="text-green-700">Success</AlertTitle>
                    <AlertDescription className="text-green-700">
                      {passwordSuccess}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handlePasswordChange}
                    disabled={
                      isChangingPassword ||
                      !currentPassword ||
                      !newPassword ||
                      !confirmPassword
                    }
                    className="w-full md:w-auto bg-[#1CAC78] hover:bg-[#158f63] flex items-center space-x-2"
                  >
                    <Lock className="h-4 w-4" />
                    <span>
                      {isChangingPassword ? "Updating..." : "Update Password"}
                    </span>
                  </Button>
                </div>
              </div>

              <hr className="my-6" />

              {/* 2FA Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">
                  Two-Factor Authentication (2FA)
                </h3>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="two-factor-auth"
                    checked={is2FAEnabled}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setShowVerificationDialog(true);
                      } else {
                        disable2FA();
                      }
                    }}
                    disabled={isEnabling2FA}
                  />
                  <Label htmlFor="two-factor-auth">
                    {is2FAEnabled
                      ? "Two-Factor Authentication is Enabled"
                      : "Enable Two-Factor Authentication (2FA)"}
                  </Label>
                </div>

                {is2FAEnabled && (
                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertDescription className="text-blue-700">
                      Your account is protected with two-factor authentication.
                      You'll need to provide a verification code from your phone
                      when signing in.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <hr className="my-6" />

              {/* Account Deactivation Section */}
              <div className="space-y-2">
                <Label>Account Deactivation</Label>
                <div className="text-sm text-gray-600 mb-2">
                  Deactivating your account will remove your profile and
                  personal data from our platform. This action cannot be undone.
                </div>
                <Button
                  variant="destructive"
                  className="flex items-center space-x-2"
                >
                  <X className="h-4 w-4" />
                  <span>Deactivate Account</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 2FA Verification Dialog */}
      <Dialog
        open={showVerificationDialog}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseVerificationDialog();
          } else {
            setShowVerificationDialog(true);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set up Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Enter your phone number to receive verification codes when signing
              in.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="phone-number">Phone Number</Label>
              <Input
                id="phone-number"
                placeholder="+91 1234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
            {/* This div must remain in the DOM */}
            <div id="recaptcha-container" className="recaptcha-container"></div>
            {verificationId && (
              <div className="space-y-2">
                <Label htmlFor="verification-code">Verification Code</Label>
                <Input
                  id="verification-code"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseVerificationDialog}>
              Cancel
            </Button>
            <Button
              onClick={verificationId ? verifyAndEnroll2FA : setup2FA}
              disabled={isEnabling2FA}
              className="bg-[#1CAC78] hover:bg-[#158f63]"
            >
              {isEnabling2FA
                ? "Processing..."
                : verificationId
                  ? "Verify & Enable 2FA"
                  : "Send Code"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
