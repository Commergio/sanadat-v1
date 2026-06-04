"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CancelDocumentButtonProps {
  endpoint: string;
  disabled?: boolean;
}

export function CancelDocumentButton({ endpoint, disabled = false }: CancelDocumentButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (reason.trim().length < 3) {
      toast.error("Validation error: cancel reason must be at least 3 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const payload = await response.json();
      if (!response.ok) {
        const code = payload?.error?.code as string | undefined;
        const message = code === "CONFLICT"
          ? "This document is already cancelled."
          : code === "FORBIDDEN"
            ? "You do not have permission to cancel this document."
            : code === "NOT_FOUND"
              ? "Document not found."
              : code === "VALIDATION"
                ? "Validation error: please provide a valid cancellation reason."
                : payload?.error?.message || "Supabase/RLS error while cancelling document.";
        toast.error(message);
        return;
      }

      toast.success("Document cancelled successfully.");
      setOpen(false);
      setReason("");
      router.refresh();
    } catch {
      toast.error("Supabase/RLS error while cancelling document.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline" className="text-destructive" disabled={disabled}>
          Cancel Document
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel document</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="cancel-reason">Cancellation reason</Label>
          <Textarea
            id="cancel-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter cancellation reason"
            disabled={submitting}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
            Close
          </Button>
          <Button type="button" variant="destructive" onClick={onSubmit} disabled={submitting}>
            {submitting ? "Cancelling..." : "Confirm cancel"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
