"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { doc, getDoc, updateDoc, setDoc, increment } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import toast from "react-hot-toast";
import { currentTimestamp } from "@/constants";

export default function DonationVerification({ donation, donationApprovalId }) {
  // States to manage the UI flow
  const [status, setStatus] = useState("pending");
  const [rejectionReason, setRejectionReason] = useState("");

  // Handle verify button click
  const handleVerify = async () => {
    const docRef = doc(db, "donationApprovals", donationApprovalId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      await updateDoc(docRef, {
        status: "verified",
        verifiedOn: new Date().toLocaleString(),
      });

      // New document path
      const ngoId = donation.ngoId; // Assuming ngoId is part of the donation state
      const currentYear = new Date().getFullYear();
      const userId = auth.currentUser.uid; // Replace with actual user ID

      // Create a new document in the specified path
      const newDocRef = doc(
        db,
        `donations/${ngoId}/${currentYear}/${userId}/cash/${currentTimestamp}`
      );
      await setDoc(newDocRef, {
        // Add the necessary data for the new document
        amount: donation.amount,
        name: donation.donorName,
        email: donation.donorEmail,
        phone: donation.donorPhone,
        donatedOn: donation.donatedOn,
        wantsCertificate: donation.wantsCertificate,
        verifiedOn: currentTimestamp,
        type: "cash",
      });

      const userDonationRef = doc(
        db,
        "users",
        userId,
        "donatedTo",
        donation.ngoId
      );

      await setDoc(
        userDonationRef,
        {
          amount: increment(parseFloat(donation.amount)),
          timestamp: currentTimestamp,
        },
        { merge: true }
      );

      const userDetailedDonationRef = doc(
        db,
        "users",
        userId,
        new Date().getFullYear().toString(),
        new Date().getMonth().toString(),
        donation.ngoId,
        currentTimestamp
      );

      await setDoc(
        userDetailedDonationRef,
        {
          amount: donation.amount,
          name: donation.donorName,
          email: donation.donorEmail,
          phone: donation.donorPhone,
          donatedOn: donation.donatedOn,
          wantsCertificate: donation.wantsCertificate,
          verifiedOn: currentTimestamp,
          donationApprovalId: donationApprovalId,
          type: "cash",
        },
        { merge: true }
      );

      toast.success("Donation verified successfully");

      setStatus("verified");
    }
  };

  // Handle initial reject button click
  const handleRejectClick = () => {
    setStatus("rejecting");
  };

  // Handle rejection form submission
  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (rejectionReason.trim()) {
      const docRef = doc(db, "donationApprovals", donationApprovalId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        await updateDoc(docRef, {
          status: "rejected",
          reason: rejectionReason,
        });
        toast.success("Donation verified successfully");

        setStatus("rejected");
      }
    } else {
      toast.error("Please provide a reason for rejection");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[60vh] p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Verify Donation</CardTitle>
          <CardDescription>
            Please review the donation details below
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {donation ? (
            <>
              {donation?.error ? (
                <div className="text-red-500">{donation.error}</div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-sm font-medium">Donor Name:</div>
                    <div>{donation.donorName}</div>

                    <div className="text-sm font-medium">Donor Phone:</div>
                    <div>{donation.donorPhone}</div>

                    <div className="text-sm font-medium">Donated On:</div>
                    <div>{donation.donatedOn}</div>

                    <div className="text-sm font-medium">NGO Name:</div>
                    <div>{donation.ngoName}</div>

                    <div className="text-sm font-medium">Amount:</div>
                    <div className="font-semibold">₹{donation.amount}</div>

                    <div className="text-sm font-medium">Tax Redemption:</div>
                    <div>
                      {donation?.wantsCertificate ? (
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200"
                        >
                          Requested
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-gray-50 text-gray-700 border-gray-200"
                        >
                          Not Requested
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div>Loading...</div>
          )}

          {status === "verified" ||
            (donation.status === "verified" && (
              <div className="py-8 text-center space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xl font-medium text-green-700">
                  Thank you!
                </h3>
                <p>Your donation has been verified now.</p>
              </div>
            ))}

          {status === "rejecting" && (
            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reason">
                  Please provide a reason for rejection:
                </Label>
                <Textarea
                  id="reason"
                  placeholder="Enter your reason here..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  required
                  className="min-h-[100px]"
                />
              </div>
              <Button type="submit" variant="destructive" className="w-full">
                Submit Rejection
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setStatus("pending")}
              >
                Go Back
              </Button>
            </form>
          )}

          {status === "rejected" ||
            (donation.status === "rejected" && (
              <div className="py-8 text-center space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <X className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="text-xl font-medium text-amber-700">
                  Thank you for the reason of rejection
                </h3>
                <p>We'll get back to you in sometime.</p>
              </div>
            ))}
        </CardContent>

        {status === "pending" &&
          donation.status !== "verified" &&
          donation.status !== "rejected" && (
            <CardFooter className="flex justify-between gap-4">
              <Button
                variant="outline"
                className="w-full border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                onClick={handleRejectClick}
              >
                Reject
              </Button>
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={handleVerify}
              >
                Verify
              </Button>
            </CardFooter>
          )}
      </Card>
    </div>
  );
}
