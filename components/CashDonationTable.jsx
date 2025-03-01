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
import { onSnapshot, collection, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Sample transaction data
const initialTransactions = [
  {
    id: 1,
    donor: "John Doe",
    amount: "$100.00",
    date: "2024-02-20",
    status: "Completed",
    email: "john@example.com",
  },
  {
    id: 2,
    donor: "Jane Smith",
    amount: "$250.00",
    date: "2024-02-19",
    status: "Completed",
    email: "jane@example.com",
  },
  {
    id: 3,
    donor: "Alice Johnson",
    amount: "$500.00",
    date: "2024-02-18",
    status: "Pending",
    email: "alice@example.com",
  },
];

export function CashDonationTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [donations, setDonations] = useState([]);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [donorName, setDonorName] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const filteredTransactions = initialTransactions.filter(
    (transaction) =>
      transaction.donor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.amount.includes(searchTerm) ||
      transaction.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "donationApprovals"),
      (snapshot) => {
        const donationsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setDonations(donationsData);
        console.log("DONATIONDATA", donationsData);
      }
    );

    return () => unsubscribe();
  }, []);

  const openViewModal = (transaction) => {
    setSelectedTransaction(transaction);
    setViewOpen(true);
  };

  const openEditModal = (donation) => {
    console.log("DONATION", donation);
    setSelectedDonation(donation);
    setDonorName(donation.donorName);
    setDonorPhone(donation.donorPhone);
    setAmount(donation.amount);
    setReason(donation.reason || "");
    setEditModalOpen(true);
  };

  const handleSave = () => {
    const donationRef = doc(db, "donationApprovals", selectedDonation.id);
    updateDoc(donationRef, {
      donorName: donorName,
      donorPhone: donorPhone,
      amount: amount,
      status: "pending",
      reason: null,
    });
    setEditModalOpen(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Donors</CardTitle>
        <CardDescription>View all donors here.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Search donors..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

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
            {donations &&
              donations.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{transaction?.donorName}</TableCell>
                  <TableCell>{transaction?.donorEmail}</TableCell>
                  <TableCell>{transaction?.amount}</TableCell>
                  <TableCell>{transaction?.date}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        transaction.status === "Completed"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {transaction?.status}
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
              ))}
          </TableBody>
        </Table>
      </CardContent>

      {/* View Transaction Modal */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
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
                  <p className="text-sm font-medium text-gray-500">Amount</p>
                  <p className="mt-1">{selectedTransaction?.amount}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Date</p>
                  <p className="mt-1">{selectedTransaction?.date}</p>
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
          <DialogHeader>Edit Donation</DialogHeader>
          <div className="space-y-4">
            <div>
              <label>Donor Name</label>
              <Input
                type="text"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                disabled={selectedDonation?.status !== "rejected"}
              />
            </div>
            <div>
              <label>Donor Phone</label>
              <Input
                type="text"
                value={donorPhone}
                onChange={(e) => setDonorPhone(e.target.value)}
                disabled={selectedDonation?.status !== "rejected"}
              />
            </div>
            <div>
              <label>Amount</label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={selectedDonation?.status !== "rejected"}
              />
            </div>
            {selectedDonation?.status === "rejected" && (
              <div>
                <label>Reason for Rejection</label>
                <Input
                  as="textarea"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  readOnly
                />
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <Button onClick={() => setEditModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
