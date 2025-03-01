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
import { doc, collection, setDoc, getDoc, addDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/context/AuthContext";
import { serverTimestamp } from "firebase/firestore";

const ResourcesDonation = () => {
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [resource, setResource] = useState("");
  const [quantity, setQuantity] = useState("");
  const [donatedOn, setDonatedOn] = useState("");
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const { profile } = useAuth();

  const addResourceDonationHandler = async (e) => {
    e.preventDefault();
    if (
      !donorName ||
      !donorEmail ||
      !donorPhone ||
      !resource ||
      !quantity ||
      !donatedOn
    ) {
      toast.error("Please fill all the fields");
      return;
    }

    const toasting = toast.loading("Adding resource donation...");

    try {
      const donationApprovalId = new Date().getTime().toString();
      const docRef = doc(db, "donationApprovals", donationApprovalId);
      const ngoId = auth.currentUser.uid;

      // Get NGO details
      const ngoDocRef = doc(db, `ngo/${ngoId}`);
      const ngoDoc = await getDoc(ngoDocRef);
      const ngoName = ngoDoc.exists() ? ngoDoc.data().ngoName : "";

      // Create donation approval document
      await setDoc(docRef, {
        type: "resource",
        donorName,
        donorEmail,
        donorPhone,
        resource,
        quantity: Number(quantity),
        donatedOn,
        donationApprovalId,
        ngoName,
        ngoId,
        status: "pending",
        timestamp: new Date().toLocaleString(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await fetch("/api/donation-approval-resources", {
        method: "POST",
        body: JSON.stringify({
          resource,
          quantity,
          donorName,
          donorEmail,
          donorPhone,
          donatedOn,
          donationApprovalId,
          donationApprovalLink: `${window.location.origin}/donation-approvals/${donationApprovalId}`,
          ngoName,
        }),
      });

      // Send confirmation SMS
      await fetch("/api/send-sms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: donorPhone,
          body: `Hello ${donorName}, thank you for donating ${quantity} ${resource} to ${ngoName}. 
          Please confirm your donation by clicking the link below.\n
          Confirmation Link: ${window.location.origin}/donation-approvals/${donationApprovalId}`,
        }),
      });

      // Reset form
      setDonorName("");
      setDonorEmail("");
      setDonorPhone("");
      setResource("");
      setQuantity("");
      setDonatedOn("");
      setAlertDialogOpen(false);

      toast.success("Resource donation added for approval", { id: toasting });
    } catch (error) {
      console.error("Error adding resource donation:", error);
      toast.error("Error adding donation", { id: toasting });
    }
  };

  return (
    <div>
      <AlertDialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
        <AlertDialogTrigger>
          <Button>Add Res Donation</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add Resource Donation</AlertDialogTitle>
            <AlertDialogDescription>
              Add the details of the resource donation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-2">
            <Label>Donor Name</Label>
            <Input
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
              type="tel"
              value={donorPhone}
              onChange={(e) => setDonorPhone(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Resource Type</Label>
            <Input
              value={resource}
              onChange={(e) => setResource(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Quantity</Label>
            <Input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
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
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button onClick={addResourceDonationHandler}>Add Donation</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ResourcesDonation;
