import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase"; // Import Firestore
import { doc, updateDoc, onSnapshot } from "firebase/firestore"; // Import updateDoc and onSnapshot functions
import toast from "react-hot-toast";

const DonationInformation = ({ ngoId }) => {
  const [donationsData, setDonationsData] = useState({
    razorpayKeyId: "",
    razorpayKeySecret: "",
    isBankTransferEnabled: false,
    bankTransferDetails: {
      accountHolderName: "",
      bankName: "",
      branchNameAddress: "",
      accountNumber: "",
      accountType: "",
      ifscCode: "",
    },
    acknowledgmentMessage: "",
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "ngo", ngoId), (doc) => {
      if (doc.exists() && doc.data()?.donationsData) {
        setDonationsData(doc.data().donationsData);
      }
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, [ngoId]);

  const handleSave = async () => {
    if (!donationsData.razorpayKeyId || !donationsData.razorpayKeySecret) {
      // alert("Razorpay Key ID and Secret are required.");
      toast.error("Razorpay Key ID and Secret are required.");
      return;
    }

    if (
      donationsData.isBankTransferEnabled &&
      (donationsData.bankTransferDetails.accountHolderName === "" ||
        donationsData.bankTransferDetails.bankName === "" ||
        donationsData.bankTransferDetails.branchNameAddress === "" ||
        donationsData.bankTransferDetails.accountNumber === "" ||
        donationsData.bankTransferDetails.accountType === "" ||
        donationsData.bankTransferDetails.ifscCode === "")
    ) {
      // alert("All bank transfer details are required.");
      toast.error("All bank transfer details are required.");
      return;
    }
    console.log("DONATIONDATA", donationsData);

    try {
      await updateDoc(doc(db, "ngo", ngoId), { donationsData });
      // alert("Donation settings updated successfully!");
      toast.success("Donation settings updated successfully!");
    } catch (error) {
      console.error("Error updating donation settings: ", error);
      // alert("Failed to update donation settings.");
      toast.error("Failed to update donation settings.");
    }
  };

  const handleChange = (e, key) => {
    setDonationsData((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleBankTransferChange = (e, key) => {
    setDonationsData((prev) => ({
      ...prev,
      bankTransferDetails: {
        ...prev.bankTransferDetails,
        [key]: e.target.value,
      },
    }));
  };

  const toggleBankTransfer = () => {
    setDonationsData((prev) => ({
      ...prev,
      isBankTransferEnabled: !prev.isBankTransferEnabled,
    }));
  };

  // NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_9xch4WbEcXUxCT
  // RAZORPAY_KEY_SECRET=LpFjSLwn631qJf7fZwNvNuKB

  return (
    <Card>
      <CardHeader>
        <CardTitle>Donation & Payout Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Razorpay Credentials</Label>
          <Input
            placeholder="Razorpay Key ID"
            value={donationsData.razorpayKeyId}
            onChange={(e) => handleChange(e, "razorpayKeyId")}
            className="border-gray-300"
            required
          />
          <Input
            placeholder="Razorpay Key Secret"
            value={donationsData.razorpayKeySecret}
            onChange={(e) => handleChange(e, "razorpayKeySecret")}
            className="border-gray-300"
            required
          />
        </div>
        <div className="space-y-2">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
            <Label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={donationsData.isBankTransferEnabled}
                onChange={toggleBankTransfer}
                className="mr-2"
              />
              Enable Bank Transfers
            </Label>
          </div>
          {donationsData.isBankTransferEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-4">
              <Input
                placeholder="Account Holder Name"
                value={donationsData.bankTransferDetails.accountHolderName}
                onChange={(e) =>
                  handleBankTransferChange(e, "accountHolderName")
                }
                className="border-gray-300"
                required
              />
              <Input
                placeholder="Bank Name"
                value={donationsData.bankTransferDetails.bankName}
                onChange={(e) => handleBankTransferChange(e, "bankName")}
                className="border-gray-300"
                required
              />
              <Input
                placeholder="Branch Name & Address"
                value={donationsData.bankTransferDetails.branchNameAddress}
                onChange={(e) =>
                  handleBankTransferChange(e, "branchNameAddress")
                }
                className="border-gray-300"
                required
              />
              <Input
                placeholder="Account Number"
                value={donationsData.bankTransferDetails.accountNumber}
                onChange={(e) => handleBankTransferChange(e, "accountNumber")}
                className="border-gray-300"
                required
              />
              <Input
                placeholder="Account Type (Savings/Current)"
                value={donationsData.bankTransferDetails.accountType}
                onChange={(e) => handleBankTransferChange(e, "accountType")}
                className="border-gray-300"
                required
              />
              <Input
                placeholder="IFSC Code"
                value={donationsData.bankTransferDetails.ifscCode}
                onChange={(e) => handleBankTransferChange(e, "ifscCode")}
                className="border-gray-300"
                required
              />
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label>Donation Acknowledgment Message</Label>
          <Textarea
            placeholder="Enter your custom thank you message for donors"
            value={donationsData.acknowledgmentMessage}
            onChange={(e) => handleChange(e, "acknowledgmentMessage")}
            className="border-gray-300"
          />
        </div>
        <Button
          className="w-full md:w-auto bg-[#1CAC78] hover:bg-[#158f63]"
          onClick={handleSave}
        >
          Save Donation Settings
        </Button>
      </CardContent>
    </Card>
  );
};

export default DonationInformation;
