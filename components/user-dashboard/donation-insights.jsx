import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const donationData = [
  { month: "Jan", amount: 1000 },
  { month: "Feb", amount: 1500 },
  { month: "Mar", amount: 1200 },
  { month: "Apr", amount: 1800 },
  { month: "May", amount: 2000 },
  { month: "Jun", amount: 1700 },
]

const recentDonations = [
  { id: 1, amount: 500, ngo: "Green Earth", date: "2023-07-15", status: "Completed" },
  { id: 2, amount: 1000, ngo: "Food for All", date: "2023-07-01", status: "Completed" },
]

const sponsorships = [
  { id: 1, event: "Annual Fundraiser", ngo: "Education for All", amount: 5000 },
  { id: 2, event: "Marathon for Health", ngo: "Health First", amount: 3000 },
]

export function DonationInsights() {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Donation Insights</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="overflow-x-auto">
          <h3 className="text-lg font-semibold mb-2">Recent Donations</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Amount</TableHead>
                <TableHead>NGO</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="w-[60px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentDonations.map((donation) => (
                <TableRow key={donation.id}>
                  <TableCell>₹{donation.amount}</TableCell>
                  <TableCell>{donation.ngo}</TableCell>
                  <TableCell className="hidden sm:table-cell">{donation.date}</TableCell>
                  <TableCell className="hidden sm:table-cell">{donation.status}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Receipt</DropdownMenuItem>
                        <DropdownMenuItem>Download Tax Receipt</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Donation Trend</h3>
          <div className="h-[200px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={donationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="amount" stroke="#1CAC78" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="overflow-x-auto">
          <h3 className="text-lg font-semibold mb-2">Sponsorship Contributions</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>NGO</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sponsorships.map((sponsorship) => (
                <TableRow key={sponsorship.id}>
                  <TableCell>{sponsorship.event}</TableCell>
                  <TableCell>{sponsorship.ngo}</TableCell>
                  <TableCell>₹{sponsorship.amount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <Button className="w-full bg-[#1CAC78] hover:bg-[#158f63]">Find Causes to Support</Button>
      </CardContent>
    </Card>
  )
}

