"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// Sample transaction data with timestamps
const initialTransactions = [
  { 
    id: 1, 
    name: "John Doe", 
    type: "Donation",
    amount: "$100.00",
    timestamp: "2024-02-20T14:30:00Z",
    email: "john@example.com",
    status: "Completed"
  },
  { 
    id: 2, 
    name: "NGO Operational Expenses", 
    type: "Payout",
    amount: "$250.00",
    timestamp: "2024-02-20T16:45:00Z",
    description: "Monthly operational costs",
    status: "Completed"
  },
  { 
    id: 3, 
    name: "Alice Johnson", 
    type: "Donation",
    amount: "$500.00",
    timestamp: "2024-02-19T09:15:00Z",
    email: "alice@example.com",
    status: "Pending"
  },
]

export function DonationsTransactions() {
  const [searchTerm, setSearchTerm] = useState("")
  const [viewOpen, setViewOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState(null)

  // Sort transactions by timestamp (latest first)
  const sortedTransactions = [...initialTransactions].sort((a, b) => 
    new Date(b.timestamp) - new Date(a.timestamp)
  )

  const filteredTransactions = sortedTransactions.filter(
    (transaction) =>
      transaction.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const openViewModal = (transaction) => {
    setSelectedTransaction(transaction)
    setViewOpen(true)
  }

  const deleteTransaction = (id) => {
    // Add your delete logic here
    console.log("Deleting transaction:", id)
  }

  // Format timestamp to local date and time
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transactions</CardTitle>
        <CardDescription>View all donations and payouts here.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input 
          placeholder="Search transactions..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
        />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="font-medium">{transaction.name}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    transaction.type === "Donation" 
                      ? "bg-green-100 text-green-800" 
                      : "bg-blue-100 text-blue-800"
                  }`}>
                    {transaction.type}
                  </span>
                </TableCell>
                <TableCell>{formatTimestamp(transaction.timestamp)}</TableCell>
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
                  <p className="text-sm font-medium text-gray-500">Name</p>
                  <p className="mt-1">{selectedTransaction.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Type</p>
                  <p className="mt-1">{selectedTransaction.type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Amount</p>
                  <p className="mt-1">{selectedTransaction.amount}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <p className="mt-1">{selectedTransaction.status}</p>
                </div>
                {selectedTransaction.type === "Donation" ? (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="mt-1">{selectedTransaction.email}</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Description</p>
                    <p className="mt-1">{selectedTransaction.description}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-500">Timestamp</p>
                  <p className="mt-1">{formatTimestamp(selectedTransaction.timestamp)}</p>
                </div>
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
  )
}

