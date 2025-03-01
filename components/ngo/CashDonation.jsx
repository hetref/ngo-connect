"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { doc, collection, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Checkbox } from "@/components/ui/checkbox";

const CashDonation = () => {
  const [amount, setAmount] = useState(0);
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [donatedOn, setDonatedOn] = useState("");
  const [wantsCertificate, setWantsCertificate] = useState(false);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);

  const addCashDonationHandler = async (e) => {
    e.preventDefault();
    if (!amount || !donorName || !donorEmail || !donorPhone || !donatedOn) {
      toast.error("Please fill all the fields");
      return;
    }

    const toasting = toast.loading("Adding donation...");

    try {
      const docRef = doc(collection(db, "donationApprovals"));
      const donationApprovalId = docRef.id;
      const ngoId = auth.currentUser.uid;
      const ngoDocRef = doc(db, `ngo/${ngoId}`);
      const ngoDoc = await getDoc(ngoDocRef);
      const ngoName = ngoDoc.exists() ? ngoDoc.data().ngoName : "";

      await setDoc(docRef, {
        amount,
        donorName,
        donorEmail,
        donorPhone,
        donationApprovalId,
        donatedOn,
        wantsCertificate,
        ngoName,
        ngoId,
        timestamp: new Date().toLocaleString(),
      });

      await fetch("/api/donation-approval", {
        method: "POST",
        body: JSON.stringify({
          amount,
          donorName,
          donorEmail,
          donorPhone,
          donatedOn,
          wantsCertificate,
          donationApprovalId,
          donationApprovalLink: `${window.location.origin}/donation-approvals/${donationApprovalId}`,
          ngoName,
        }),
      });

      await fetch("/api/send-sms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: donorPhone,
          body: `Hello ${donorName}, thank you for donating ₹${amount} to ${ngoName}. Please confirm the donation amount by clicking the link below. 

Donation Confirmation Link - ${window.location.origin}/donation-approvals/${donationApprovalId}`,
        }),
      });

      setAmount(0);
      setDonorName("");
      setDonorEmail("");
      setDonorPhone("");
      setDonatedOn("");
      setAlertDialogOpen(false);
      toast.success("Donation added successfully", { id: toasting });
    } catch (error) {
      console.error("Error adding donation:", error);
      toast.error("Error adding donation", { id: toasting });
    }
  };
  return (
    <div>
      <AlertDialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
        <AlertDialogTrigger>
          <Button>Add Cash Donation</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add Cash Donation</AlertDialogTitle>
            <AlertDialogDescription>
              Add the amount donated by the donor and the details of the donor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-2">
            <Label>Amount</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Donor Name</Label>
            <Input
              type="text"
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Donor Email</Label>
            <Input
              type="email"
              value={donorEmail}
              onChange={(e) => setDonorEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Donor Phone</Label>
            <Input
              type="number"
              value={donorPhone}
              onChange={(e) => setDonorPhone(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Donated On</Label>
            <Input
              type="date"
              value={donatedOn}
              onChange={(e) => setDonatedOn(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="wantsCertificate"
              name="wantsCertificate"
              checked={wantsCertificate}
              onCheckedChange={(checked) => setWantsCertificate(checked)}
            />
            <Label htmlFor="wantsCertificate">
              Do you want a tax redemption certificate for this donation?
            </Label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {/* <AlertDialogAction> */}
            <Button type="submit" onClick={addCashDonationHandler}>
              Add Donation
            </Button>
            {/* </AlertDialogAction> */}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CashDonation;
