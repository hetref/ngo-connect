"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// Sample payout data
const initialPayouts = [
  { 
    id: 1, 
    date: "2024-02-20", 
    amount: "$1,000.00", 
    status: "Approved",
    description: "Monthly operational expenses",
    proofUrl: "expense-proof-1.pdf"
  },
  { 
    id: 2, 
    date: "2024-02-15", 
    amount: "$750.00", 
    status: "Pending",
    description: "Community event funding",
    proofUrl: "expense-proof-2.pdf"
  },
  { 
    id: 3, 
    date: "2024-02-10", 
    amount: "$500.00", 
    status: "Completed",
    description: "Project supplies",
    proofUrl: "expense-proof-3.pdf"
  },
]

export function PayoutManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [viewOpen, setViewOpen] = useState(false)
  const [selectedPayout, setSelectedPayout] = useState(null)
  const [addPayoutOpen, setAddPayoutOpen] = useState(false)

  const filteredPayouts = initialPayouts.filter(
    (payout) =>
      payout.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payout.amount.includes(searchTerm) ||
      payout.status.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const openViewModal = (payout) => {
    setSelectedPayout(payout)
    setViewOpen(true)
  }

  const deletePayout = (id) => {
    // Add your delete logic here
    console.log("Deleting payout:", id)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Payouts</CardTitle>
            <CardDescription>Manage your payout requests here.</CardDescription>
          </div>
          <Button 
            className="bg-[#1CAC78] hover:bg-[#158f63]"
            onClick={() => setAddPayoutOpen(true)}
          >
            Request Payout
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input 
          placeholder="Search payouts..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
        />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayouts.map((payout) => (
              <TableRow key={payout.id}>
                <TableCell>{payout.date}</TableCell>
                <TableCell>{payout.amount}</TableCell>
                <TableCell>{payout.description}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    payout.status === "Completed" 
                      ? "bg-green-100 text-green-800"
                      : payout.status === "Approved"
                      ? "bg-blue-100 text-blue-800" 
                      : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {payout.status}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openViewModal(payout)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => deletePayout(payout.id)}
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

      {/* View Payout Modal */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Payout Details</DialogTitle>
          </DialogHeader>
          {selectedPayout && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Date</p>
                  <p className="mt-1">{selectedPayout.date}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Amount</p>
                  <p className="mt-1">{selectedPayout.amount}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-500">Description</p>
                  <p className="mt-1">{selectedPayout.description}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <p className="mt-1">{selectedPayout.status}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Proof</p>
                  <a 
                    href={selectedPayout.proofUrl} 
                    className="mt-1 text-[#1CAC78] hover:underline"
                  >
                    View Document
                  </a>
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

      {/* Add Payout Modal */}
      <Dialog open={addPayoutOpen} onOpenChange={setAddPayoutOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Request New Payout</DialogTitle>
          </DialogHeader>
          <form className="space-y-4">
            <div>
              <label className="text-sm font-medium">Amount</label>
              <Input type="number" placeholder="Enter amount" />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input placeholder="Enter description" />
            </div>
            <div>
              <label className="text-sm font-medium">Proof Document</label>
              <Input type="file" />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setAddPayoutOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-[#1CAC78] hover:bg-[#158f63]"
              >
                Submit Request
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

