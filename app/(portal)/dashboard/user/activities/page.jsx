"use client";

import React, { useState } from "react";
import { Calendar, MapPin, Download } from "lucide-react";

// Mock data for demonstration
const upcomingEvents = [
  {
    id: 1,
    name: "Beach Cleanup",
    date: "2023-08-15",
    location: "Mumbai Beach",
    ngo: "Clean Oceans",
    status: "Upcoming",
  },
  {
    id: 2,
    name: "Tree Planting Drive",
    date: "2023-08-20",
    location: "Delhi Park",
    ngo: "Green Earth",
    status: "Ongoing",
  },
];

const pastEvents = [
  {
    id: 3,
    name: "Food Distribution",
    date: "2023-07-25",
    location: "Bangalore Slums",
    ngo: "Feeding India",
    role: "Volunteer",
  },
  {
    id: 4,
    name: "Marathon for Education",
    date: "2023-07-01",
    location: "Chennai",
    ngo: "Educate All",
    role: "Coordinator",
  },
];

// Card components
const Card = ({ children, className = "" }) => (
  <div
    className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}
  >
    {children}
  </div>
);

const CardHeader = ({ children }) => (
  <div className="flex flex-col space-y-1.5 p-6">{children}</div>
);

const CardTitle = ({ children, className = "" }) => (
  <h3
    className={`text-2xl font-semibold leading-none tracking-tight ${className}`}
  >
    {children}
  </h3>
);

const CardContent = ({ children }) => (
  <div className="p-6 pt-0">{children}</div>
);

// Button component
const Button = ({
  children,
  className = "",
  variant = "default",
  size = "default",
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors";
  const variantStyles = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline:
      "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    destructive:
      "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  };
  const sizeStyles = {
    default: "h-10 px-4 py-2",
    sm: "h-9 px-3",
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// Badge component with custom colors
const Badge = ({ children, variant = "default", className = "" }) => {
  const baseStyles =
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors";

  // Custom styles based on content
  let customStyle = "";
  switch (children) {
    case "Volunteer":
      customStyle = "bg-blue-100 text-blue-800";
      break;
    case "Coordinator":
      customStyle = "bg-purple-100 text-purple-800";
      break;
    case "Ongoing":
      customStyle = "bg-green-100 text-green-800";
      break;
    case "Upcoming":
      customStyle = "bg-yellow-100 text-yellow-800";
      break;
    default:
      customStyle = "bg-gray-100 text-gray-800";
  }

  return (
    <span className={`${baseStyles} ${customStyle} ${className}`}>
      {children}
    </span>
  );
};

const ActivityParticipationPage = () => {
  const [liveEvent, setLiveEvent] = useState({
    id: 5,
    name: "Blood Donation Camp",
    location: "Kolkata Hospital",
  });

  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-3xl font-bold mb-8">Activity Participation</h1>

      {liveEvent && (
        <Card className="bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-700">Live Event</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{liveEvent.name}</h3>
                <p className="text-sm text-gray-500">{liveEvent.location}</p>
              </div>
              <Button
                onClick={() => setLiveEvent(null)}
                className="bg-green-600 hover:bg-green-700"
              >
                Mark Attendance
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between border-b pb-4"
              >
                <div>
                  <h3 className="font-semibold">{event.name}</h3>
                  <p className="text-sm text-gray-500">{event.ngo}</p>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>{event.date}</span>
                    <MapPin className="w-4 h-4 ml-2" />
                    <span>{event.location}</span>
                  </div>
                </div>
                <div className="text-right">
                  <Badge>{event.status}</Badge>
                  <div className="mt-2 space-x-2">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    <Button variant="destructive" size="sm">
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Past Events Attended</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pastEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between border-b pb-4"
              >
                <div>
                  <h3 className="font-semibold">{event.name}</h3>
                  <p className="text-sm text-gray-500">{event.ngo}</p>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>{event.date}</span>
                    <MapPin className="w-4 h-4 ml-2" />
                    <span>{event.location}</span>
                  </div>
                  <Badge className="mt-2">{event.role}</Badge>
                </div>
                <div className="text-right">
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Certificate
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <Button className="bg-[#1CAC78] hover:bg-[#158f63]">
          Find More Activities!
        </Button>
      </div>
    </div>
  );
};

export default ActivityParticipationPage;
