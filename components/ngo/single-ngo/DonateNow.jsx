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
import { NGOABI, SuperAdminABI } from "@/constants/contract";
import { useAccount, useDisconnect, useEnsAvatar, useEnsName } from "wagmi";
import { useReadContract } from "wagmi";

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
  const { address: walletAddressHere } = useAccount();
  const {
    data: ownerAdd,
    error: ownerError,
    isPending,
  } = useReadContract({
    address: "0x910e2B3bA649E2787322344724BDF0868Cb23DB0",
    abi: NGOABI,
    functionName: "availableBalance",
  });

  if (isPending) {
    console.log("PENDING CALL");
  } else {
    console.log("WALLET ADDRESS", walletAddressHere);
    console.log("CONTRACT OWNER", ownerAdd);
  }

  // const getBalanceOfNGO = () => {
  //   if (address) {
  //     console.log(address, balance);
  //   } else {
  //     console.log("NO ADDRESS");
  //   }
  // };

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
        };
        await sendWhatsappMessage(
          donationData.name,
          ngoData.ngoName,
          new Date().toISOString(),
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-8">
          <div>
            {/* <button onClick={getBalanceOfNGO}>Get DATA</button> */}
            {/* <span>{isPending ? "Pending" : balance.toString()}</span>
            <span>{isPending ? "Pending" : balError}</span> */}
            <h2>Donate Online</h2>
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
          </div>
          <div>
            <h2>Bank Transfer</h2>
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
          </div>
          <div>
            <h2>Cash Donation</h2>
            <p>
              If you want to donate resources or cash, please contact us at the
              following email address for more details:
            </p>
            <p className="font-semibold">contact@examplengo.org</p>
          </div>
          <div>
            <h2>Crypto Donation</h2>
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
          </div>
        </div>
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

export default DonateNow;
