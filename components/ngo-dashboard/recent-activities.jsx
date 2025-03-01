import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const activities = [
  { type: "donation", name: "John Doe", amount: "$100", date: "2h ago" },
  { type: "volunteer", name: "Jane Smith", action: "registered", date: "4h ago" },
  { type: "feedback", name: "Mike Johnson", event: "Beach Cleanup", date: "1d ago" },
]

export function RecentActivities() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activities</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {activities.map((activity, index) => (
            <li key={index} className="flex items-center space-x-4">
              <Avatar>
                <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${activity.name}`} />
                <AvatarFallback>
                  {activity.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{activity.name}</p>
                <p className="text-xs text-muted-foreground">
                  {activity.type === "donation" && `Donated ${activity.amount}`}
                  {activity.type === "volunteer" && `${activity.action} as volunteer`}
                  {activity.type === "feedback" && `Gave feedback for ${activity.event}`}
                </p>
                <p className="text-xs text-muted-foreground">{activity.date}</p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

