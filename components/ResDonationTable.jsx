"use client";
import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Pencil, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  onSnapshot,
  collection,
  doc,
  updateDoc,
  addDoc,
  setDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import toast from "react-hot-toast";
import { auth } from "@/lib/firebase";

export function ResDonationTable() {
  // State for user data
  const [userData, setUserData] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [completedDonations, setCompletedDonations] = useState([]);
  const [pendingDonations, setPendingDonations] = useState([]);
  const [rejectedDonations, setRejectedDonations] = useState([]);
  const [activeTab, setActiveTab] = useState("completed");
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [resourceName, setResourceName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [donationToReject, setDonationToReject] = useState(null);
  const [unsubscribers, setUnsubscribers] = useState([]);

  // For new donation form
  const [newDonation, setNewDonation] = useState({
    donorName: "",
    donorEmail: "",
    donorPhone: "",
    resource: "",
    quantity: "",
    status: "pending",
  });

  // Add resource donation form state
  const [addResourceDialogOpen, setAddResourceDialogOpen] = useState(false);
  const [newDonorName, setNewDonorName] = useState("");
  const [newDonorEmail, setNewDonorEmail] = useState("");
  const [newDonorPhone, setNewDonorPhone] = useState("");
  const [newResource, setNewResource] = useState("");
  const [newQuantity, setNewQuantity] = useState("");
  const [donatedOn, setDonatedOn] = useState("");

  // Filter functions for each tab
  const filteredCompletedDonations = completedDonations.filter(
    (donation) =>
      (statusFilter === "All" || donation.status === statusFilter) &&
      (donation.donor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        donation.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        donation.resource?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        donation.quantity?.includes(searchTerm) ||
        donation.status?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredPendingDonations = pendingDonations.filter(
    (donation) =>
      donation.donor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donation.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donation.resource?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donation.quantity?.includes(searchTerm) ||
      donation.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRejectedDonations = rejectedDonations.filter(
    (donation) =>
      donation.donor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donation.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donation.resource?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donation.quantity?.includes(searchTerm) ||
      donation.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donation.reason?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    // First fetch user data to determine the correct NGO ID
    const fetchUserData = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          console.log("No user found");
          setLoading(false);
          setError("User not authenticated");
          return;
        }

        // Get user document to check role and type
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (!userDoc.exists()) {
          console.log("User document not found");
          setLoading(false);
          setError("User document not found");
          return;
        }

        const userDataFromFirestore = userDoc.data();
        setUserData(userDataFromFirestore);

        // Now that we have user data, set up the donation listeners
        setupDonationListeners(userDataFromFirestore);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setLoading(false);
        setError("Error fetching user data");
      }
    };

    fetchUserData();
  }, []);

  // Set up donation listeners with the appropriate NGO ID
  const setupDonationListeners = (userDataFromFirestore) => {
    // Determine which NGO ID to use based on user type and role
    let ngoId;
    const userId = auth.currentUser.uid;

    if (userDataFromFirestore.type === "ngo") {
      if (userDataFromFirestore.role === "admin") {
        // For NGO admin, use their own ID
        ngoId = userId;
      } else if (userDataFromFirestore.role === "member") {
        // For NGO member, use the ngoId from their user data
        ngoId = userDataFromFirestore.ngoId;
      }
    } else {
      // For other user types, use their own ID (fallback)
      ngoId = userId;
    }

    if (!ngoId) {
      console.log("No NGO ID found");
      setLoading(false);
      setError("NGO information not available");
      return;
    }

    console.log("Setting up listeners for NGO:", ngoId);

    // Set up listeners
    const completedUnsubscribe = setupCompletedDonationsListener(ngoId, userId);
    const approvalsUnsubscribe = setupDonationApprovalsListener(ngoId);

    // Clean up listeners on unmount
    return () => {
      console.log("Cleaning up resource donation listeners");
      if (completedUnsubscribe) completedUnsubscribe();
      if (approvalsUnsubscribe) approvalsUnsubscribe();
      unsubscribers.forEach((unsub) => unsub());
    };
  };

  // Set up listener for completed resource donations
  const setupCompletedDonationsListener = (ngoId, userId) => {
    console.log("Setting up completed resource donations listener");
    setLoading(true);

    if (!ngoId) {
      setLoading(false);
      return null;
    }

    const currentYear = new Date().getFullYear().toString();
    console.log("Year collection path:", `donations/${ngoId}/${currentYear}`);

    try {
      // Get the year collection
      const yearRef = collection(db, `donations/${ngoId}/${currentYear}`);

      // Clear previous listeners
      unsubscribers.forEach((unsub) => unsub());
      setUnsubscribers([]);

      const yearUnsubscribe = onSnapshot(yearRef, (yearSnapshot) => {
        const newUnsubscribers = [];
        const allCompletedDonations = [];

        // Add this line to handle initial empty state
        setLoading(true);

        yearSnapshot.docs.forEach((userDoc) => {
          const userId = userDoc.id;
          console.log("Processing user:", userId);

          try {
            // Get the resources subcollection for this user
            const resourcesRef = collection(
              db,
              `donations/${ngoId}/${currentYear}/${userId}/resources`
            );

            const resourceUnsubscribe = onSnapshot(
              resourcesRef,
              (resourcesSnap) => {
                // Add this check to handle empty resources
                if (resourcesSnap.empty) {
                  setLoading(false);
                  return;
                }

                resourcesSnap.forEach((doc) => {
                  const data = doc.data();
                  if (
                    data.status === "completed" ||
                    data.status === "verified"
                  ) {
                    const donation = {
                      id: doc.id,
                      userId,
                      donor: data.donorName || "Anonymous",
                      email: data.donorEmail || "N/A",
                      resource: data.resource || "N/A",
                      quantity: data.quantity || "N/A",
                      date:
                        data.date ||
                        (data.createdAt
                          ? new Date(data.createdAt.toDate())
                              .toISOString()
                              .split("T")[0]
                          : "N/A"),
                      status:
                        data.status === "verified" ? "Verified" : "Completed",
                      phone: data.donorPhone || "N/A",
                      rawData: data,
                      timestamp: data.createdAt
                        ? data.createdAt.toDate().getTime()
                        : 0,
                    };

                    allCompletedDonations.push(donation);
                  }
                });

                // Sort donations by timestamp (newest first)
                const sortedDonations = allCompletedDonations.sort(
                  (a, b) => b.timestamp - a.timestamp
                );

                setCompletedDonations(sortedDonations);
                setLoading(false);
              }
            );

            newUnsubscribers.push(resourceUnsubscribe);
          } catch (error) {
            console.error(
              `Error fetching resources for user ${userId}:`,
              error
            );
            setLoading(false);
          }
        });

        // Add these lines to handle initial load completion
        if (yearSnapshot.empty) {
          setCompletedDonations([]);
          setLoading(false);
        } else {
          setUnsubscribers((prev) => [...prev, ...newUnsubscribers]);
          setLoading(false); // Add this line to ensure loading state is cleared
        }
      });

      // Add year collection listener to unsubscribers
      setUnsubscribers((prev) => [...prev, yearUnsubscribe]);

      // Also listen for verified donations in donationApprovals
      const verifiedDonationsQuery = query(
        collection(db, "donationApprovals"),
        where("type", "==", "resource"),
        where("status", "==", "verified"),
        where("ngoId", "==", ngoId)
      );

      const verifiedDonationsUnsubscribe = onSnapshot(
        verifiedDonationsQuery,
        (snapshot) => {
          const verifiedDonations = [];

          snapshot.forEach((doc) => {
            const data = doc.data();
            const donation = {
              id: doc.id,
              donor: data.donorName || "Anonymous",
              email: data.donorEmail || "N/A",
              resource: data.resource || "N/A",
              quantity: data.quantity || "N/A",
              date:
                data.date ||
                (data.createdAt
                  ? new Date(data.createdAt.toDate())
                      .toISOString()
                      .split("T")[0]
                  : "N/A"),
              status: "Verified",
              phone: data.donorPhone || "N/A",
              rawData: data,
              timestamp: data.createdAt ? data.createdAt.toDate().getTime() : 0,
            };

            verifiedDonations.push(donation);
          });

          // Merge with existing completed donations
          setCompletedDonations((prev) => {
            // Filter out any verified donations that might be duplicates
            const filteredPrev = prev.filter(
              (p) => !verifiedDonations.some((v) => v.id === p.id)
            );

            // Combine and sort
            return [...filteredPrev, ...verifiedDonations].sort(
              (a, b) => b.timestamp - a.timestamp
            );
          });
        }
      );

      // Add to unsubscribers
      setUnsubscribers((prev) => [...prev, verifiedDonationsUnsubscribe]);

      return () => {
        console.log("Cleaning up year collection listener");
        unsubscribers.forEach((unsub) => unsub());
      };
    } catch (err) {
      console.error("Error setting up year collection listener:", err);
      setError("Failed to set up data listener: " + err.message);
      setLoading(false);
      return null;
    }
  };

  // Set up listener for donation approvals (pending and rejected)
  const setupDonationApprovalsListener = (ngoId) => {
    console.log("Setting up resource donation approvals listener");

    // We need to handle documents with and without the type field
    // First, let's create a query for documents with type="resource"
    const resourceTypeQuery = query(
      collection(db, "donationApprovals"),
      where("type", "==", "resource")
    );

    // Create a listener for resource type donations
    const unsubscribe = onSnapshot(
      resourceTypeQuery,
      (snapshot) => handleDonationApprovalSnapshot(snapshot, ngoId),
      (error) => {
        console.error(
          "Error in resource type donation approvals listener:",
          error
        );
        setLoading(false);
      }
    );

    // Return a function that unsubscribes from all listeners
    return () => {
      unsubscribe();
    };
  };

  // Helper function to process donation approval snapshots
  const handleDonationApprovalSnapshot = (snapshot, ngoId) => {
    // Track document changes
    const pendingDonationsArray = [];
    const rejectedDonationsArray = [];
    const verifiedDonationsArray = [];
    const removedDonationIds = new Set();
    const modifiedDonationIds = new Set();

    // Process each document change
    snapshot.docChanges().forEach((change) => {
      const doc = change.doc;
      const data = doc.data();
      const donationId = doc.id;

      // Only process donations for this NGO
      if (data.ngoId !== ngoId) return;

      // Handle document removal or status changes
      if (change.type === "removed") {
        removedDonationIds.add(donationId);
        return;
      }

      // Track modified documents
      if (change.type === "modified") {
        modifiedDonationIds.add(donationId);
      }

      const donationData = {
        id: donationId,
        donor: data.donorName || "Anonymous",
        email: data.donorEmail || "N/A",
        resource: data.resource || "N/A",
        quantity: data.quantity || "N/A",
        date:
          data.date ||
          (data.createdAt
            ? new Date(data.createdAt.toDate()).toISOString().split("T")[0]
            : "N/A"),
        phone: data.donorPhone || "N/A",
        reason: data.reason || "N/A",
        rawData: data,
        timestamp: data.createdAt ? data.createdAt.toDate().getTime() : 0,
      };

      // Add to appropriate array based on status
      if (data.status === "pending") {
        donationData.status = "Pending";
        pendingDonationsArray.push(donationData);
      } else if (data.status === "rejected") {
        donationData.status = "Rejected";
        rejectedDonationsArray.push(donationData);
      } else if (data.status === "verified") {
        donationData.status = "Verified";
        verifiedDonationsArray.push(donationData);
      }
    });

    // Update pending donations state
    setPendingDonations((prevDonations) => {
      // Remove donations that were deleted or modified
      const filteredDonations = prevDonations.filter(
        (donation) =>
          !removedDonationIds.has(donation.id) &&
          (!modifiedDonationIds.has(donation.id) ||
            pendingDonationsArray.some((d) => d.id === donation.id))
      );

      // Add new pending donations (avoiding duplicates)
      const existingIds = new Set(filteredDonations.map((d) => d.id));
      const newDonations = [
        ...filteredDonations,
        ...pendingDonationsArray.filter((d) => !existingIds.has(d.id)),
      ];

      return newDonations.sort((a, b) => b.timestamp - a.timestamp);
    });

    // Update rejected donations state
    setRejectedDonations((prevDonations) => {
      // Remove donations that were deleted or modified
      const filteredDonations = prevDonations.filter(
        (donation) =>
          !removedDonationIds.has(donation.id) &&
          (!modifiedDonationIds.has(donation.id) ||
            rejectedDonationsArray.some((d) => d.id === donation.id))
      );

      // Add new rejected donations (avoiding duplicates)
      const existingIds = new Set(filteredDonations.map((d) => d.id));
      const newDonations = [
        ...filteredDonations,
        ...rejectedDonationsArray.filter((d) => !existingIds.has(d.id)),
      ];

      return newDonations.sort((a, b) => b.timestamp - a.timestamp);
    });

    // Update completed donations with verified ones
    setCompletedDonations((prevDonations) => {
      // Remove any verified donations that were modified or deleted
      const filteredDonations = prevDonations.filter(
        (donation) =>
          !removedDonationIds.has(donation.id) &&
          (!modifiedDonationIds.has(donation.id) ||
            verifiedDonationsArray.some((d) => d.id === donation.id))
      );

      // Add new verified donations (avoiding duplicates)
      const existingIds = new Set(filteredDonations.map((d) => d.id));
      const newDonations = [
        ...filteredDonations,
        ...verifiedDonationsArray.filter((d) => !existingIds.has(d.id)),
      ];

      return newDonations.sort((a, b) => b.timestamp - a.timestamp);
    });

    setLoading(false);
  };

  // Calculate donation counts
  const donationCounts = {
    total:
      completedDonations.length +
      pendingDonations.length +
      rejectedDonations.length,
    completed: completedDonations.length,
    pending: pendingDonations.length,
    rejected: rejectedDonations.length,
  };

  const openViewModal = (transaction) => {
    setSelectedTransaction(transaction);
    setViewOpen(true);
  };

  const openEditModal = (donation) => {
    console.log("Opening edit modal for donation:", donation);
    setSelectedDonation(donation);
    setDonorName(donation.rawData.donorName || "");
    setDonorEmail(donation.rawData.donorEmail || "");
    setDonorPhone(donation.rawData.donorPhone || "");
    setResourceName(donation.rawData.resource || "");
    setQuantity(donation.rawData.quantity || "");
    setReason(donation.rawData.reason || "");
    setEditModalOpen(true);
  };

  const handleSave = () => {
    if (!selectedDonation) return;

    const donationRef = doc(db, "donationApprovals", selectedDonation.id);
    updateDoc(donationRef, {
      donorName: donorName,
      donorEmail: donorEmail,
      donorPhone: donorPhone,
      resource: resourceName,
      quantity: quantity,
      status: "pending",
      reason: null,
    })
      .then(() => {
        console.log("Resource donation updated successfully");
        setEditModalOpen(false);
      })
      .catch((error) => {
        console.error("Error updating resource donation:", error);
      });
  };

  const openAddModal = () => {
    // Reset form values
    setNewDonation({
      donorName: "",
      donorEmail: "",
      donorPhone: "",
      resource: "",
      quantity: "",
      status: "pending",
    });
    setAddModalOpen(true);
  };

  const handleAddDonation = async () => {
    if (!ngoId || !user?.uid) {
      console.error("Missing required IDs for adding donation", {
        ngoId,
        userId: user?.uid,
      });
      setError("Missing required information to add donation");
      return;
    }

    try {
      const currentYear = new Date().getFullYear().toString();

      // Add timestamp and user info to new donation
      const donationWithTimestamp = {
        ...newDonation,
        userId: user.uid,
        date: new Date().toISOString().split("T")[0], // Format as YYYY-MM-DD
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        type: "resource", // Add type field to identify as resource donation
      };

      console.log("Adding new resource donation:", donationWithTimestamp);

      // Create user document in year collection if it doesn't exist
      const userDocRef = doc(
        db,
        `donations/${ngoId}/${currentYear}/${user.uid}`
      );
      await setDoc(userDocRef, { exists: true }, { merge: true });

      // Add to the resources subcollection under the user
      const resourcesRef = collection(
        db,
        `donations/${ngoId}/${currentYear}/${user.uid}/resources`
      );
      await addDoc(resourcesRef, donationWithTimestamp);

      console.log("Successfully added new resource donation");

      // Close modal after successful addition
      setAddModalOpen(false);
    } catch (error) {
      console.error("Error adding document: ", error);
      setError("Failed to add donation: " + error.message);
    }
  };

  // Function to handle donation verification
  const handleVerifyDonation = (donation) => {
    if (!donation) return;

    const donationRef = doc(db, "donationApprovals", donation.id);
    updateDoc(donationRef, {
      status: "verified",
      verifiedAt: new Date().toISOString(),
    })
      .then(() => {
        console.log("Resource donation verified successfully");
        // The onSnapshot listeners will automatically update the UI
      })
      .catch((error) => {
        console.error("Error verifying resource donation:", error);
      });
  };

  // Function to handle donation rejection
  const openRejectModal = (donation) => {
    setDonationToReject(donation);
    setRejectionReason("");
    setRejectModalOpen(true);
  };

  const handleRejectDonation = () => {
    if (!donationToReject || !rejectionReason.trim()) return;

    const donationRef = doc(db, "donationApprovals", donationToReject.id);
    updateDoc(donationRef, {
      status: "rejected",
      reason: rejectionReason,
      rejectedAt: new Date().toISOString(),
    })
      .then(() => {
        console.log("Resource donation rejected successfully");
        setRejectModalOpen(false);
        // The onSnapshot listeners will automatically update the UI
      })
      .catch((error) => {
        console.error("Error rejecting resource donation:", error);
      });
  };

  const handleNewDonationChange = (e) => {
    const { name, value } = e.target;
    setNewDonation((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Add resource donation handler
  const addResourceDonationHandler = async (e) => {
    e.preventDefault();
    if (
      !newDonorName ||
      !newDonorEmail ||
      !newDonorPhone ||
      !newResource ||
      !newQuantity ||
      !donatedOn ||
      !resourceName
    ) {
      toast.error("Please fill all the required fields");
      return;
    }

    const toasting = toast.loading("Adding resource donation...");

    try {
      const donationApprovalId = new Date().getTime().toString();
      const docRef = doc(db, "donationApprovals", donationApprovalId);
      const ngoId = user.uid;

      // Get NGO details
      const ngoDocRef = doc(db, `ngo/${ngoId}`);
      const ngoDoc = await getDoc(ngoDocRef);
      const ngoName = ngoDoc.exists() ? ngoDoc.data().ngoName : "";

      // Create donation data object
      const donationData = {
        type: "resource",
        donorName: newDonorName,
        donorEmail: newDonorEmail,
        donorPhone: newDonorPhone,
        resource: newResource,
        resourceName: resourceName,
        quantity: Number(newQuantity),
        donatedOn,
        donationApprovalId,
        ngoName,
        ngoId,
        status: "pending",
        timestamp: new Date().toLocaleString(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Store in donationApprovals collection
      await setDoc(docRef, donationData);

      // Store in res collection
      const resRef = doc(db, "res", donationApprovalId);
      await setDoc(resRef, {
        ...donationData,
        // Add any additional fields specific to res collection if needed
      });

      await fetch("/api/donation-approval-resources", {
        method: "POST",
        body: JSON.stringify({
          resource: newResource,
          quantity: newQuantity,
          donorName: newDonorName,
          donorEmail: newDonorEmail,
          donorPhone: newDonorPhone,
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
          to: newDonorPhone,
          body: `Hello ${newDonorName}, thank you for donating ${newQuantity} ${newResource} to ${ngoName}. 
Please confirm your donation by clicking the link below.

Confirmation Link: ${window.location.origin}/donation-approvals/${donationApprovalId}`,
        }),
      });

      // Reset form
      setNewDonorName("");
      setNewDonorEmail("");
      setNewDonorPhone("");
      setNewResource("");
      setNewQuantity("");
      setDonatedOn("");
      setResourceName("");
      setAddResourceDialogOpen(false);

      toast.success("Resource donation added for approval", { id: toasting });
    } catch (error) {
      console.error("Error adding resource donation:", error);
      toast.error("Error adding donation", { id: toasting });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Resource Donations</CardTitle>
          <CardDescription>
            View all resource donations here (sorted by most recent first,
            updates in real-time).
          </CardDescription>
        </div>
        <Button
          onClick={() => setAddResourceDialogOpen(true)}
          className="ml-auto"
          disabled={!ngoId}
        >
          <Plus className="mr-2 h-4 w-4" /> Add Resource Donation
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
            role="alert"
          >
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {!ngoId && (
          <div
            className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-4"
            role="alert"
          >
            <strong className="font-bold">Warning: </strong>
            <span className="block sm:inline">
              No NGO ID found. Please make sure you're logged in with an NGO
              account.
            </span>
          </div>
        )}

        {!loading && donationCounts.total > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-slate-100 p-3 rounded-lg">
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-semibold">{donationCounts.total}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-green-600">Completed</p>
              <p className="text-2xl font-semibold">
                {donationCounts.completed}
              </p>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="text-sm text-yellow-600">Pending</p>
              <p className="text-2xl font-semibold">{donationCounts.pending}</p>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <p className="text-sm text-red-600">Rejected</p>
              <p className="text-2xl font-semibold">
                {donationCounts.rejected}
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Search resource donations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="sm:flex-1"
          />
          {activeTab === "completed" && (
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Statuses</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Verified">Verified</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>

          <TabsContent value="completed">
            {loading ? (
              <div className="text-center py-4">Loading donations...</div>
            ) : completedDonations.length === 0 ? (
              <div className="text-center py-4">
                No completed resource donations found.
              </div>
            ) : filteredCompletedDonations.length === 0 ? (
              <div className="text-center py-4">
                No resource donations match your filters.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Donor</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompletedDonations.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{transaction.donor}</TableCell>
                      <TableCell>{transaction.email}</TableCell>
                      <TableCell>{transaction.resource}</TableCell>
                      <TableCell>{transaction.quantity}</TableCell>
                      <TableCell>{transaction.date}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                          {transaction.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openViewModal(transaction)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="pending">
            {loading ? (
              <div className="text-center py-4">Loading donations...</div>
            ) : pendingDonations.length === 0 ? (
              <div className="text-center py-4">
                No pending resource donations found.
              </div>
            ) : filteredPendingDonations.length === 0 ? (
              <div className="text-center py-4">
                No resource donations match your search.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Donor</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPendingDonations.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{transaction.donor}</TableCell>
                      <TableCell>{transaction.email}</TableCell>
                      <TableCell>{transaction.resource}</TableCell>
                      <TableCell>{transaction.quantity}</TableCell>
                      <TableCell>{transaction.date}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                          {transaction.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openViewModal(transaction)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openEditModal(transaction)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="bg-green-50 hover:bg-green-100"
                            onClick={() => handleVerifyDonation(transaction)}
                            title="Verify Donation"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-green-600"
                            >
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="bg-red-50 hover:bg-red-100"
                            onClick={() => openRejectModal(transaction)}
                            title="Reject Donation"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-red-600"
                            >
                              <path d="M18 6L6 18" />
                              <path d="M6 6l12 12" />
                            </svg>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="rejected">
            {loading ? (
              <div className="text-center py-4">Loading donations...</div>
            ) : rejectedDonations.length === 0 ? (
              <div className="text-center py-4">
                No rejected resource donations found.
              </div>
            ) : filteredRejectedDonations.length === 0 ? (
              <div className="text-center py-4">
                No resource donations match your search.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Donor</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRejectedDonations.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{transaction.donor}</TableCell>
                      <TableCell>{transaction.email}</TableCell>
                      <TableCell>{transaction.resource}</TableCell>
                      <TableCell>{transaction.quantity}</TableCell>
                      <TableCell>{transaction.date}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                          {transaction.status}
                        </span>
                      </TableCell>
                      <TableCell>{transaction.reason}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openViewModal(transaction)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* View Transaction Modal */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Donation Details</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Donor</p>
                  <p className="mt-1">{selectedTransaction?.donor}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="mt-1">{selectedTransaction?.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <p className="mt-1">{selectedTransaction?.phone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Resource</p>
                  <p className="mt-1">{selectedTransaction?.resource}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Date</p>
                  <p className="mt-1">{selectedTransaction?.date}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Quantity</p>
                  <p className="mt-1">{selectedTransaction?.quantity}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <p className="mt-1">{selectedTransaction?.status}</p>
                </div>
                {selectedTransaction?.status === "Rejected" && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Reason</p>
                    <p className="mt-1">{selectedTransaction?.reason}</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setViewOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Donation Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Donation</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="donor-name" className="text-right">
                Donor Name
              </Label>
              <Input
                id="donor-name"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                disabled={selectedDonation?.status !== "Rejected"}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="donor-email" className="text-right">
                Email
              </Label>
              <Input
                id="donor-email"
                value={donorEmail}
                onChange={(e) => setDonorEmail(e.target.value)}
                disabled={selectedDonation?.status !== "Rejected"}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="donor-phone" className="text-right">
                Phone
              </Label>
              <Input
                id="donor-phone"
                value={donorPhone}
                onChange={(e) => setDonorPhone(e.target.value)}
                disabled={selectedDonation?.status !== "Rejected"}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="resource" className="text-right">
                Resource
              </Label>
              <Input
                id="resource"
                value={resourceName}
                onChange={(e) => setResourceName(e.target.value)}
                disabled={selectedDonation?.status !== "Rejected"}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">
                Quantity
              </Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                disabled={selectedDonation?.status !== "Rejected"}
                className="col-span-3"
              />
            </div>
            {selectedDonation?.status === "Rejected" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="reason" className="text-right">
                  Reason for Rejection
                </Label>
                <Textarea
                  id="reason"
                  value={reason}
                  readOnly
                  className="col-span-3"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setEditModalOpen(false)} variant="outline">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={selectedDonation?.status !== "Rejected"}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Donation Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Donation</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-donor-name" className="text-right">
                Donor Name
              </Label>
              <Input
                id="new-donor-name"
                name="donorName"
                value={newDonation.donorName}
                onChange={handleNewDonationChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-donor-email" className="text-right">
                Email
              </Label>
              <Input
                id="new-donor-email"
                name="donorEmail"
                value={newDonation.donorEmail}
                onChange={handleNewDonationChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-donor-phone" className="text-right">
                Phone
              </Label>
              <Input
                id="new-donor-phone"
                name="donorPhone"
                value={newDonation.donorPhone}
                onChange={handleNewDonationChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-resource" className="text-right">
                Resource
              </Label>
              <Input
                id="new-resource"
                name="resource"
                value={newDonation.resource}
                onChange={handleNewDonationChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-quantity" className="text-right">
                Quantity
              </Label>
              <Input
                id="new-quantity"
                name="quantity"
                type="number"
                value={newDonation.quantity}
                onChange={handleNewDonationChange}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setAddModalOpen(false)} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleAddDonation}>Add Donation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Resource Donation Dialog */}
      <Dialog
        open={addResourceDialogOpen}
        onOpenChange={setAddResourceDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Resource Donation</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Donor Name</Label>
              <Input
                value={newDonorName}
                onChange={(e) => setNewDonorName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Donor Email</Label>
              <Input
                type="email"
                value={newDonorEmail}
                onChange={(e) => setNewDonorEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Donor Phone</Label>
              <Input
                type="tel"
                value={newDonorPhone}
                onChange={(e) => setNewDonorPhone(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Resource </Label>
              <Input
                value={resourceName}
                onChange={(e) => setResourceName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Resource Type</Label>
              <Input
                value={newResource}
                onChange={(e) => setNewResource(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                value={newQuantity}
                onChange={(e) => setNewQuantity(e.target.value)}
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
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddResourceDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="button" onClick={addResourceDonationHandler}>
                Add Donation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
