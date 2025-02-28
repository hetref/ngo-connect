"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import toast from "react-hot-toast";

export default function AcceptInvitationPage() {
  const params = useParams();
  const router = useRouter();
  const { ngoId, memberId } = params;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ngoData, setNgoData] = useState(null);
  const [memberData, setMemberData] = useState(null);
  const [user, setUser] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // Check authentication and fetch data
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        // Redirect to login if not authenticated
        router.replace(
          `/login?redirect=/accept-invitation/${ngoId}/${memberId}`
        );
        return;
      }

      setUser(currentUser);

      try {
        // Fetch NGO data
        const ngoDoc = await getDoc(doc(db, "ngo", ngoId));
        if (!ngoDoc.exists()) {
          setError("NGO not found");
          setLoading(false);
          return;
        }

        // Fetch member data
        const memberDoc = await getDoc(
          doc(db, "ngo", ngoId, "members", memberId)
        );
        if (!memberDoc.exists()) {
          setError("Invitation not found");
          setLoading(false);
          return;
        }

        // Get the data
        const ngoData = ngoDoc.data();
        const memberData = memberDoc.data();

        // Verify the invitation is for the current user's email
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.email !== memberData.email) {
            setError("This invitation is not for your account");
            setLoading(false);
            return;
          }
        }

        // Set the data
        setNgoData(ngoData);
        setMemberData(memberData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching invitation:", error);
        setError("Failed to load invitation");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [ngoId, memberId, router]);

  const handleAccept = async () => {
    setProcessing(true);
    try {
      // 1. Update the member status in NGO collection
      await updateDoc(doc(db, "ngo", ngoId, "members", memberId), {
        status: "active",
        userId: user.uid,
      });

      // 2. Update the user document while preserving existing data
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();

        // Update the user document with NGO information while preserving existing data
        await updateDoc(userRef, {
          type: "ngo", // Change type from "user" to "ngo"
          ngoId: ngoId,
          role: "member",
          accessLevel: memberData.accessLevel,
          memberId: memberId,
          // Preserve other fields by not overwriting them
        });
      }

      toast.success("Invitation accepted successfully!");
      // Redirect to dashboard
      router.replace("/dashboard/ngo");
    } catch (error) {
      console.error("Error accepting invitation:", error);
      toast.error("Failed to accept invitation");
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    setProcessing(true);
    try {
      // Just update the member status to "declined"
      await updateDoc(doc(db, "ngo", ngoId, "members", memberId), {
        status: "declined",
      });

      toast.success("Invitation declined");
      // Redirect to home or dashboard
      router.replace("/");
    } catch (error) {
      console.error("Error declining invitation:", error);
      toast.error("Failed to decline invitation");
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading invitation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.replace("/")} className="w-full">
              Go Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>NGO Invitation</CardTitle>
          <CardDescription>
            You have been invited to join {ngoData?.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Hello {memberData?.name},</p>
          <p className="mb-4">
            You have been invited to join {ngoData?.name} as a member with
            {memberData?.accessLevel === "level1"
              ? " Level 1"
              : " Level 2"}{" "}
            access.
          </p>
          <p>Please accept or decline this invitation to continue.</p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleDecline}
            disabled={processing}
          >
            {processing ? "Processing..." : "Decline"}
          </Button>
          <Button onClick={handleAccept} disabled={processing}>
            {processing ? "Processing..." : "Accept"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
