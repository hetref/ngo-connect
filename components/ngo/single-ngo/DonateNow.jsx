"use client";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { sendWhatsappMessage } from "@/lib/whatsappMessages";
import { NGOABI, NGOCoinABI, SuperAdminABI } from "@/constants/contract";
import {
  useAccount,
  useDisconnect,
  useEnsAvatar,
  useEnsName,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { useReadContract } from "wagmi";
import { formatEther, parseUnits } from "ethers";
import { toast } from "react-hot-toast";
import { currentTimestamp } from "@/constants";

const DonateNow = ({ ngoData }) => {
  const [isOnlineModalOpen, setIsOnlineModalOpen] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [isCryptoModalOpen, setIsCryptoModalOpen] = useState(false);
  const [onlineFormData, setOnlineFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    amount: "",
    wantsCertificate: false,
  });
  const [userType, setUserType] = useState(null);
  const [cryptoAmount, setCryptoAmount] = useState("");

  // NGC Contract Address - 0xAbFb2AeF4aAC335Cda2CeD2ddd8A6521047e8ddF
  // NGO Contract Address is being fetched from firestore.

  const { address: walletAddressHere } = useAccount();
  const {
    data: ownerAdd,
    error: ownerError,
    isPending,
  } = useReadContract({
    address: ngoData?.donationsData?.ngoOwnerAddContract || undefined,
    abi: NGOABI,
    functionName: "availableBalance",
    enabled: Boolean(ngoData?.donationsData?.ngoOwnerAddContract),
  });

  const formattedBalance = ownerAdd ? formatEther(ownerAdd) : "0";

  if (isPending) {
    console.log("PENDING CALL");
  } else {
    console.log("WALLET ADDRESS", walletAddressHere);
    console.log("CONTRACT OWNER", ownerAdd);
  }

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setUserType(userData.type);

            setOnlineFormData((prev) => ({
              ...prev,
              name: userData?.name || "",
              email: userData?.email || "",
              phone: userData?.phone || "",
              address: userData?.address || "",
              city: userData?.city || "",
              state: userData?.state || "",
            }));
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchUserData();
  }, []);

  const isOnlineFormValid = useMemo(() => {
    return Object.values(onlineFormData).every((value) =>
      typeof value === "boolean" ? true : value.trim() !== ""
    );
  }, [onlineFormData]);

  const handleOnlineInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setOnlineFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }, []);

  const handlePayment = useCallback(async () => {
    try {
      const response = await fetch("/api/create-donation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: onlineFormData.amount,
          userId: auth.currentUser.uid,
          ngoId: ngoData.ngoId,
          rzpKeyId: ngoData.donationsData.razorpayKeyId,
          rzpKeySecret: ngoData.donationsData.razorpayKeySecret,
        }),
      });
      const { orderId, amount } = await response.json();
      const options = {
        key: ngoData.donationsData.razorpayKeyId,
        amount: amount,
        currency: "INR",
        name: "NGO-Connect",
        description: "Donation",
        order_id: orderId,
        handler: async (response) => {
          await saveDonationData(response);
        },
        prefill: {
          name: onlineFormData.name,
          email: onlineFormData.email,
          contact: onlineFormData.phone,
        },
        theme: {
          color: "#3399cc",
        },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Error during payment:", error);
    }
  }, [onlineFormData, ngoData]);

  const saveDonationData = useCallback(
    async (paymentResponse) => {
      try {
        const donationData = {
          ...onlineFormData,
          paymentId: paymentResponse.razorpay_payment_id,
          orderId: paymentResponse.razorpay_order_id,
          signature: paymentResponse.razorpay_signature,
          date: new Date().toISOString(),
        };
        await sendWhatsappMessage(
          donationData.name,
          ngoData.ngoName,
          currentTimestamp,
          donationData.email,
          donationData.phone,
          donationData.amount
        );
        await fetch("http://localhost:3000/api/send-sms", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: donationData.phone,
            body: `Hello ${donationData.name}, thank you for your donation to ${ngoData.ngoName}. Donation Amount - ₹${donationData.amount}`,
          }),
        });
        const docRef = doc(
          db,
          "donations",
          ngoData.ngoId,
          new Date().getFullYear().toString(),
          auth.currentUser.uid,
          "online",
          new Date().toISOString()
        );
        await setDoc(docRef, donationData, { merge: true }).then(() => {
          console.log("Donation Data Saved");
        });
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        await updateDoc(userDocRef, {
          totalDonated: increment(parseFloat(donationData.amount)),
        }).then(() => {
          console.log("User Total Donated Updated for use");
        });
        const ngoDocRef = doc(db, "ngo", ngoData.ngoId);
        await updateDoc(ngoDocRef, {
          totalDonations: increment(parseFloat(donationData.amount)),
        }).then(() => {
          console.log("NGO Total Donations Updated");
        });
        const donatedToDocRef = doc(
          db,
          "users",
          auth.currentUser.uid,
          "donatedTo",
          ngoData.ngoId
        );
        await setDoc(
          donatedToDocRef,
          {
            amount: increment(parseFloat(donationData.amount)),
            timestamp: new Date().toISOString(),
          },
          { merge: true }
        ).then(() => {
          console.log("Donation Data Saved for User added donatedTo");
        });
        const userDetailedDonationRef = doc(
          db,
          "users",
          auth.currentUser.uid,
          new Date().getFullYear().toString(),
          new Date().getMonth().toString(),
          ngoData.ngoId,
          new Date().toISOString()
        );
        await setDoc(
          userDetailedDonationRef,
          {
            amount: donationData.amount,
            name: donationData.name,
            email: donationData.email,
            phone: donationData.phone,
            wantsCertificate: donationData.wantsCertificate,
            type: "online",
          },
          { merge: true }
        );
      } catch (error) {
        console.error("Error saving donation data:", error);
      }
    },
    [onlineFormData, ngoData]
  );

  // Approve Tokens
  const parsedAmount = cryptoAmount ? parseUnits(cryptoAmount, 18) : "0";

  const { writeContract } = useWriteContract();
  const [approvalHash, setApprovalHash] = useState(null);
  const [donationHash, setDonationHash] = useState(null);

  // Helper function to update database records
  const updateDatabaseRecords = useCallback(
    async (amount) => {
      const donationData = {
        amount: cryptoAmount,
        userId: auth.currentUser.uid,
        ngoId: ngoData.ngoId,
        name: onlineFormData?.name || "",
        email: onlineFormData?.email || "",
        phone: onlineFormData?.phone || "",
        timestamp: new Date().toISOString(),
        transactionType: "crypto",
      };

      console.log("DONATIONDATA", donationData, ngoData.ngoId);

      try {
        await Promise.all([
          sendWhatsappMessage(
            donationData.name,
            ngoData.ngoName,
            donationData.timestamp,
            donationData.email,
            donationData.phone,
            donationData.amount
          ),
          setDoc(
            doc(
              db,
              "donations",
              ngoData.ngoId,
              new Date().getFullYear().toString(),
              auth.currentUser.uid,
              "crypto",
              donationData.timestamp
            ),
            donationData,
            { merge: true }
          ),
          updateDoc(doc(db, "users", auth.currentUser.uid), {
            totalTokensDonated: increment(amount),
          }),
          updateDoc(doc(db, "ngo", ngoData.ngoId), {
            totalTokensDonated: increment(amount),
          }),
          setDoc(
            doc(db, "users", auth.currentUser.uid, "donatedTo", ngoData.ngoId),
            {
              tokens: increment(amount),
              timestamp: donationData.timestamp,
            },
            { merge: true }
          ),
        ]);

        toast.success("Donation recorded successfully!");
      } catch (error) {
        console.error("Error updating database:", error);
        toast.error("Failed to update records. Please contact support.");
      }
    },
    [ngoData, onlineFormData]
  );

  const handleDonate = useCallback(async () => {
    try {
      const hash = await writeContract({
        address: ngoData?.donationsData?.ngoOwnerAddContract,
        abi: NGOABI,
        functionName: "donate",
        args: [parsedAmount, true],
      });
      toast.success("Donation transaction submitted!");
      setDonationHash(hash);
    } catch (error) {
      toast.error("Donation failed: " + error.message);
      console.error(error);
    }
  }, [
    parsedAmount,
    ngoData?.donationsData?.ngoOwnerAddContract,
    writeContract,
  ]);

  const handleApprove = useCallback(async () => {
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error("Please enter a valid donation amount.");
      return;
    }

    try {
      const hash = await writeContract({
        address: "0xAbFb2AeF4aAC335Cda2CeD2ddd8A6521047e8ddF",
        abi: NGOCoinABI,
        functionName: "approve",
        args: [ngoData?.donationsData?.ngoOwnerAddContract, parsedAmount],
      });
      toast.success("Approval transaction submitted!");
      setApprovalHash(hash);
    } catch (error) {
      toast.error("Approval failed: " + error.message);
      console.error(error);
    }
  }, [
    parsedAmount,
    ngoData?.donationsData?.ngoOwnerAddContract,
    writeContract,
  ]);

  // Watch approval transaction
  const { isLoading: isApproving, isSuccess: approvalSuccess } =
    useWaitForTransactionReceipt({
      hash: approvalHash,
    });

  // Watch donation transaction
  const { isLoading: isDonating, isSuccess: donationSuccess } =
    useWaitForTransactionReceipt({
      hash: donationHash,
    });

  // Watch for approval success and trigger donation
  useEffect(() => {
    if (approvalSuccess) {
      toast.success("Approved the Amount");
      handleDonate(); // Automatically call donate after approval
    }
  }, [approvalSuccess, handleDonate]);

  // Watch for donation success and update database
  useEffect(() => {
    if (donationSuccess) {
      toast.success("Donated to the NGO");
      updateDatabaseRecords(parsedAmount);
      setCryptoAmount(""); // Reset the input field
    }
  }, [donationSuccess, parsedAmount, updateDatabaseRecords]);

  const handleCryptoDonation = useCallback(
    (e) => {
      e.preventDefault();
      handleApprove();
      handleDonate();
      updateDatabaseRecords();
    },
    [handleApprove, handleDonate]
  );

  return (
    <div className="space-y-6">
      {ngoData?.donationsData?.isCryptoTransferEnabled && (
        <div>
          Balance:{" "}
          {isPending
            ? "Loading..."
            : ownerError
              ? "Error loading balance"
              : `${formattedBalance} ETH`}
        </div>
      )}
      {userType === "user" && (
        <h2 className="text-2xl font-bold mb-4">Support Our Cause</h2>
      )}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-2xl ">
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-2xl font-semibold text-gray-800">Make a Donation</h2>
              <p className="text-gray-600 mt-1">Your support makes a difference</p>
            </div>

            {!userType || userType !== "user" ? (
              <div className="text-center py-8">
                <p className="text-lg text-gray-600">Please login with your user account to make a donation.</p>
                <Button className="mt-4">Login to Donate</Button>
              </div>
            ) : (
              <form className="space-y-6">
                {/* Personal Information Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-700">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name" className="text-gray-700">Full Name</Label>
                      <Input
                        id="name"
                        name="name"
                        value={onlineFormData.name}
                        onChange={handleOnlineInputChange}
                        className="mt-1"
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-gray-700">Email Address</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={onlineFormData.email}
                        onChange={handleOnlineInputChange}
                        className="mt-1"
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-gray-700">Phone Number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={onlineFormData.phone}
                        onChange={handleOnlineInputChange}
                        className="mt-1"
                        placeholder="Your contact number"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Address Section */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-medium text-gray-700">Address Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="address" className="text-gray-700">Street Address</Label>
                      <Input
                        id="address"
                        name="address"
                        value={onlineFormData.address}
                        onChange={handleOnlineInputChange}
                        className="mt-1"
                        placeholder="Enter your street address"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="city" className="text-gray-700">City</Label>
                      <Input
                        id="city"
                        name="city"
                        value={onlineFormData.city}
                        onChange={handleOnlineInputChange}
                        className="mt-1"
                        placeholder="Your city"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="state" className="text-gray-700">State</Label>
                      <Input
                        id="state"
                        name="state"
                        value={onlineFormData.state}
                        onChange={handleOnlineInputChange}
                        className="mt-1"
                        placeholder="Your state"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Donation Amount Section */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-medium text-gray-700">Donation Amount</h3>
                  <div>
                    <Label htmlFor="amount" className="text-gray-700">Amount (INR)</Label>
                    <Input
                      id="amount"
                      name="amount"
                      type="number"
                      value={onlineFormData.amount}
                      onChange={handleOnlineInputChange}
                      className="mt-1"
                      placeholder="Enter amount"
                      required
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2 bg-gray-50 p-4 rounded-lg">
                    <Checkbox
                      id="wantsCertificate"
                      name="wantsCertificate"
                      checked={onlineFormData.wantsCertificate}
                      onCheckedChange={(checked) =>
                        setOnlineFormData((prev) => ({
                          ...prev,
                          wantsCertificate: checked,
                        }))
                      }
                    />
                    <Label htmlFor="wantsCertificate" className="text-gray-700">
                      I would like to receive a tax redemption certificate for this donation
                    </Label>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-6 border-t">
                  <Button
                    type="button"
                    className="w-full h-12 text-lg font-medium"
                    disabled={!isOnlineFormValid}
                    onClick={handlePayment}
                  >
                    Donate Now
                  </Button>
                  <p className="text-center text-sm text-gray-500 mt-4">
                    Your donation will help us make a difference
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </motion.div>

      <Dialog open={isOnlineModalOpen} onOpenChange={setIsOnlineModalOpen}>
        {/* ... rest of the code ... */}
      </Dialog>
    </div>
  );
};

export default DonateNow;
