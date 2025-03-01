"use client";
import { useState, useEffect } from "react";
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
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  onSnapshot,
  collection,
  doc,
  updateDoc,
  query,
  where,
  collectionGroup,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";
import { getDoc, setDoc } from "firebase/firestore";

export function CashDonationTable() {
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
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [donorName, setDonorName] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  // Cash donation form state
  const [addDonationOpen, setAddDonationOpen] = useState(false);
  const [newDonorName, setNewDonorName] = useState("");
  const [newDonorEmail, setNewDonorEmail] = useState("");
  const [newDonorPhone, setNewDonorPhone] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [donatedOn, setDonatedOn] = useState("");
  const [wantsCertificate, setWantsCertificate] = useState(false);

  // Filter functions for each tab
  const filteredCompletedDonations = completedDonations.filter(
    (donation) =>
      (statusFilter === "All" || donation.status === statusFilter) &&
      (donation.donor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        donation.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        donation.amount?.includes(searchTerm) ||
        donation.status?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredPendingDonations = pendingDonations.filter(
    (donation) =>
      donation.donor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donation.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donation.amount?.includes(searchTerm) ||
      donation.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRejectedDonations = rejectedDonations.filter(
    (donation) =>
      donation.donor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donation.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donation.amount?.includes(searchTerm) ||
      donation.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donation.reason?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    // Get current year and NGO ID
    const currentYear = new Date().getFullYear().toString();
    const ngoId = auth.currentUser?.uid;

    if (!ngoId) {
      console.log("No NGO ID found");
      setLoading(false);
      return;
    }

    console.log("Setting up listeners for NGO:", ngoId);

    // Set up listeners
    const completedUnsubscribe = setupCompletedDonationsListener(
      ngoId,
      currentYear
    );
    const approvalsUnsubscribe = setupDonationApprovalsListener(ngoId);

    // Clean up listeners on unmount
    return () => {
      if (completedUnsubscribe) completedUnsubscribe();
      if (approvalsUnsubscribe) approvalsUnsubscribe();
    };
  }, []);

  // Set up listener for completed donations (from cash collection)
  const setupCompletedDonationsListener = (ngoId, currentYear) => {
    console.log("Setting up completed donations listener");

    return onSnapshot(
      collectionGroup(db, "cash"),
      (snapshot) => {
        let allCompletedDonations = [];

        snapshot.forEach((doc) => {
          // Only include donations that belong to this NGO and year
          const path = doc.ref.path;
          if (path.includes(`donations/${ngoId}/${currentYear}`)) {
            allCompletedDonations.push({
              id: doc.id,
              ...doc.data(),
              paymentMethod: "Cash",
            });
          }
        });

        console.log("Completed Cash Donations Data:", allCompletedDonations);

        // Format the data to match the expected structure
        const formattedDonations = allCompletedDonations.map((donation) => {
          // Extract timestamp for sorting
          const timestamp = donation.timestamp
            ? new Date(donation.timestamp).getTime()
            : donation.donatedOn
              ? new Date(donation.donatedOn).getTime()
              : 0;

          return {
            id: donation.id,
            donor: donation.name || donation.donorName || "Anonymous",
            amount: `₹${Number(donation.amount).toLocaleString()}`,
            date:
              donation.donatedOn ||
              (donation.timestamp
                ? new Date(donation.timestamp).toISOString().split("T")[0]
                : "N/A"),
            status: "Completed",
            email: donation.email || "N/A",
            phone: donation.phone || "N/A",
            address: donation.address || "N/A",
            rawData: donation,
            timestamp: timestamp,
          };
        });

        // Sort donations by timestamp (newest first)
        const sortedDonations = formattedDonations.sort(
          (a, b) => b.timestamp - a.timestamp
        );

        setCompletedDonations(sortedDonations);
        setLoading(false);
      },
      (error) => {
        console.error("Error in completed donations listener:", error);
        setLoading(false);
      }
    );
  };

  // Set up listener for donation approvals (pending and rejected)
  const setupDonationApprovalsListener = (ngoId) => {
    console.log("Setting up donation approvals listener");

    // We need to handle documents with and without the type field
    // First, let's create a query for documents with type="cash"
    const cashTypeQuery = query(
      collection(db, "donationApprovals"),
      where("type", "==", "cash")
    );

    // Second, let's create a query for documents with type=null
    const nullTypeQuery = query(
      collection(db, "donationApprovals"),
      where("type", "==", null)
    );

    // Create a combined listener for both queries
    const unsubscribe1 = onSnapshot(
      cashTypeQuery,
      (snapshot) => handleDonationApprovalSnapshot(snapshot, ngoId),
      (error) => {
        console.error("Error in cash type donation approvals listener:", error);
        setLoading(false);
      }
    );

    const unsubscribe2 = onSnapshot(
      nullTypeQuery,
      (snapshot) => handleDonationApprovalSnapshot(snapshot, ngoId),
      (error) => {
        console.error("Error in null type donation approvals listener:", error);
        setLoading(false);
      }
    );

    // For documents where the type field doesn't exist, we need a different approach
    // Let's get all documents and filter them client-side
    const allDocsQuery = collection(db, "donationApprovals");

    const unsubscribe3 = onSnapshot(
      allDocsQuery,
      (snapshot) => {
        const pendingDonationsArray = [];
        const rejectedDonationsArray = [];
        const removedDonationIds = new Set();
        const modifiedDonationIds = new Set();

        // Process each document change
        snapshot.docChanges().forEach((change) => {
          const doc = change.doc;
          const data = doc.data();
          const donationId = doc.id;

          // Only process documents where type field doesn't exist (undefined)
          // and skip documents we've already processed (with type="cash" or type=null)
          if (data.type !== undefined) return;

          // Only process donations for this NGO
          if (data.ngoId !== ngoId) return;

          // Handle document removal
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
            amount: `₹${Number(data.amount).toLocaleString()}`,
            date:
              data.donatedOn ||
              (data.timestamp
                ? new Date(data.timestamp).toISOString().split("T")[0]
                : "N/A"),
            phone: data.donorPhone || "N/A",
            reason: data.reason || "N/A",
            rawData: data,
            timestamp: data.timestamp
              ? new Date(data.timestamp).getTime()
              : data.donatedOn
                ? new Date(data.donatedOn).getTime()
                : 0,
          };

          // Add to appropriate array based on status
          if (data.status === "pending") {
            donationData.status = "Pending";
            pendingDonationsArray.push(donationData);
          } else if (data.status === "rejected") {
            donationData.status = "Rejected";
            rejectedDonationsArray.push(donationData);
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
      },
      (error) => {
        console.error(
          "Error in undefined type donation approvals listener:",
          error
        );
      }
    );

    // Return a function that unsubscribes from all listeners
    return () => {
      unsubscribe1();
      unsubscribe2();
      unsubscribe3();
    };
  };

  // Helper function to process donation approval snapshots
  const handleDonationApprovalSnapshot = (snapshot, ngoId) => {
    // Track document changes
    const pendingDonationsArray = [];
    const rejectedDonationsArray = [];
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
        amount: `₹${Number(data.amount).toLocaleString()}`,
        date:
          data.donatedOn ||
          (data.timestamp
            ? new Date(data.timestamp).toISOString().split("T")[0]
            : "N/A"),
        phone: data.donorPhone || "N/A",
        reason: data.reason || "N/A",
        rawData: data,
        timestamp: data.timestamp
          ? new Date(data.timestamp).getTime()
          : data.donatedOn
            ? new Date(data.donatedOn).getTime()
            : 0,
      };

      // Add to appropriate array based on status
      if (data.status === "pending") {
        donationData.status = "Pending";
        pendingDonationsArray.push(donationData);
      } else if (data.status === "rejected") {
        donationData.status = "Rejected";
        rejectedDonationsArray.push(donationData);
      }
      // Note: If status is neither pending nor rejected, it won't be added to either array
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

  // Add cash donation handler
  const addCashDonationHandler = async (e) => {
    e.preventDefault();
    if (
      !newAmount ||
      !newDonorName ||
      !newDonorEmail ||
      !newDonorPhone ||
      !donatedOn
    ) {
      toast.error("Please fill all the required fields");
      return;
    }

    const toasting = toast.loading("Adding donation...");

    try {
      const donationApprovalId = new Date().getTime().toString();
      const docRef = doc(db, "donationApprovals", donationApprovalId);
      const ngoId = auth.currentUser.uid;
      const ngoDocRef = doc(db, `ngo/${ngoId}`);
      const ngoDoc = await getDoc(ngoDocRef);
      const ngoName = ngoDoc.exists() ? ngoDoc.data().ngoName : "";

      await setDoc(docRef, {
        type: "cash",
        amount: newAmount,
        donorName: newDonorName,
        donorEmail: newDonorEmail,
        donorPhone: newDonorPhone,
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
          amount: newAmount,
          donorName: newDonorName,
          donorEmail: newDonorEmail,
          donorPhone: newDonorPhone,
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
          to: newDonorPhone,
          body: `Hello ${newDonorName}, thank you for donating ₹${newAmount} to ${ngoName}. Please confirm the donation amount by clicking the link below. 

Donation Confirmation Link - ${window.location.origin}/donation-approvals/${donationApprovalId}`,
        }),
      });

      setNewAmount("");
      setNewDonorName("");
      setNewDonorEmail("");
      setNewDonorPhone("");
      setDonatedOn("");
      setWantsCertificate(false);
      setAddDonationOpen(false);
      toast.success("Donation added successfully", { id: toasting });
    } catch (error) {
      console.error("Error adding donation:", error);
      toast.error("Error adding donation", { id: toasting });
    }
  };

  const openViewModal = (transaction) => {
    setSelectedTransaction(transaction);
    setViewOpen(true);
  };

  const openEditModal = (donation) => {
    console.log("Opening edit modal for donation:", donation);
    setSelectedDonation(donation);
    setDonorName(donation.rawData.donorName || "");
    setDonorPhone(donation.rawData.donorPhone || "");
    setAmount(donation.rawData.amount || "");
    setReason(donation.rawData.reason || "");
    setEditModalOpen(true);
  };

  const handleSave = () => {
    if (!selectedDonation) return;

    const donationRef = doc(db, "donationApprovals", selectedDonation.id);
    updateDoc(donationRef, {
      donorName: donorName,
      donorPhone: donorPhone,
      amount: amount,
      status: "pending",
      reason: null,
    })
      .then(() => {
        console.log("Donation updated successfully");
        setEditModalOpen(false);
      })
      .catch((error) => {
        console.error("Error updating donation:", error);
      });
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
        console.log("Donation verified successfully");
        // The onSnapshot listeners will automatically update the UI
      })
      .catch((error) => {
        console.error("Error verifying donation:", error);
      });
  };

  // Function to open rejection modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [donationToReject, setDonationToReject] = useState(null);

  const openRejectModal = (donation) => {
    setDonationToReject(donation);
    setRejectionReason("");
    setRejectModalOpen(true);
  };

  // Function to handle donation rejection
  const handleRejectDonation = () => {
    if (!donationToReject || !rejectionReason.trim()) return;

    const donationRef = doc(db, "donationApprovals", donationToReject.id);
    updateDoc(donationRef, {
      status: "rejected",
      reason: rejectionReason,
      rejectedAt: new Date().toISOString(),
    })
      .then(() => {
        console.log("Donation rejected successfully");
        setRejectModalOpen(false);
        // The onSnapshot listeners will automatically update the UI
      })
      .catch((error) => {
        console.error("Error rejecting donation:", error);
      });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-row justify-between items-center">
          <div>
            <CardTitle>Cash Donations</CardTitle>
            <CardDescription>
              View all cash donation records here (sorted by most recent first,
              updates in real-time).
            </CardDescription>
          </div>
          <Button onClick={() => setAddDonationOpen(true)}>
            Add Cash Donation
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
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
            placeholder="Search donations..."
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
                No completed donations found.
              </div>
            ) : filteredCompletedDonations.length === 0 ? (
              <div className="text-center py-4">
                No donations match your filters.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Donor</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Amount</TableHead>
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
                      <TableCell>{transaction.amount}</TableCell>
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
                No pending donations found.
              </div>
            ) : filteredPendingDonations.length === 0 ? (
              <div className="text-center py-4">
                No donations match your search.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Donor</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Amount</TableHead>
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
                      <TableCell>{transaction.amount}</TableCell>
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
                No rejected donations found.
              </div>
            ) : filteredRejectedDonations.length === 0 ? (
              <div className="text-center py-4">
                No donations match your search.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Donor</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Amount</TableHead>
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
                      <TableCell>{transaction.amount}</TableCell>
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
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openEditModal(transaction)}
                          >
                            <Pencil className="h-4 w-4" />
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
                  <p className="mt-1">{selectedTransaction.donor}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="mt-1">{selectedTransaction.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Amount</p>
                  <p className="mt-1">{selectedTransaction.amount}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Date</p>
                  <p className="mt-1">{selectedTransaction.date}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <p className="mt-1">{selectedTransaction.status}</p>
                </div>
                {selectedTransaction.phone && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                    <p className="mt-1">{selectedTransaction.phone}</p>
                  </div>
                )}
                {selectedTransaction.status === "Rejected" &&
                  selectedTransaction.reason && (
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-gray-500">
                        Rejection Reason
                      </p>
                      <p className="mt-1">{selectedTransaction.reason}</p>
                    </div>
                  )}
                {selectedTransaction.rawData &&
                  selectedTransaction.rawData.wantsCertificate && (
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-gray-500">
                        Certificate
                      </p>
                      <p className="mt-1">Certificate Requested</p>
                    </div>
                  )}
                {selectedTransaction.address && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-gray-500">Address</p>
                    <p className="mt-1">{selectedTransaction.address}</p>
                  </div>
                )}
                {selectedTransaction.rawData &&
                  selectedTransaction.rawData.notes && (
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-gray-500">Notes</p>
                      <p className="mt-1">
                        {selectedTransaction.rawData.notes}
                      </p>
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
          <div className="space-y-4">
            <div>
              <label>Donor Name</label>
              <Input
                type="text"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                disabled={selectedDonation?.status !== "Rejected"}
              />
            </div>
            <div>
              <label>Donor Phone</label>
              <Input
                type="text"
                value={donorPhone}
                onChange={(e) => setDonorPhone(e.target.value)}
                disabled={selectedDonation?.status !== "Rejected"}
              />
            </div>
            <div>
              <label>Amount</label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={selectedDonation?.status !== "Rejected"}
              />
            </div>
            {selectedDonation?.status === "Rejected" && (
              <div>
                <label>Reason for Rejection</label>
                <Input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  readOnly
                />
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={selectedDonation?.status !== "Rejected"}
              >
                Resubmit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Donation Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Donation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Reason for Rejection
              </label>
              <textarea
                className="w-full p-2 border rounded-md"
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason for rejecting this donation..."
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRejectModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleRejectDonation}
                disabled={!rejectionReason.trim()}
              >
                Reject Donation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Cash Donation Dialog */}
      <Dialog open={addDonationOpen} onOpenChange={setAddDonationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Cash Donation</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Amount</Label>
              <Input
                type="number"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Donor Name</Label>
              <Input
                type="text"
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
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddDonationOpen(false)}
              >
                Cancel
              </Button>
              <Button type="button" onClick={addCashDonationHandler}>
                Add Donation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
