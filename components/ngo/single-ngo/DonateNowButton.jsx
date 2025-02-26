"use client";

import React, { useEffect } from "react";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { sendWhatsappMessage } from "@/lib/whatsappMessages";

// TODO: Add the donation as a tab instead of dropdown button.
const DonateNowButton = ({ ngoData }) => {
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

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            // if (userData.type === "user") {
            console.log("USER DATA", userData);
            setUserType(userData.type);
            setOnlineFormData({
              name: userData?.name || "",
              email: userData?.email || "",
              phone: userData?.phone || "",
              address: userData?.address || "",
              city: userData?.city || "",
              state: userData?.state || "",
            });
            // }
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  const isOnlineFormValid = Object.values(onlineFormData).every((value) =>
    typeof value === "boolean" ? true : value.trim() !== ""
  );

  const handleOnlineInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setOnlineFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handlePayment = async () => {
    try {
      console.log(
        "NGODATA",
        ngoData,
        ngoData.donationsData.razorpayKeyId,
        ngoData.donationsData.razorpayKeySecret
      );
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
      console.log("ORDER ID", orderId);
      console.log("AMOUNT", amount);

      const options = {
        key: ngoData.donationsData.razorpayKeyId,
        amount: amount,
        currency: "INR",
        name: "NGO-Connect",
        description: "Donation",
        order_id: orderId,
        handler: async function (response) {
          // Payment successful, save data to Firestore
          console.log("RESPONSE", response);
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
  };

  const saveDonationData = async (paymentResponse) => {
    try {
      console.log("PAYMENT SAVING");
      const donationData = {
        ...onlineFormData,
        paymentId: paymentResponse.razorpay_payment_id,
        orderId: paymentResponse.razorpay_order_id,
        signature: paymentResponse.razorpay_signature,
      };
      console.log("SAVING DATA", donationData);

      const sendWhatsappMessageResponse = await sendWhatsappMessage(
        donationData.name,
        ngoData.ngoName,
        new Date().toISOString(),
        donationData.email,
        donationData.phone,
        donationData.amount
      );
      console.log(
        "SEND WHATSAPP MESSAGE RESPONSE",
        sendWhatsappMessageResponse
      );

      await fetch("http://localhost:3000/api/send-sms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: donationData.phone,
          body: `Hello ${donationData.name}, thank you for your donation to ${ngoData.ngoName}.
Donation Amount - ₹${donationData.amount}`,
        }),
      });

      const docRef = doc(
        db,
        "donations",
        auth.currentUser.uid,
        ngoData.ngoId,
        "online_" + new Date().toISOString()
      );

      await setDoc(docRef, donationData, { merge: true });
      console.log("Donation data saved successfully");
    } catch (error) {
      console.error("Error saving donation data:", error);
    }
  };

  return (
    <div className="space-y-6">
      {userType === "user" && (
        <h2 className="text-2xl font-bold mb-4">Support Our Cause</h2>
      )}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* {userType === "user" && ( */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Donate Now
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => setIsOnlineModalOpen(true)}>
              Donate Online
            </DropdownMenuItem>
            {ngoData.donationsData.isBankTransferEnabled && (
              <DropdownMenuItem onSelect={() => setIsBankModalOpen(true)}>
                Donate via Bank Transfer
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={() => setIsResourceModalOpen(true)}>
              Donate Resources/Cash
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setIsCryptoModalOpen(true)}>
              Donate via Crypto (Stablecoins)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {/* )} */}

        {/* Online Donation Modal */}
        <Dialog open={isOnlineModalOpen} onOpenChange={setIsOnlineModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Donate Online</DialogTitle>
            </DialogHeader>
            {!userType || userType !== "user" ? (
              <p>Login with User Creds to Donate.</p>
            ) : (
              <form className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={onlineFormData.name}
                    onChange={handleOnlineInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={onlineFormData.email}
                    onChange={handleOnlineInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={onlineFormData.phone}
                    onChange={handleOnlineInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    value={onlineFormData.address}
                    onChange={handleOnlineInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    value={onlineFormData.city}
                    onChange={handleOnlineInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    name="state"
                    value={onlineFormData.state}
                    onChange={handleOnlineInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    name="amount"
                    value={onlineFormData.amount}
                    onChange={handleOnlineInputChange}
                    required
                  />
                </div>
                <div className="flex items-center space-x-2">
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
                  <Label htmlFor="wantsCertificate">
                    Do you want a tax redemption certificate for this donation?
                  </Label>
                </div>
                <Button
                  type="button"
                  className="w-full"
                  disabled={!isOnlineFormValid}
                  onClick={handlePayment}
                >
                  Donate
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Bank Transfer Modal */}
        <Dialog open={isBankModalOpen} onOpenChange={setIsBankModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Donate via Bank Transfer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>
                Please use the following bank details to make your donation:
              </p>
              <div>
                <strong>Account Holder Name:</strong> Example NGO
              </div>
              <div>
                <strong>Bank Name:</strong> Example Bank
              </div>
              <div>
                <strong>Branch:</strong> Main Branch
              </div>
              <div>
                <strong>Account Number:</strong> 1234567890
              </div>
              <div>
                <strong>Account Type:</strong> Savings
              </div>
              <div>
                <strong>IFSC Number:</strong> EXMP0001234
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Resource/Cash Donation Modal */}
        <Dialog
          open={isResourceModalOpen}
          onOpenChange={setIsResourceModalOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Donate Resources or Cash</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>
                If you want to donate resources or cash, please contact us at
                the following email address for more details:
              </p>
              <p className="font-semibold">contact@examplengo.org</p>
            </div>
          </DialogContent>
        </Dialog>

        {/* Crypto Donation Modal */}
        <Dialog open={isCryptoModalOpen} onOpenChange={setIsCryptoModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Donate via Crypto (Stablecoins)</DialogTitle>
            </DialogHeader>
            <form className="space-y-4">
              <div>
                <Label htmlFor="cryptoAmount">Amount (USD)</Label>
                <Input
                  id="cryptoAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Enter amount"
                />
              </div>
              <Button type="submit" className="w-full">
                Donate
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
};

export default DonateNowButton;
