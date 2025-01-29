import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"

export function VolunteerActivities() {
  const upcomingEvents = [
    { id: 1, date: "2023-08-15", ngo: "Green Earth", role: "Tree Planter" },
    { id: 2, date: "2023-08-20", ngo: "Food for All", role: "Food Distributor" },
  ]

  const pastEvents = [
    { id: 3, date: "2023-07-10", ngo: "Beach Cleanup", role: "Volunteer", status: "Completed" },
    { id: 4, date: "2023-06-25", ngo: "Animal Shelter", role: "Caretaker", status: "Completed" },
  ]

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Volunteer Activities</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="overflow-x-auto">
          <h3 className="text-lg font-semibold mb-2">Upcoming Events</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Date</TableHead>
                <TableHead>NGO</TableHead>
                <TableHead className="hidden sm:table-cell">Role</TableHead>
                <TableHead className="w-[60px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcomingEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">{event.date}</TableCell>
                  <TableCell>{event.ngo}</TableCell>
                  <TableCell className="hidden sm:table-cell">{event.role}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Cancel Participation</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="overflow-x-auto">
          <h3 className="text-lg font-semibold mb-2">Past Events</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Date</TableHead>
                <TableHead>NGO</TableHead>
                <TableHead className="hidden sm:table-cell">Role</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="w-[60px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pastEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">{event.date}</TableCell>
                  <TableCell>{event.ngo}</TableCell>
                  <TableCell className="hidden sm:table-cell">{event.role}</TableCell>
                  <TableCell className="hidden sm:table-cell">{event.status}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Download Letter</DropdownMenuItem>
                        <DropdownMenuItem>View Impact</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <Button className="w-full bg-[#1CAC78] hover:bg-[#158f63]">Browse New Events</Button>
      </CardContent>
    </Card>
  )
}

