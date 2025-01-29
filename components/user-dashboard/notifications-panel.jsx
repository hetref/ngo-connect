import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function NotificationsPanel() {
  const notifications = [
    { icon: "🏅", message: "You earned a new badge: 'Community Hero'!" },
    { icon: "📩", message: "XYZ NGO sent you a thank-you message for your donation!" },
    { icon: "⏳", message: "Your sponsorship request is under review." },
    { icon: "📢", message: "New event near you: Beach Cleanup on Aug 15!" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {notifications.map((notification, index) => (
          <div key={index} className="flex items-start space-x-2 p-2 rounded-lg hover:bg-secondary">
            <span className="text-2xl flex-shrink-0">{notification.icon}</span>
            <p className="text-sm">{notification.message}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

