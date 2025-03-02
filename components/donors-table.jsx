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
import { Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { collectionGroup, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function DonorsTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [allDonations, setAllDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

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
        setupRealtimeListeners(userDataFromFirestore);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Get current year
  const setupRealtimeListeners = async (userDataFromFirestore) => {
    const currentYear = new Date().getFullYear().toString();
    const unsubscribes = [];

    try {
      setLoading(true);

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

      console.log(
        "Setting up real-time listeners for all donations for NGO:",
        ngoId
      );

      // Define donation types to listen for
      const donationTypes = ["cash", "crypto", "resources", "online"];
      let allDonationsData = [];

      // Set up listeners for each donation type
      donationTypes.forEach((type) => {
        const unsubscribe = onSnapshot(
          collectionGroup(db, type),
          (snapshot) => {
            let typeDonations = [];

            snapshot.forEach((doc) => {
              // Only include donations that belong to this NGO and year
              const path = doc.ref.path;
              if (path.includes(`donations/${ngoId}/${currentYear}`)) {
                typeDonations.push({
                  id: doc.id,
                  ...doc.data(),
                  donationType: type.charAt(0).toUpperCase() + type.slice(1), // Capitalize first letter
                });
              }
            });

            console.log(`Real-time ${type} Donations Data:`, typeDonations);

            // Update all donations with this type's donations
            allDonationsData = [
              ...allDonationsData.filter(
                (d) =>
                  d.donationType !==
                  type.charAt(0).toUpperCase() + type.slice(1)
              ),
              ...typeDonations,
            ];

            // Format and update state
            updateDonationsState(allDonationsData);
          },
          (error) => {
            console.error(`Error in ${type} real-time listener:`, error);
          }
        );

        unsubscribes.push(unsubscribe);
      });
    } catch (error) {
      console.error("Error setting up real-time listeners:", error);
      setLoading(false);
    }

    // Clean up the listeners when the component unmounts
    return () => {
      unsubscribes.forEach((unsubscribe) => {
        if (unsubscribe) {
          console.log("Unsubscribing from real-time listener");
          unsubscribe();
        }
      });
    };
  };

  const updateDonationsState = (donationsData) => {
    // Format the data to match the expected structure
    const formattedDonations = donationsData.map((donation) => {
      // Extract timestamp for sorting
      const timestamp = donation.timestamp
        ? new Date(donation.timestamp).getTime()
        : donation.donatedOn
          ? new Date(donation.donatedOn).getTime()
          : 0;

      // Determine the status of the donation
      const status = donation.status || "Completed"; // Default to "Completed" if not specified

      // Format amount based on donation type
      let formattedAmount = "N/A";
      if (donation.donationType === "Resources") {
        // For resources, show item name and quantity if available
        const itemName = donation.itemName || donation.item || "";
        const quantity = donation.quantity || "";
        formattedAmount = itemName
          ? quantity
            ? `${quantity} ${itemName}`
            : itemName
          : "N/A";
      } else if (donation.amount) {
        // For monetary donations
        formattedAmount = `₹${Number(donation.amount).toLocaleString()}`;
      } else if (donation.donationType === "Crypto" && donation.cryptoAmount) {
        // For crypto with specific crypto amount
        const cryptoType = donation.cryptoType || "Crypto";
        formattedAmount = `${donation.cryptoAmount} ${cryptoType}`;
      }

      return {
        id: donation.id,
        donor: donation.name || donation.donorName || "Anonymous",
        amount: formattedAmount,
        date:
          donation.donationType === "Online" && donation.timestamp
            ? new Date(donation.timestamp).toLocaleString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : donation.donatedOn ||
              (donation.timestamp
                ? new Date(donation.timestamp).toISOString().split("T")[0]
                : "N/A"),
        status: status,
        email: donation.email || "N/A",
        phone: donation.phone || "N/A",
        address: donation.address || "N/A",
        type: donation.donationType || "Unknown",
        rawData: donation, // Keep the raw data for the modal view
        timestamp: timestamp, // Store timestamp for sorting
      };
    });

    // Sort donations by timestamp (newest first)
    const sortedDonations = formattedDonations.sort(
      (a, b) => b.timestamp - a.timestamp
    );

    setAllDonations(sortedDonations);
    setLoading(false);
  };

  // Calculate donation counts by status
  const donationCounts = {
    total: allDonations.length,
    completed: allDonations.filter((d) => d.status === "Completed").length,
    pending: allDonations.filter((d) => d.status === "Pending").length,
    rejected: allDonations.filter((d) => d.status === "Rejected").length,
  };

  // Calculate donation counts by type
  const donationTypeCount = {
    cash: allDonations.filter((d) => d.type === "Cash").length,
    crypto: allDonations.filter((d) => d.type === "Crypto").length,
    resources: allDonations.filter((d) => d.type === "Resources").length,
    online: allDonations.filter((d) => d.type === "Online").length,
  };

  const filteredTransactions = allDonations.filter(
    (transaction) =>
      (statusFilter === "All" || transaction.status === statusFilter) &&
      (typeFilter === "All" || transaction.type === typeFilter) &&
      (transaction.donor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (transaction.amount &&
          transaction.amount
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        transaction.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (transaction.status &&
          transaction.status.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const openViewModal = (transaction) => {
    setSelectedTransaction(transaction);
    setViewOpen(true);
  };

  const deleteTransaction = (id) => {
    console.log("Deleting transaction:", id);
    // Implement actual deletion logic here if needed
  };

  // Function to render the appropriate details in the modal based on donation type
  const renderDonationTypeSpecificDetails = (transaction) => {
    if (!transaction || !transaction.rawData) return null;

    const data = transaction.rawData;

    switch (transaction.type) {
      case "Resources":
        return (
          <>
            {data.itemName && (
              <div>
                <p className="text-sm font-medium text-gray-500">Item</p>
                <p className="mt-1">{data.itemName}</p>
              </div>
            )}
            {data.quantity && (
              <div>
                <p className="text-sm font-medium text-gray-500">Quantity</p>
                <p className="mt-1">{data.quantity}</p>
              </div>
            )}
            {data.condition && (
              <div>
                <p className="text-sm font-medium text-gray-500">Condition</p>
                <p className="mt-1">{data.condition}</p>
              </div>
            )}
          </>
        );
      case "Crypto":
        return (
          <>
            {data.cryptoType && (
              <div>
                <p className="text-sm font-medium text-gray-500">Crypto Type</p>
                <p className="mt-1">{data.cryptoType}</p>
              </div>
            )}
            {data.cryptoAmount && (
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Crypto Amount
                </p>
                <p className="mt-1">{data.cryptoAmount}</p>
              </div>
            )}
            {data.walletAddress && (
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Wallet Address
                </p>
                <p className="mt-1">{data.walletAddress}</p>
              </div>
            )}
          </>
        );
      case "Online":
        return (
          <>
            {data.paymentMethod && (
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Payment Method
                </p>
                <p className="mt-1">{data.paymentMethod}</p>
              </div>
            )}
            {data.transactionId && (
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Transaction ID
                </p>
                <p className="mt-1">{data.transactionId}</p>
              </div>
            )}
            {data.timestamp && (
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Payment Date
                </p>
                <p className="mt-1">
                  {new Date(data.timestamp).toLocaleString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            )}
            {!data.timestamp && data.donatedOn && (
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Payment Date
                </p>
                <p className="mt-1">
                  {new Date(data.donatedOn).toLocaleString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}
            {!data.timestamp && !data.donatedOn && data.paymentDate && (
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Payment Date
                </p>
                <p className="mt-1">
                  {new Date(data.paymentDate).toLocaleString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            )}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Donations</CardTitle>
        <CardDescription>
          View all donation records here (cash, crypto, resources, and online)
          sorted by most recent first, updates in real-time.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!loading && allDonations.length > 0 && (
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

        {!loading && allDonations.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-600">Cash</p>
              <p className="text-2xl font-semibold">{donationTypeCount.cash}</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="text-sm text-purple-600">Crypto</p>
              <p className="text-2xl font-semibold">
                {donationTypeCount.crypto}
              </p>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg">
              <p className="text-sm text-orange-600">Resources</p>
              <p className="text-2xl font-semibold">
                {donationTypeCount.resources}
              </p>
            </div>
            <div className="bg-emerald-50 p-3 rounded-lg">
              <p className="text-sm text-emerald-600">Online</p>
              <p className="text-2xl font-semibold">
                {donationTypeCount.online}
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Search donors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="sm:flex-1"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Statuses</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Types</SelectItem>
              <SelectItem value="Cash">Cash</SelectItem>
              <SelectItem value="Crypto">Crypto</SelectItem>
              <SelectItem value="Resources">Resources</SelectItem>
              <SelectItem value="Online">Online</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center py-4">Loading donation data...</div>
        ) : allDonations.length === 0 ? (
          <div className="text-center py-4">No donations found.</div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-4">
            No donations match your filters.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Donor</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Amount/Details</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{transaction.donor}</TableCell>
                  <TableCell>{transaction.email}</TableCell>
                  <TableCell>{transaction.amount}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        transaction.type === "Cash"
                          ? "bg-blue-100 text-blue-800"
                          : transaction.type === "Crypto"
                            ? "bg-purple-100 text-purple-800"
                            : transaction.type === "Resources"
                              ? "bg-orange-100 text-orange-800"
                              : transaction.type === "Online"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {transaction.type}
                    </span>
                  </TableCell>
                  <TableCell>{transaction.date}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        transaction.status === "Completed"
                          ? "bg-green-100 text-green-800"
                          : transaction.status === "Pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : transaction.status === "Rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                      }`}
                    >
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
                        onClick={() => deleteTransaction(transaction.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
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
                  <p className="text-sm font-medium text-gray-500">Type</p>
                  <p className="mt-1">{selectedTransaction.type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Date</p>
                  <p className="mt-1">{selectedTransaction.date}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <p className="mt-1">{selectedTransaction.status}</p>
                </div>
                {selectedTransaction.amount !== "N/A" && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      {selectedTransaction.type === "Resources"
                        ? "Details"
                        : "Amount"}
                    </p>
                    <p className="mt-1">{selectedTransaction.amount}</p>
                  </div>
                )}

                {/* Render type-specific details */}
                {renderDonationTypeSpecificDetails(selectedTransaction)}

                {selectedTransaction.phone && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                    <p className="mt-1">{selectedTransaction.phone}</p>
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
    </Card>
  );
}
