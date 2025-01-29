import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, UserCheck, DollarSign, Award } from "lucide-react"

const actions = [
  { label: "Create Event", icon: PlusCircle },
  { label: "Verify Volunteers", icon: UserCheck },
  { label: "Request Payout", icon: DollarSign },
  { label: "Add Sponsorship", icon: Award },
]

export function QuickActions() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant="outline"
            className="w-full justify-start hover:bg-[#1CAC78] hover:text-white transition-colors duration-200"
          >
            <action.icon className="mr-2 h-4 w-4" />
            {action.label}
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}

