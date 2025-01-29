import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const events = [
  { name: "Beach Cleanup", date: "2023-08-15", volunteers: 45, donors: 12, status: "Upcoming" },
  { name: "Food Drive", date: "2023-08-20", volunteers: 30, donors: 8, status: "Upcoming" },
  { name: "Tree Planting", date: "2023-08-10", volunteers: 60, donors: 15, status: "Completed", successRate: "95%" },
]

export function EventInsights() {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Event Insights</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {events.map((event, index) => (
            <li key={index} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{event.name}</p>
                <p className="text-sm text-muted-foreground">{event.date}</p>
              </div>
              <div className="text-right">
                <p className="text-sm">
                  {event.volunteers} volunteers, {event.donors} donors
                </p>
                <Badge variant={event.status === "Upcoming" ? "outline" : "default"}>{event.status}</Badge>
                {event.successRate && <p className="text-sm text-green-600">Success rate: {event.successRate}</p>}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

