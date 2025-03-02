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
  deleteDoc,
  getDoc,
  setDoc,
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
import toast from "react-hot-toast";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export function OnlineDonationTable() {
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
  const [transactionId, setTransactionId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [donationDate, setDonationDate] = useState("");
  const [reason, setReason] = useState("");
  const [userData, setUserData] = useState(null);

  // Add online donation form state
  const [addDonationOpen, setAddDonationOpen] = useState(false);
  const [newAmount, setNewAmount] = useState("");
  const [newDonorName, setNewDonorName] = useState("");
  const [newDonorEmail, setNewDonorEmail] = useState("");
  const [newDonorPhone, setNewDonorPhone] = useState("");
  const [newDonatedOn, setNewDonatedOn] = useState("");
  const [newTransactionId, setNewTransactionId] = useState("");
  const [newPaymentMethod, setNewPaymentMethod] = useState("UPI");
  const [wantsCertificate, setWantsCertificate] = useState(false);

  // Filter functions for each tab
  const filteredCompletedDonations = completedDonations.filter(
    (donation) =>
      (statusFilter === "All" || donation.status === statusFilter) &&
      (donation.donor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        donation.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        donation.amount?.includes(searchTerm) ||
        donation.transactionId
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        donation.paymentMethod
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        donation.status?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredPendingDonations = pendingDonations.filter(
    (donation) =>
      donation.donor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donation.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donation.amount?.includes(searchTerm) ||
      donation.transactionId
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      donation.paymentMethod
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      donation.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRejectedDonations = rejectedDonations.filter(
    (donation) =>
      donation.donor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donation.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donation.amount?.includes(searchTerm) ||
      donation.transactionId
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      donation.paymentMethod
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
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
          return;
        }

        // Get user document to check role and type
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (!userDoc.exists()) {
          console.log("User document not found");
          setLoading(false);
          return;
        }

        const userDataFromFirestore = userDoc.data();
        setUserData(userDataFromFirestore);

        // Now that we have user data, set up the donation listeners
        setupDonationListeners(userDataFromFirestore);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Set up donation listeners with the appropriate NGO ID
  const setupDonationListeners = (userDataFromFirestore) => {
    // Get current year
    const currentYear = new Date().getFullYear().toString();

    // Determine which NGO ID to use based on user type and role
    let ngoId;

    if (userDataFromFirestore.type === "ngo") {
      if (userDataFromFirestore.role === "admin") {
        // For NGO admin, use their own ID
        ngoId = auth.currentUser.uid;
      } else if (userDataFromFirestore.role === "member") {
        // For NGO member, use the ngoId from their user data
        ngoId = userDataFromFirestore.ngoId;
      }
    } else {
      // For other user types, use their own ID (fallback)
      ngoId = auth.currentUser.uid;
    }

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
  };

  // Set up listener for completed donations (from online collection)
  const setupCompletedDonationsListener = (ngoId, currentYear) => {
    console.log("Setting up completed online donations listener");

    return onSnapshot(
      collectionGroup(db, "online"),
      (snapshot) => {
        let allCompletedDonations = [];

        snapshot.forEach((doc) => {
          // Only include donations that belong to this NGO and year
          const path = doc.ref.path;
          if (path.includes(`donations/${ngoId}/${currentYear}`)) {
            allCompletedDonations.push({
              id: doc.id,
              ...doc.data(),
              paymentMethod: doc.data().paymentMethod || "Online",
              docRef: doc.ref,
            });
          }
        });

        console.log("Completed Online Donations Data:", allCompletedDonations);

        // Format the data to match the expected structure
        const formattedDonations = allCompletedDonations.map((donation) => {
          // Extract timestamp for sorting
          const timestamp = donation.timestamp
            ? new Date(donation.timestamp).getTime()
            : donation.donatedOn
              ? new Date(donation.donatedOn).getTime()
              : 0;

          // Extract donation date properly
          const donationDate = extractDonationDate(donation);

          return {
            id: donation.id,
            donor: donation.name || donation.donorName || "Anonymous",
            amount: `₹${Number(donation.amount).toLocaleString()}`,
            date: donationDate,
            status: "Completed",
            email: donation.email || "N/A",
            phone: donation.phone || "N/A",
            transactionId: donation.transactionId || "N/A",
            paymentMethod: donation.paymentMethod || "Online",
            rawData: donation,
            timestamp: timestamp,
            docRef: donation.docRef,
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

    // Create a query for documents with type="online"
    const onlineTypeQuery = query(
      collection(db, "donationApprovals"),
      where("type", "==", "online")
    );

    // Create a listener for online donations
    const unsubscribe = onSnapshot(
      onlineTypeQuery,
      (snapshot) => handleDonationApprovalSnapshot(snapshot, ngoId),
      (error) => {
        console.error("Error in online donation approvals listener:", error);
        setLoading(false);
      }
    );

    return unsubscribe;
  };

  // Handle donation approval snapshot
  const handleDonationApprovalSnapshot = (snapshot, ngoId) => {
    const pendingDonationsArray = [];
    const rejectedDonationsArray = [];

    snapshot.forEach((doc) => {
      const data = doc.data();

      // Only process donations for this NGO
      if (data.ngoId !== ngoId) return;

      // Extract donation date properly
      const donationDate = extractDonationDate(data);

      const formattedDonation = {
        id: doc.id,
        donor: data.donorName || "Anonymous",
        amount: `₹${Number(data.amount).toLocaleString()}`,
        date: donationDate,
        status: data.status || "pending",
        email: data.donorEmail || "N/A",
        phone: data.donorPhone || "N/A",
        transactionId: data.transactionId || "N/A",
        paymentMethod: data.paymentMethod || "Online",
        reason: data.reason || "",
        rawData: data,
        timestamp: data.timestamp ? new Date(data.timestamp).getTime() : 0,
        docRef: doc.ref,
      };

      if (data.status === "rejected") {
        rejectedDonationsArray.push(formattedDonation);
      } else if (data.status === "pending" || !data.status) {
        pendingDonationsArray.push(formattedDonation);
      }
    });

    // Sort by timestamp (newest first)
    pendingDonationsArray.sort((a, b) => b.timestamp - a.timestamp);
    rejectedDonationsArray.sort((a, b) => b.timestamp - a.timestamp);

    setPendingDonations(pendingDonationsArray);
    setRejectedDonations(rejectedDonationsArray);
    setLoading(false);
  };

  // Extract donation date from various possible fields
  const extractDonationDate = (donation) => {
    // Try different date fields in order of preference
    if (donation.donatedOn) {
      return donation.donatedOn;
    } else if (donation.timestamp) {
      // Handle timestamp as string or Date object
      if (donation.timestamp instanceof Date) {
        return donation.timestamp.toISOString().split("T")[0];
      } else if (typeof donation.timestamp === "string") {
        // Try to parse as ISO date first
        try {
          return donation.timestamp.includes("T")
            ? donation.timestamp.split("T")[0]
            : donation.timestamp;
        } catch (e) {
          // If not ISO format, might be a locale string or other format
          try {
            return new Date(donation.timestamp).toISOString().split("T")[0];
          } catch (e2) {
            console.warn("Could not parse timestamp:", donation.timestamp);
            return new Date().toISOString().split("T")[0];
          }
        }
      }
    } else if (donation.createdAt) {
      // Handle createdAt field if it exists
      if (donation.createdAt instanceof Date) {
        return donation.createdAt.toISOString().split("T")[0];
      } else if (typeof donation.createdAt === "string") {
        try {
          return donation.createdAt.includes("T")
            ? donation.createdAt.split("T")[0]
            : donation.createdAt;
        } catch (e) {
          return new Date(donation.createdAt).toISOString().split("T")[0];
        }
      }
    }

    // If no date field found, use current date
    console.warn("No date field found for donation:", donation.id);
    return new Date().toISOString().split("T")[0];
  };

  // Add online donation handler
  const addOnlineDonationHandler = async (e) => {
    e.preventDefault();
    if (
      !newAmount ||
      !newDonorName ||
      !newDonorEmail ||
      !newDonorPhone ||
      !newDonatedOn ||
      !newTransactionId
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
        amount: newAmount,
        donorName: newDonorName,
        donorEmail: newDonorEmail,
        donorPhone: newDonorPhone,
        donationApprovalId,
        donatedOn: newDonatedOn,
        transactionId: newTransactionId,
        paymentMethod: newPaymentMethod,
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
        amount: newAmount,
        name: newDonorName,
        email: newDonorEmail,
        phone: newDonorPhone,
        donatedOn: newDonatedOn,
        transactionId: newTransactionId,
        paymentMethod: newPaymentMethod,
        wantsCertificate,
        timestamp: new Date().toISOString(),
        donationApprovalId,
      });

      // Send email notification
      await fetch("/api/donation-approval", {
        method: "POST",
        body: JSON.stringify({
          amount: newAmount,
          donorName: newDonorName,
          donorEmail: newDonorEmail,
          donorPhone: newDonorPhone,
          donatedOn: newDonatedOn,
          transactionId: newTransactionId,
          paymentMethod: newPaymentMethod,
          wantsCertificate,
          donationApprovalId,
          donationApprovalLink: `${window.location.origin}/donation-approvals/${donationApprovalId}`,
          ngoName,
        }),
      });

      // Reset form
      setNewAmount("");
      setNewDonorName("");
      setNewDonorEmail("");
      setNewDonorPhone("");
      setNewDonatedOn("");
      setNewTransactionId("");
      setNewPaymentMethod("UPI");
      setWantsCertificate(false);
      setAddDonationOpen(false);

      toast.success("Online donation added successfully", { id: toasting });
    } catch (error) {
      console.error("Error adding online donation:", error);
      toast.error("Error adding online donation", { id: toasting });
    }
  };

  const handleViewTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setViewOpen(true);
  };

  const handleEditDonation = (donation) => {
    setSelectedDonation(donation);
    setDonorName(donation.donor);
    setDonorPhone(donation.phone);
    setAmount(donation.amount.replace("₹", "").replace(",", ""));
    setTransactionId(donation.transactionId);
    setPaymentMethod(donation.paymentMethod);
    setDonationDate(donation.date);
    setEditModalOpen(true);
  };

  const handleDeleteDonation = async (donation) => {
    if (window.confirm("Are you sure you want to delete this donation?")) {
      try {
        await deleteDoc(donation.docRef);
        toast.success("Donation deleted successfully");
      } catch (error) {
        console.error("Error deleting donation:", error);
        toast.error("Error deleting donation");
      }
    }
  };

  const handleSaveEdit = async () => {
    try {
      await updateDoc(selectedDonation.docRef, {
        name: donorName,
        phone: donorPhone,
        amount: amount,
        transactionId: transactionId,
        paymentMethod: paymentMethod,
        donatedOn: donationDate,
      });

      setEditModalOpen(false);
      toast.success("Donation updated successfully");
    } catch (error) {
      console.error("Error updating donation:", error);
      toast.error("Error updating donation");
    }
  };

  const renderDonationTable = (donations) => {
    if (donations.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No donations found.
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Donor</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Transaction ID</TableHead>
            <TableHead>Payment Method</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {donations.map((donation) => (
            <TableRow key={donation.id}>
              <TableCell>{donation.donor}</TableCell>
              <TableCell>{donation.amount}</TableCell>
              <TableCell>{donation.date}</TableCell>
              <TableCell>{donation.transactionId}</TableCell>
              <TableCell>{donation.paymentMethod}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleViewTransaction(donation)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditDonation(donation)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteDonation(donation)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <div className="flex flex-row justify-between items-center">
            <div>
              <CardTitle>Online Donations</CardTitle>
              <CardDescription>
                Manage online donations received through UPI, bank transfers,
                and other digital payment methods.
              </CardDescription>
            </div>
            {/* <Button onClick={() => setAddDonationOpen(true)}>
              Add Online Donation
            </Button> */}
          </div>
          <div className="flex justify-between items-center mt-4">
            <Input
              placeholder="Search donations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            {/* {activeTab === "completed" && (
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            )} */}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>
            <TabsContent value="completed">
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                renderDonationTable(filteredCompletedDonations)
              )}
            </TabsContent>
            <TabsContent value="pending">
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                renderDonationTable(filteredPendingDonations)
              )}
            </TabsContent>
            <TabsContent value="rejected">
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                renderDonationTable(filteredRejectedDonations)
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* View Transaction Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="font-medium">Donor:</div>
                <div>{selectedTransaction.donor}</div>
                <div className="font-medium">Amount:</div>
                <div>{selectedTransaction.amount}</div>
                <div className="font-medium">Date:</div>
                <div>{selectedTransaction.date}</div>
                <div className="font-medium">Email:</div>
                <div>{selectedTransaction.email}</div>
                <div className="font-medium">Phone:</div>
                <div>{selectedTransaction.phone}</div>
                <div className="font-medium">Transaction ID:</div>
                <div>{selectedTransaction.transactionId}</div>
                <div className="font-medium">Payment Method:</div>
                <div>{selectedTransaction.paymentMethod}</div>
                <div className="font-medium">Status:</div>
                <div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      selectedTransaction.status === "Completed"
                        ? "bg-green-100 text-green-800"
                        : selectedTransaction.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : selectedTransaction.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {selectedTransaction.status.charAt(0).toUpperCase() +
                      selectedTransaction.status.slice(1)}
                  </span>
                </div>
                {selectedTransaction.reason && (
                  <>
                    <div className="font-medium">Rejection Reason:</div>
                    <div>{selectedTransaction.reason}</div>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Donation Dialog */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Donation</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Donor Name</Label>
              <Input
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Phone</Label>
              <Input
                value={donorPhone}
                onChange={(e) => setDonorPhone(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Amount</Label>
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Donation Date</Label>
              <Input
                type="date"
                value={donationDate}
                onChange={(e) => setDonationDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Transaction ID</Label>
              <Input
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
                <option value="Online">Online</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Online Donation Dialog */}
      <Dialog open={addDonationOpen} onOpenChange={setAddDonationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Online Donation</DialogTitle>
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
                value={newDonatedOn}
                onChange={(e) => setNewDonatedOn(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Transaction ID</Label>
              <Input
                type="text"
                value={newTransactionId}
                onChange={(e) => setNewTransactionId(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Payment Method</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={newPaymentMethod}
                onChange={(e) => setNewPaymentMethod(e.target.value)}
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
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddDonationOpen(false)}
              >
                Cancel
              </Button>
              <Button type="button" onClick={addOnlineDonationHandler}>
                Add Donation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default OnlineDonationTable;
