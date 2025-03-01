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
import { onSnapshot, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";


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
    setEditModalOpen(true);
  };

  const handleSave = () => {
    console.log("DONATION", selectedDonation);
    const donationRef = doc(
      collection(db, "donationApprovals"),
      selectedDonation.id
    );
    updateDoc(donationRef, {
      donorName: selectedDonation.donorName,
      donorPhone: selectedDonation.donorPhone,
      amount: selectedDonation.amount,
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
          {/* <DialogBody> */}
          <div>
            <label>Donor Name</label>
            <input
              type="text"
              value={selectedDonation?.donorName}
              onChange={(e) => setDonorName(e.target.value)}
              disabled={selectedDonation?.status !== "rejected"} // Disable if not rejected
            />
          </div>
          <div>
            <label>Donor Phone</label>
            <input
              type="text"
              value={selectedDonation?.donorPhone}
              onChange={(e) => setDonorPhone(e.target.value)}
              disabled={selectedDonation?.status !== "rejected"} // Disable if not rejected
            />
          </div>
          <div>
            <label>Amount</label>
            <input
              type="number"
              value={selectedDonation?.amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={selectedDonation?.status !== "rejected"} // Disable if not rejected
            />
          </div>
          {selectedDonation?.status === "rejected" && (
            <div>
              <label>Reason for Rejection</label>
              <textarea
                value={selectedDonation?.reason}
                readOnly // Make it read-only if you don't want to allow editing
              />
            </div>
          )}
          <Button onClick={handleSave}>Save</Button>
          <Button onClick={() => setEditModalOpen(false)}>Cancel</Button>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
