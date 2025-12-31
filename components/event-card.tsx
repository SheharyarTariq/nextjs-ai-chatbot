"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Activity, Zap, Trash2, Pencil, Loader2, Share2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { DeleteModal } from "@/components/delete-modal";
import type { EventType, EventIntensity } from "@/lib/db/schema";
import { typeColors, intensityColors } from "@/components/page/constants";
import { ConflictModal } from "@/components/conflict-modal";

interface EventCardProps {
  event: {
    id: string;
    title: string;
    location?: string;
    locationLat: string;
    locationLng: string;
    city: string;
    date?: string;
    time?: string;
    duration?: number;
    type: EventType;
    intensity: EventIntensity;
    participantCount?: number;
    hasJoined?: boolean;
  };
  userRole?: string;
  showAdminActions?: boolean;
  onDelete?: () => void;
  onEdit?: (event: any) => void;
  onJoinChange?: () => void;
}

export function EventCard({ event, userRole, showAdminActions = true, onDelete, onEdit, onJoinChange }: EventCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictingSession, setConflictingSession] = useState<any>(null);

  let eventDate: Date | null = null;
  let isUpcoming = false;

  if (event.date) {
    const dateTimeString = event.time
      ? `${event.date}T${event.time}`
      : `${event.date}T00:00`;
    eventDate = new Date(dateTimeString);
    isUpcoming = eventDate > new Date();
  }

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete event");
      }

      toast.success("Event deleted successfully!");
      setShowDeleteModal(false);
      onDelete?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete event");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleJoinToggle = async () => {
    if (event.hasJoined) {
      setShowLeaveModal(true);
    } else {
      // Check for conflict
      setIsJoining(true);
      try {
        const response = await fetch(`/api/events/${event.id}/join/check`);
        if (response.ok) {
          const data = await response.json();
          if (data.hasConflict) {
            setConflictingSession(data.conflictingSession);
            setShowConflictModal(true);
            return;
          }
        }
        setShowJoinModal(true);
      } catch (error) {
        console.error("Conflict check failed:", error);
        setShowJoinModal(true);
      } finally {
        setIsJoining(false);
      }
    }
  };

  const confirmJoin = async (resolution?: string) => {
    setIsJoining(true);
    try {
      const response = await fetch(`/api/events/${event.id}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ resolution }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to join event");
      }

      const data = await response.json();
      toast.success(data.message || "Successfully joined the event!");
      setShowJoinModal(false);
      setShowConflictModal(false);
      onJoinChange?.();

      if (resolution && resolution !== "add") {
        window.dispatchEvent(new CustomEvent("agenda-refresh"));
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to join event");
    } finally {
      setIsJoining(false);
    }
  };

  const confirmLeave = async () => {
    setIsJoining(true);
    try {
      const response = await fetch(`/api/events/${event.id}/join`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to leave event");
      }

      const data = await response.json();
      toast.success(data.message || "Successfully left the event!");
      setShowLeaveModal(false);
      onJoinChange?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to leave event");
    } finally {
      setIsJoining(false);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/events/${event.id}`;
    window.open(url, "_blank");
  };

  return (
    <Card className={`p-4 space-y-1.5 transition-all hover:shadow-md`} >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-base line-clamp-1 flex-1 truncate sm:max-w-48 max-w-28" title={event.title}>{event.title}</h3>
        <div className="flex items-center gap-1 shrink-0">
          <Badge
            variant={event.hasJoined ? "destructive" : "secondary"}
            className={`whitespace-nowrap cursor-pointer hover:opacity-80 ${isJoining ? "cursor-not-allowed" : ""
              } ${event.hasJoined
                ? "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20"
                : "bg-primary-green/10 text-primary-green border-primary-green/20 hover:bg-primary-green/20"
              }`}
            onClick={isJoining ? undefined : handleJoinToggle}
          >
            {isJoining ? (
              <>
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                {event.hasJoined ? "Leave" : "Join"}
              </>
            ) : (
              <>
                {event.hasJoined ? "Leave" : "Join"}
                {typeof event.participantCount === 'number' && event.participantCount > 0 && (
                  <span className="ml-1">({event.participantCount})</span>
                )}
              </>
            )}
          </Badge>
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              className="h-8 w-8 hover:cursor-pointer text-muted-foreground hover:text-primary hover:bg-primary/10"
              title="Share event"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Date & Time */}
      {
        eventDate && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{format(eventDate, "MMM dd, yyyy")}</span>
            {event.time && (
              <>
                <span>•</span>
                <Clock className="h-4 w-4" />
                <span>{format(eventDate, "hh:mm a")}</span>
              </>
            )}
          </div>
        )
      }

      {/* Location */}
      <div
        className="flex items-start gap-2 text-sm text-muted-foreground hover:text-primary cursor-pointer transition-colors group"
        onClick={() => {
          if (event.locationLat && event.locationLng) {
            window.open(
              `https://www.google.com/maps/dir/?api=1&destination=${event.locationLat},${event.locationLng}`,
              "_blank"
            );
          }
        }}
        title="View directions on Google Maps"
      >
        <MapPin className="h-4 w-4 mt-0.5 shrink-0 group-hover:text-primary" />
        <div className="flex-1 min-w-0">
          {event.location ? (
            <p className="line-clamp-1">{event.location}</p>
          ) : (
            <p>{event.city}</p>
          )}
        </div>
      </div>

      {/* Last Row: Badges & Admin Actions */}
      <div className="flex items-center justify-between gap-1 mt-1">
        <div className="flex flex-wrap items-center gap-1">
          {event.duration && (
            <Badge variant="outline" className="bg-muted text-[10px] px-1.5 py-0 h-5">
              {event.duration}m
            </Badge>
          )}
          {event.type && (
            <Badge
              variant="outline"
              className={`${typeColors[event.type] || typeColors.Others} text-[10px] px-1.5 py-0 h-5`}
            >
              <Activity className="h-2.5 w-2.5 mr-1" />
              {event.type}
            </Badge>
          )}
          {event.intensity && (
            <Badge
              variant="outline"
              className={`${intensityColors[event.intensity] || intensityColors.Medium} text-[10px] px-1.5 py-0 h-5`}
            >
              <Zap className="h-2.5 w-2.5 mr-1" />
              {event.intensity}
            </Badge>
          )}
        </div>

        {userRole === "admin" && showAdminActions && (
          <div className="flex items-center gap-0.5 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit?.(event)}
              className="h-7 w-7 hover:cursor-pointer text-muted-foreground hover:text-primary hover:bg-primary/5"
              title="Edit event"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDeleteClick}
              disabled={isDeleting}
              className="h-7 w-7 hover:cursor-pointer text-destructive/80 hover:text-destructive hover:bg-destructive/5"
              title="Delete event"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      <DeleteModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        onConfirm={confirmDelete}
        loading={isDeleting}
        title="Delete Event"
        description={`Are you sure you want to delete "${event.title}"? This action cannot be undone.`}
        confirmText="Delete"
        loadingText="Deleting..."
      />

      <DeleteModal
        open={showJoinModal}
        onOpenChange={setShowJoinModal}
        onConfirm={confirmJoin}
        loading={isJoining}
        title="Join Event"
        description={`Are you sure you want to join "${event.title}"?${event.date ? ` This event is scheduled for ${format(new Date(event.date), "MMM dd, yyyy")}${event.time ? ` at ${format(new Date(`${event.date}T${event.time}`), "hh:mm a")}` : ""}.` : ""}`}
        confirmText="Join"
        loadingText="Joining..."
      />

      <DeleteModal
        open={showLeaveModal}
        onOpenChange={setShowLeaveModal}
        onConfirm={confirmLeave}
        loading={isJoining}
        title="Leave Event"
        description={`Are you sure you want to leave "${event.title}"? You can always rejoin later.`}
        confirmText="Leave"
        loadingText="Leaving..."
      />

      <ConflictModal
        open={showConflictModal}
        onOpenChange={setShowConflictModal}
        onResolve={confirmJoin}
        eventTitle={event.title}
        eventDate={event.date || ""}
      />
    </Card >
  );
}
