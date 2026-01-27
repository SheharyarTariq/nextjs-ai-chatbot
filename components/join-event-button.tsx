"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, LogIn, CheckCircle2, XCircle } from "lucide-react";
import { useAgendaRefresh } from "@/lib/contexts/agenda-refresh-context";

interface JoinEventButtonProps {
  eventId: string;
  isLoggedIn: boolean;
  initialJoined: boolean;
  userRole?: string;
  eventDate?: string;
  eventTitle?: string;
}

export function JoinEventButton({
  eventId,
  isLoggedIn,
  initialJoined,
  userRole,
  eventDate,
  eventTitle
}: JoinEventButtonProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isJoined, setIsJoined] = useState(initialJoined);
  const [isLoading, setIsLoading] = useState(false);
  const hasAutoJoined = useRef(false);
  const { refreshAgenda } = useAgendaRefresh();

  const isEventPast = eventDate ? new Date(eventDate) < new Date() : false;

  const handleJoinToggle = useCallback(async () => {
    setIsLoading(true);
    try {
      const method = isJoined ? "DELETE" : "POST";
      const response = await fetch(`/api/events/${eventId}/join`, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();

        if (response.status === 400 && error.error?.includes("already joined")) {
          setIsJoined(true);
          toast.info("You have already joined this event!");
          router.refresh();
          return;
        }

        throw new Error(error.error || `Failed to ${isJoined ? "leave" : "join"} event`);
      }

      const data = await response.json();

      if (method === "POST") {
        setIsJoined(true);
        toast.success(data.message || "Successfully joined the event!");
        refreshAgenda();
      } else {
        setIsJoined(false);
        toast.success(data.message || "Successfully left the event!");
        refreshAgenda();
      }

      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [eventId, isJoined, router]);

  const handleLoginRedirect = () => {
    const currentUrl = encodeURIComponent(window.location.pathname + "?action=join_event");
    router.push(`/login?redirectUrl=${currentUrl}`);
  };

  const handleSignupRedirect = () => {
    const currentUrl = encodeURIComponent(window.location.pathname + "?action=join_event");
    router.push(`/register?redirectUrl=${currentUrl}`);
  };

  useEffect(() => {
    const action = searchParams.get("action");

    if (action === "join_event" && isLoggedIn && !isJoined && !isLoading && !hasAutoJoined.current && !isEventPast) {
      hasAutoJoined.current = true;

      router.replace(window.location.pathname, { scroll: false });

      handleJoinToggle();
    }
  }, [searchParams, isLoggedIn, isJoined, isLoading, handleJoinToggle, router, isEventPast]);

  if (!isLoggedIn) {
    return (
      <div className="flex gap-3 w-full">
        <Button
          onClick={handleLoginRedirect}
          disabled={isEventPast}
          className="flex-1 h-12 text-lg font-bold transition-all duration-300 bg-primary-green hover:bg-primary-green/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <LogIn className="mr-2 h-5 w-5" />
          {isEventPast ? "Event Ended" : "Login to Join"}
        </Button>
        <Button
          onClick={handleSignupRedirect}
          disabled={isEventPast}
          className="flex-1 h-12 text-lg font-bold transition-all duration-300 bg-primary-green hover:bg-primary-green/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CheckCircle2 className="mr-2 h-5 w-5" />
          {isEventPast ? "Event Ended" : "Signup to Join"}
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={() => handleJoinToggle()}
      disabled={isLoading || (isEventPast && !isJoined)}
      className={`w-full h-12 text-lg font-bold transition-all duration-300 ${isJoined
        ? "bg-red-500 hover:bg-red-600 text-white"
        : "bg-primary-green hover:bg-primary-green/90 text-white"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Please wait...
        </>
      ) : isEventPast && !isJoined ? (
        <>
          <XCircle className="mr-2 h-5 w-5" />
          Event Ended
        </>
      ) : isJoined ? (
        <>
          <XCircle className="mr-2 h-5 w-5" />
          Leave Event
        </>
      ) : (
        <>
          <CheckCircle2 className="mr-2 h-5 w-5" />
          Join Event
        </>
      )}
    </Button>
  );
}
