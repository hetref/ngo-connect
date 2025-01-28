import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Users, Calendar, Award } from "lucide-react"

const metrics = [
  { title: "Total Donations", value: "$125,000", icon: DollarSign },
  { title: "Total Volunteers", value: "1,234", icon: Users },
  { title: "Total Events", value: "56", icon: Calendar },
  { title: "Active Sponsorships", value: "12", icon: Award },
]

export function MetricsOverview() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Metrics Overview</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => (
          <div key={index} className="flex items-center space-x-4">
            <div className="rounded-full bg-[#1CAC78] p-2 text-white">
              <metric.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
              <p className="text-2xl font-bold">{metric.value}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

