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

const OnlineDonation = () => {
  const [amount, setAmount] = useState(0);
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [donatedOn, setDonatedOn] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [wantsCertificate, setWantsCertificate] = useState(false);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);

  const addOnlineDonationHandler = async (e) => {
    e.preventDefault();
    if (
      !amount ||
      !donorName ||
      !donorEmail ||
      !donorPhone ||
      !donatedOn ||
      !transactionId
    ) {
      toast.error("Please fill all the required fields");
      return;
    }

    const toasting = toast.loading("Adding online donation...");

    try {
      const donationApprovalId = new Date().getTime().toString();
      const docRef = doc(db, "donationApprovals", donationApprovalId);
      const ngoId = auth.currentUser.uid;
      const ngoDocRef = doc(db, `ngo/${ngoId}`);
      const ngoDoc = await getDoc(ngoDocRef);
      const ngoName = ngoDoc.exists() ? ngoDoc.data().ngoName : "";

      // Add to donation approvals
      await setDoc(docRef, {
        type: "online",
        amount,
        donorName,
        donorEmail,
        donorPhone,
        donationApprovalId,
        donatedOn,
        transactionId,
        paymentMethod,
        wantsCertificate,
        ngoName,
        ngoId,
        timestamp: new Date().toISOString(),
        status: "pending",
      });

      // Also add directly to the online donations collection
      const currentYear = new Date().getFullYear().toString();
      const userId = auth.currentUser.uid;
      const currentTimestamp = new Date().getTime().toString();

      const onlineDonationRef = doc(
        db,
        `donations/${ngoId}/${currentYear}/${userId}/online/${currentTimestamp}`
      );

      await setDoc(onlineDonationRef, {
        amount,
        name: donorName,
        email: donorEmail,
        phone: donorPhone,
        donatedOn,
        transactionId,
        paymentMethod,
        wantsCertificate,
        timestamp: new Date().toISOString(),
        donationApprovalId,
      });

      // Send email notification
      await fetch("/api/donation-approval", {
        method: "POST",
        body: JSON.stringify({
          amount,
          donorName,
          donorEmail,
          donorPhone,
          donatedOn,
          transactionId,
          paymentMethod,
          wantsCertificate,
          donationApprovalId,
          donationApprovalLink: `${window.location.origin}/donation-approvals/${donationApprovalId}`,
          ngoName,
        }),
      });

      // Reset form
      setAmount(0);
      setDonorName("");
      setDonorEmail("");
      setDonorPhone("");
      setDonatedOn("");
      setTransactionId("");
      setPaymentMethod("UPI");
      setWantsCertificate(false);
      setAlertDialogOpen(false);

      toast.success("Online donation added successfully", { id: toasting });
    } catch (error) {
      console.error("Error adding online donation:", error);
      toast.error("Error adding online donation", { id: toasting });
    }
  };

  return (
    <div>
      <AlertDialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
        <AlertDialogTrigger>
          <Button variant="outline">Add Online Donation</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add Online Donation</AlertDialogTitle>
            <AlertDialogDescription>
              Add the details of an online donation received through UPI, bank
              transfer, or other digital methods.
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
          <div className="grid gap-2">
            <Label>Transaction ID</Label>
            <Input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Payment Method</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="UPI">UPI</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Debit Card">Debit Card</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="flex items-center space-x-2 mt-2">
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
            <Button type="submit" onClick={addOnlineDonationHandler}>
              Add Donation
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OnlineDonation;
