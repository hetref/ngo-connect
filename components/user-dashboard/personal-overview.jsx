import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export function PersonalOverview() {
  const user = {
    name: "John Doe",
    avatar: "/placeholder-avatar.jpg",
    badges: ["Community Hero", "Frequent Donor"],
    membershipStatus: "Gold Member",
    stats: {
      eventsVolunteered: 12,
      totalDonations: 25000,
      badgesEarned: 5,
      upcomingEvents: 2,
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl">
          Hello, {user.name}! Here's your impact summary.
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>
              {user.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-bold">{user.name}</h2>
            <p className="text-muted-foreground">{user.membershipStatus}</p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
              {user.badges.map((badge, index) => (
                <Badge key={index} variant="secondary">
                  {badge}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="flex flex-col items-center p-3 bg-secondary rounded-lg">
            <span className="text-xl sm:text-2xl font-bold">
              ✅ {user.stats.eventsVolunteered}
            </span>
            <span className="text-xs sm:text-sm text-muted-foreground text-center">
              Events Volunteered
            </span>
          </div>
          <div className="flex flex-col items-center p-3 bg-secondary rounded-lg">
            <span className="text-xl sm:text-2xl font-bold">
              ❤️ ₹{user.stats.totalDonations.toLocaleString()}
            </span>
            <span className="text-xs sm:text-sm text-muted-foreground text-center">
              Total Donations
            </span>
          </div>
          <div className="flex flex-col items-center p-3 bg-secondary rounded-lg">
            <span className="text-xl sm:text-2xl font-bold">
              🎖 {user.stats.badgesEarned}
            </span>
            <span className="text-xs sm:text-sm text-muted-foreground text-center">
              Badges Earned
            </span>
          </div>
          <div className="flex flex-col items-center p-3 bg-secondary rounded-lg">
            <span className="text-xl sm:text-2xl font-bold">
              📅 {user.stats.upcomingEvents}
            </span>
            <span className="text-xs sm:text-sm text-muted-foreground text-center">
              Upcoming Events
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
