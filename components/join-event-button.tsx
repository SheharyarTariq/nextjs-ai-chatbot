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
}

export function JoinEventButton({
	eventId,
	isLoggedIn,
	initialJoined,
	userRole,
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

		if (userRole === "admin") {
			toast.error("Admins cannot join events as participants.");
			return;
		}

		setIsLoading(true);
		try {
			const method = isJoined ? "DELETE" : "POST";
			const response = await fetch(`/api/events/${eventId}/join`, {
				method,
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || `Failed to ${isJoined ? "leave" : "join"} event`);
			}

			const data = await response.json();
			setIsJoined(!isJoined);
			toast.success(data.message || `Successfully ${isJoined ? "left" : "joined"} the event!`);
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
			// Trigger auto-join
			handleJoinToggle();
			// Clean up URL
			// const newParams = new URLSearchParams(searchParams.toString());
			// newParams.delete("action");
			// const newUrl = window.location.pathname + (newParams.toString() ? `?${newParams.toString()}` : "");
			// window.history.replaceState(null, "", newUrl);

			// Redirect to home page
			router.push("/");
		}
	}, [searchParams, isLoggedIn, isJoined, isLoading]);

	if (userRole === "admin") return null;

	return (
		<Button
			onClick={handleJoinToggle}
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
