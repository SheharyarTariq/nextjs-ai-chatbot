"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, LogIn, CheckCircle2, XCircle } from "lucide-react";

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

  const handleJoinToggle = async () => {
    if (!isLoggedIn) {
      const currentUrl = encodeURIComponent(window.location.pathname + "?action=join_event");
      router.push(`/login?redirectUrl=${currentUrl}`);
      return;
    }

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
        throw new Error(error.error || `Failed to ${isJoined ? "leave" : "join"} event`);
      }

      const data = await response.json();

      if (method === "POST") {
        setIsJoined(true);
        toast.success(data.message || "Successfully joined the event!");
        // Always refresh agenda after joining as AI might have adjusted it
        window.dispatchEvent(new CustomEvent("agenda-refresh"));
      } else {
        setIsJoined(false);
        toast.success(data.message || "Successfully left the event!");
      }

      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "join_event" && isLoggedIn && !isJoined && !isLoading) {
      handleJoinToggle();
      router.push("/");
    }
  }, [searchParams, isLoggedIn, isJoined, isLoading]);

  return (
    <Button
      onClick={() => handleJoinToggle()}
      disabled={isLoading}
      className={`w-full h-12 text-lg font-bold transition-all duration-300 ${isJoined
        ? "bg-red-500 hover:bg-red-600 text-white"
        : "bg-primary-green hover:bg-primary-green/90 text-white"
        }`}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Please wait...
        </>
      ) : !isLoggedIn ? (
        <>
          <LogIn className="mr-2 h-5 w-5" />
          Login to Join Event
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
