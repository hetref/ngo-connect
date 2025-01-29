import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function SuggestedOpportunities() {
  const recommendations = [
    { type: "event", name: "Beach Cleanup Drive", ngo: "Ocean Guardians" },
    { type: "ngo", name: "Education for All", cause: "Child Education" },
    { type: "urgent", name: "Flood Relief Campaign", ngo: "Disaster Response Team" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Suggested Opportunities</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {recommendations.map((rec, index) => (
            <div key={index} className="p-4 border rounded-lg hover:bg-secondary">
              <h3 className="font-semibold mb-2">
                {rec.type === "event" && "Recommended Event"}
                {rec.type === "ngo" && "Suggested NGO"}
                {rec.type === "urgent" && "Urgent Cause"}
              </h3>
              <p>{rec.name}</p>
              <p className="text-sm text-muted-foreground">{rec.ngo || rec.cause}</p>
            </div>
          ))}
        </div>
        <Button className="w-full bg-[#1CAC78] hover:bg-[#158f63]">Explore More NGOs & Events</Button>
      </CardContent>
    </Card>
  )
}

