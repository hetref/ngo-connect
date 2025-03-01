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
import {
  doc,
  onSnapshot,
  updateDoc,
  setDoc,
  increment,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import toast from "react-hot-toast";
import { currentTimestamp } from "@/constants";

export default function DonationVerification({ donationApprovalId }) {
  const [status, setStatus] = useState("pending");
  const [rejectionReason, setRejectionReason] = useState("");
  const [donationData, setDonationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const docRef = doc(db, "donationApprovals", donationApprovalId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setDonationData(docSnap.data());
        setStatus(docSnap.data().status || "pending");
        setLoading(false);
      } else {
        setError("Donation record not found");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [donationApprovalId]);

  const handleVerify = async () => {
    try {
      const docRef = doc(db, "donationApprovals", donationApprovalId);

      await updateDoc(docRef, {
        status: "verified",
        verifiedOn: new Date().toLocaleString(),
      });

      const ngoId = donationData.ngoId;
      const currentYear = new Date().getFullYear();
      const userId = auth.currentUser.uid;
      const donationType = donationData.type || "cash";

      const collectionPath = donationType === "cash" ? "cash" : "resources";
      const newDocRef = doc(
        db,
        `donations/${ngoId}/${currentYear}/${userId}/${collectionPath}/${currentTimestamp}`
      );

      const verificationData = {
        ...(donationType === "cash" && {
          amount: donationData.amount,
          wantsCertificate: donationData.wantsCertificate,
        }),
        ...(donationType === "resource" && {
          resource: donationData.resource,
          quantity: donationData.quantity,
        }),
        name: donationData.donorName,
        email: donationData.donorEmail,
        phone: donationData.donorPhone,
        donatedOn: donationData.donatedOn,
        verifiedOn: currentTimestamp,
        type: donationType,
      };

      await setDoc(newDocRef, verificationData);

      if (donationType === "cash") {
        const userDonationRef = doc(
          db,
          "users",
          userId,
          "donatedTo",
          donationData.ngoId
        );
        await setDoc(
          userDonationRef,
          {
            amount: increment(parseFloat(donationData.amount)),
            timestamp: currentTimestamp,
          },
          { merge: true }
        );
      }

      const userDetailedDonationRef = doc(
        db,
        "users",
        userId,
        new Date().getFullYear().toString(),
        new Date().getMonth().toString(),
        donationData.ngoId,
        currentTimestamp
      );
      await setDoc(
        userDetailedDonationRef,
        {
          ...verificationData,
          donationApprovalId,
        },
        { merge: true }
      );

      toast.success(`Donation verified successfully`);
    } catch (error) {
      console.error("Verification error:", error);
      toast.error("Error verifying donation");
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (rejectionReason.trim()) {
      try {
        const docRef = doc(db, "donationApprovals", donationApprovalId);
        await updateDoc(docRef, {
          status: "rejected",
          reason: rejectionReason,
          rejectedOn: new Date().toLocaleString(),
        });
        toast.success("Donation rejected successfully");
      } catch (error) {
        console.error("Rejection error:", error);
        toast.error("Error rejecting donation");
      }
    } else {
      toast.error("Please provide a reason for rejection");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-4 text-center">
            <div>Loading donation details...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-4 text-center text-red-500">
            {error}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-[60vh] p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">
            Verify {donationData?.type === "resource" ? "Resource " : ""}
            Donation
          </CardTitle>
          <CardDescription>
            Please review the donation details below
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm font-medium">Donor Name:</div>
              <div>{donationData.donorName}</div>

              <div className="text-sm font-medium">Donor Phone:</div>
              <div>{donationData.donorPhone}</div>

              <div className="text-sm font-medium">Donated On:</div>
              <div>{donationData.donatedOn}</div>

              <div className="text-sm font-medium">NGO Name:</div>
              <div>{donationData.ngoName}</div>

              {donationData.type === "cash" ? (
                <>
                  <div className="text-sm font-medium">Amount:</div>
                  <div className="font-semibold">₹{donationData.amount}</div>

                  <div className="text-sm font-medium">Tax Redemption:</div>
                  <div>
                    {donationData?.wantsCertificate ? (
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
                </>
              ) : (
                <>
                  <div className="text-sm font-medium">Resource Type:</div>
                  <div className="font-semibold">{donationData.resource}</div>

                  <div className="text-sm font-medium">Quantity:</div>
                  <div className="font-semibold">{donationData.quantity}</div>
                </>
              )}
            </div>
          </div>

          {(status === "verified" || donationData.status === "verified") && (
            <div className="py-8 text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-medium text-green-700">Thank you!</h3>
              <p>Your donation has been verified now.</p>
            </div>
          )}

          {(status === "rejected" || donationData.status === "rejected") && (
            <div className="py-8 text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <X className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-medium text-amber-700">
                Donation Rejected
              </h3>
              <p>{donationData.reason}</p>
            </div>
          )}

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
        </CardContent>

        {status === "pending" &&
          donationData.status !== "verified" &&
          donationData.status !== "rejected" && (
            <CardFooter className="flex justify-between gap-4">
              <Button
                variant="outline"
                className="w-full border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                onClick={() => setStatus("rejecting")}
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
