"use client"

import { useState, useEffect } from "react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { MapPin, Users, User, Calendar, Clock } from "lucide-react"
import { Timestamp } from "firebase/firestore"
import Image from "next/image"

const formatDate = (timestamp) => {
  if (!timestamp) return "Date not available"
  try {
    const date = timestamp instanceof Timestamp 
      ? timestamp.toDate() 
      : new Date(timestamp.seconds * 1000)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch (error) {
    console.error("Date formatting error:", error)
    return "Invalid date format"
  }
}

const formatTime = (timestamp) => {
  if (!timestamp) return ""
  try {
    const date = timestamp instanceof Timestamp 
      ? timestamp.toDate() 
      : new Date(timestamp.seconds * 1000)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    console.error("Time formatting error:", error)
    return ""
  }
}

export default function NGOActivities({ ngoId }) {
    const [activities, setActivities] = useState([])
    const [loading, setLoading] = useState(true)
  
    useEffect(() => {
      async function fetchActivities() {
        try {
          const activitiesRef = collection(db, "activities")
          const activitiesSnapshot = await getDocs(activitiesRef)
          
          const allActivities = activitiesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          
          console.log("Current NGO ID:", ngoId)
          console.log("All activities:", allActivities)
          
          const filteredActivities = allActivities.filter(activity => {
            const matches = activity.ngoId === ngoId
            console.log(`Activity ${activity.id}: NGO ID ${activity.ngoId} matches current NGO ID ${ngoId}? ${matches}`)
            return matches
          })
          
          console.log("Filtered activities for this NGO:", filteredActivities)
          setActivities(filteredActivities)
        } catch (error) {
          console.error("Error fetching activities:", error)
        } finally {
          setLoading(false)
        }
      }
  
      if (ngoId) {
        fetchActivities()
      } else {
        console.log("No NGO ID provided")
        setActivities([])
        setLoading(false)
      }
    }, [ngoId])
  
    if (loading) {
      return <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    }
  
    if (activities.length === 0) {
      return <div className="text-center py-8 text-muted-foreground">
        No activities found for this NGO
      </div>
    }
  
    return (
      <div className="divide-y">
        {activities.map((activity) => (
          <div key={activity.eventId} className="py-4 flex flex-col md:flex-row gap-4">
            {/* Image thumbnail (smaller for list view) */}
            {activity.logoUrl && (
              <div className="relative h-24 w-24 flex-shrink-0">
                <Image 
                  src={activity.logoUrl} 
                  alt={`${activity.eventName || 'Event'} logo`}
                  fill 
                  className="object-cover rounded-md" 
                />
              </div>
            )}
            
            {/* Activity details */}
            <div className="flex-grow space-y-2">
              {/* Title and badges */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="font-medium">{activity.eventName}</h3>
                <div className="flex gap-2">
                  {activity.status && (
                    <Badge variant="secondary">{activity.status}</Badge>
                  )}
                  {activity.category && (
                    <Badge variant="outline">{activity.category}</Badge>
                  )}
                </div>
              </div>
              
              {/* Description */}
              <p className="text-sm text-muted-foreground">{activity.shortDescription}</p>
              
              {/* Info grid for better layout on different screen sizes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm mt-2">
                {/* Date and time (using our existing format functions) */}
                {activity.date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(activity.date)}</span>
                    {activity.time && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(activity.time)}
                      </span>
                    )}
                  </div>
                )}
                
                {/* Location with map link */}
                {activity.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{activity.location}</span>
                    {activity.mapUrl && (
                      <a 
                        href={activity.mapUrl.replace('fgoogle', 'google')} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 ml-1"
                      >
                        Map
                      </a>
                    )}
                  </div>
                )}
                
                {/* Participants */}
                {activity.participantCount && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{activity.participantCount} participants</span>
                  </div>
                )}
                
                {/* Organizer */}
                {activity.organizer && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Organized by: {activity.organizer}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    )
}