"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

export function CopyLinkButton() {
	const [copied, setCopied] = useState(false);

	const copyToClipboard = async () => {
		try {
			await navigator.clipboard.writeText(window.location.href);
			setCopied(true);
			toast.success("Link copied to clipboard!");
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			toast.error("Failed to copy link");
		}
	};

	return (
		<Button
			variant="outline"
			size="sm"
			className="gap-2"
			onClick={copyToClipboard}
		>
			{copied ? (
				<>
					<Check className="h-4 w-4" />
					Copied
				</>
			) : (
				<>
					<Copy className="h-4 w-4" />
					Copy Link
				</>
			)}
		</Button>
	);
}
