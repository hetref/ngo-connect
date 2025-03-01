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
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

export function ResDonationTable() {
  // Get user and NGO information from auth context
  const { user, profile } = useAuth();
  const ngoId = profile?.ngoId || null;
  const userId = user?.uid || null;

  const [searchTerm, setSearchTerm] = useState("");
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [donations, setDonations] = useState([]);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form states for edit functionality
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [resource, setResource] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");

  // For new donation form
  const [newDonation, setNewDonation] = useState({
    donorName: "",
    donorEmail: "",
    donorPhone: "",
    resource: "",
    quantity: "",
    status: "pending",
  });

  const [unsubscribers, setUnsubscribers] = useState([]);

  useEffect(() => {
    if (!ngoId) {
      console.log("Missing ngoId:", { ngoId });
      setLoading(false);
      setError("NGO information not available");
      return;
    }

    setLoading(true);
    const currentYear = new Date().getFullYear().toString();

    console.log("Starting to fetch donations for NGO:", {
      ngoId,
      year: currentYear,
    });

    // Create reference to the year collection
    const yearPath = `donations/${ngoId}/${currentYear}`;
    console.log("Year collection path:", yearPath);

    try {
      // Get the year collection
      const yearRef = collection(db, yearPath);

      // Clear previous listeners
      unsubscribers.forEach((unsub) => unsub());
      setUnsubscribers([]);

      const yearUnsubscribe = onSnapshot(yearRef, (yearSnapshot) => {
        const newUnsubscribers = [];
        const allDonations = [];

        // Add this line to handle initial empty state
        setLoading(true);

        yearSnapshot.docs.forEach((userDoc) => {
          const userId = userDoc.id;
          console.log("Processing user:", userId);

          try {
            // Get the resources subcollection for this user
            const resourcesRef = collection(
              db,
              `${yearPath}/${userId}/resources`
            );

            const resourceUnsubscribe = onSnapshot(
              resourcesRef,
              (resourcesSnap) => {
                // Add this check to handle empty resources
                if (resourcesSnap.empty) {
                  setLoading(false);
                  return;
                }

                resourcesSnap.docChanges().forEach((change) => {
                  if (change.type === "added" || change.type === "modified") {
                    const donation = {
                      id: change.doc.id,
                      userId,
                      ...change.doc.data(),
                    };

                    setDonations((prev) => [
                      ...prev.filter((d) => d.id !== donation.id),
                      donation,
                    ]);
                    console.log("DONATIONS", donations);
                  }
                  if (change.type === "removed") {
                    setDonations((prev) =>
                      prev.filter((d) => d.id !== change.doc.id)
                    );
                  }
                });
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
          setDonations([]);
          setLoading(false);
        } else {
          setUnsubscribers((prev) => [...prev, ...newUnsubscribers]);
          setLoading(false); // Add this line to ensure loading state is cleared
        }
      });

      // Add year collection listener to unsubscribers
      setUnsubscribers((prev) => [...prev, yearUnsubscribe]);

      return () => {
        console.log("Cleaning up year collection listener");
        unsubscribers.forEach((unsub) => unsub());
      };
    } catch (err) {
      console.error("Error setting up year collection listener:", err);
      setError("Failed to set up data listener: " + err.message);
      setLoading(false);
    }
  }, [ngoId]);

  const openViewModal = (transaction) => {
    setSelectedTransaction(transaction);
    setViewOpen(true);
  };

  const openEditModal = (donation) => {
    console.log("DONATION", donation);
    setSelectedDonation(donation);
    // Initialize form values with selected donation data
    setDonorName(donation.donorName || "");
    setDonorPhone(donation.donorPhone || "");
    setDonorEmail(donation.donorEmail || "");
    setResource(donation.resource || "");
    setQuantity(donation.quantity || "");
    setReason(donation.reason || "");
    setEditModalOpen(true);
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

  const handleSave = async () => {
    if (!ngoId || !selectedDonation?.userId || !selectedDonation?.id) {
      console.error("Missing required IDs for update", {
        ngoId,
        donationId: selectedDonation?.id,
      });
      setError("Missing required information to update donation");
      return;
    }

    try {
      const currentYear = new Date().getFullYear().toString();

      // Create updated donation object
      const updatedDonation = {
        donorName,
        donorPhone,
        donorEmail,
        resource,
        quantity,
        status: "pending",
        reason: null,
        updatedAt: serverTimestamp(),
      };

      console.log("Saving updated donation:", updatedDonation);

      // Update Firestore document using the correct path
      const donationRef = doc(
        db,
        `donations/${ngoId}/${currentYear}/${selectedDonation.userId}/resources`,
        selectedDonation.id
      );

      await updateDoc(donationRef, updatedDonation);

      // Close modal after successful update
      setEditModalOpen(false);
    } catch (error) {
      console.error("Error updating document: ", error);
      setError("Failed to update donation: " + error.message);
    }
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
      };

      console.log("Adding new donation:", donationWithTimestamp);

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

      console.log("Successfully added new donation");

      // Close modal after successful addition
      setAddModalOpen(false);
    } catch (error) {
      console.error("Error adding document: ", error);
      setError("Failed to add donation: " + error.message);
    }
  };

  const handleNewDonationChange = (e) => {
    const { name, value } = e.target;
    setNewDonation((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Resource Donations</CardTitle>
          <CardDescription>View all resource donations here.</CardDescription>
        </div>
        <Button onClick={openAddModal} className="ml-auto" disabled={!ngoId}>
          <Plus className="mr-2 h-4 w-4" /> Add Donation
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

        <Input
          placeholder="Search resource donations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

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
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-4 text-muted-foreground"
                >
                  Loading donations...
                </TableCell>
              </TableRow>
            ) : donations && donations.length > 0 ? (
              donations
                .filter(
                  (transaction) =>
                    (transaction?.donorName || "")
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase()) ||
                    (transaction?.donorEmail || "")
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase()) ||
                    (transaction?.resource || "")
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase()) ||
                    String(transaction?.quantity || "").includes(searchTerm)
                )
                .map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{transaction?.donorName}</TableCell>
                    <TableCell>{transaction?.donorEmail}</TableCell>
                    <TableCell>{transaction?.resource}</TableCell>
                    <TableCell>{transaction?.quantity}</TableCell>
                    <TableCell>{transaction?.date}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          transaction.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : transaction.status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {transaction?.status || "pending"}
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
                      </div>
                    </TableCell>
                  </TableRow>
                ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-4 text-muted-foreground"
                >
                  {!ngoId
                    ? "NGO ID not available. Please make sure you're logged in."
                    : "No resource donations found. Add a donation to get started."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
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
                  <p className="mt-1">{selectedTransaction?.donorName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="mt-1">{selectedTransaction?.donorEmail}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <p className="mt-1">{selectedTransaction?.donorPhone}</p>
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
                {selectedTransaction?.status === "rejected" && (
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
                disabled={selectedDonation?.status !== "rejected"}
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
                disabled={selectedDonation?.status !== "rejected"}
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
                disabled={selectedDonation?.status !== "rejected"}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="resource" className="text-right">
                Resource
              </Label>
              <Input
                id="resource"
                value={resource}
                onChange={(e) => setResource(e.target.value)}
                disabled={selectedDonation?.status !== "rejected"}
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
                disabled={selectedDonation?.status !== "rejected"}
                className="col-span-3"
              />
            </div>
            {selectedDonation?.status === "rejected" && (
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
              disabled={selectedDonation?.status !== "rejected"}
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
    </Card>
  );
}
