import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const sponsorships = [
  { name: "Local Business Co.", amount: "$5,000", status: "Pending" },
  { name: "Community Bank", amount: "$10,000", status: "Approved" },
  { name: "Tech Startup Inc.", amount: "$7,500", status: "Pending" },
]

export function SponsorshipOverview() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sponsorship Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {sponsorships.map((sponsorship, index) => (
            <li key={index} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{sponsorship.name}</p>
                <p className="text-sm text-muted-foreground">{sponsorship.amount}</p>
              </div>
              <Badge variant={sponsorship.status === "Approved" ? "default" : "secondary"}>{sponsorship.status}</Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

