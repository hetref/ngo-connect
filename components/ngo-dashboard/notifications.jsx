"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, AlertCircle } from "lucide-react"
import { motion } from "framer-motion"

const notifications = [
  { message: "New volunteer application received", type: "info" },
  { message: "Sponsorship request pending approval", type: "warning" },
  { message: 'Event "Beach Cleanup" is tomorrow', type: "info" },
]

export function Notifications() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bell className="mr-2 h-5 w-5" />
          Notifications
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {notifications.map((notification, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex items-start space-x-2"
            >
              <AlertCircle
                className={`h-5 w-5 ${notification.type === "warning" ? "text-yellow-500" : "text-blue-500"}`}
              />
              <p className="text-sm">{notification.message}</p>
            </motion.li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

