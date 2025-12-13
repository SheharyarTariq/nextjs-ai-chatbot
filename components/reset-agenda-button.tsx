"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { DeleteModal } from "@/components/delete-modal";
import { toast } from "./toast";

export function ResetAgendaButton() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleReset = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/agenda/reset", {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset agenda");
      }

      toast({
        type: "success",
        description: "Agenda and conversation reset successfully!"});
      setIsDialogOpen(false);

      // Dispatch event to refresh agenda components
      window.dispatchEvent(new CustomEvent("agenda-refresh"));
      // Navigate to home without full page reload
      router.push("/");
    } catch (error: any) {
      console.error("Error resetting agenda:", error);
      toast({
        type: "error",
        description: error.message || "Failed to reset agenda"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsDialogOpen(true)}
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        aria-label="Reset agenda and conversation"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <DeleteModal
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onConfirm={handleReset}
        loading={isLoading}
        title="Reset Agenda and Conversation"
        description="Are you sure you want to reset your agenda and delete the entire conversation? This action cannot be undone. All your training data, progress, and chat history will be permanently deleted."
        confirmText="Reset Everything"
      />
    </>
  );
}
