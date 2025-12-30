"use client";

import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, AlertTriangle } from "lucide-react";

interface ConflictModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onResolve: (option: string) => Promise<void>;
	eventTitle: string;
	eventDate: string;
}

export function ConflictModal({
	open,
	onOpenChange,
	onResolve,
	eventTitle,
	eventDate,
}: ConflictModalProps) {
	const [selectedOption, setSelectedOption] = useState("add");
	const [isResolving, setIsResolving] = useState(false);

	const handleResolve = async () => {
		setIsResolving(true);
		try {
			await onResolve(selectedOption);
			onOpenChange(false);
		} catch (error) {
			console.error("Resolution failed:", error);
		} finally {
			setIsResolving(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<div className="flex items-center gap-2 text-warning mb-2">
						<AlertTriangle className="h-5 w-5 text-amber-500" />
						<DialogTitle>Agenda Conflict Detected</DialogTitle>
					</div>
					<DialogDescription>
						You already have a workout planned for {eventDate}. How would you like to resolve this conflict with "{eventTitle}"?
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-4 py-4">
					<RadioGroup
						value={selectedOption}
						onValueChange={setSelectedOption}
						className="gap-4"
					>
						<div className="flex items-start space-x-3 rounded-md border p-3 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setSelectedOption("replace")}>
							<RadioGroupItem value="replace" id="replace" className="mt-1" />
							<div className="grid gap-1.5 leading-none">
								<Label htmlFor="replace" className="font-semibold cursor-pointer">Replace</Label>
								<p className="text-sm text-muted-foreground">
									Replace the agenda session with this event.
								</p>
							</div>
						</div>

						<div className="flex items-start space-x-3 rounded-md border p-3 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setSelectedOption("move")}>
							<RadioGroupItem value="move" id="move" className="mt-1" />
							<div className="grid gap-1.5 leading-none">
								<Label htmlFor="move" className="font-semibold cursor-pointer">Move</Label>
								<p className="text-sm text-muted-foreground">
									Move the original workout to a low-load day in the week.
								</p>
							</div>
						</div>

						<div className="flex items-start space-x-3 rounded-md border p-3 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setSelectedOption("rebalance")}>
							<RadioGroupItem value="rebalance" id="rebalance" className="mt-1" />
							<div className="grid gap-1.5 leading-none">
								<Label htmlFor="rebalance" className="font-semibold cursor-pointer">Rebalance</Label>
								<p className="text-sm text-muted-foreground">
									Adjust training load for the week to accommodate both.
								</p>
							</div>
						</div>

						<div className="flex items-start space-x-3 rounded-md border p-3 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setSelectedOption("add")}>
							<RadioGroupItem value="add" id="add" className="mt-1" />
							<div className="grid gap-1.5 leading-none">
								<Label htmlFor="add" className="font-semibold cursor-pointer">Add to agenda</Label>
								<p className="text-sm text-muted-foreground">
									Keep both sessions for the day.
								</p>
							</div>
						</div>
					</RadioGroup>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)} disabled={isResolving}>
						Cancel
					</Button>
					<Button
						onClick={handleResolve}
						disabled={isResolving}
						className="bg-primary-green hover:bg-primary-green/90 text-white"
					>
						{isResolving ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Resolving...
							</>
						) : (
							"Confirm Choice"
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
