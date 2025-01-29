import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function CallToActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <Button className="w-full bg-[#1CAC78] hover:bg-[#158f63]">Volunteer for an Event</Button>
        <Button className="w-full bg-[#1CAC78] hover:bg-[#158f63]">Donate to a Cause</Button>
        <Button className="w-full bg-[#1CAC78] hover:bg-[#158f63] sm:col-span-2 lg:col-span-1">View My Impact</Button>
      </CardContent>
    </Card>
  )
}

