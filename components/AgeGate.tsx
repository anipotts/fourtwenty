"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@/components/ui/visually-hidden";

const UnderageMessage = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-[#f8f9fa] p-6">
    <div
      className="w-full max-w-xs rounded-lg border border-gray-100 bg-white p-6 shadow-md text-center font-serif"
      role="alert"
      aria-live="assertive"
    >
      <h1 className="text-xl font-bold mb-3 text-[#495057]">Sorry!</h1>
      <p className="text-base text-[#495057]">
        Please come back on your 21st birthday.
      </p>
    </div>
  </div>
);

export default function AgeGate() {
  const [status, setStatus] = useState<"checking" | "underage" | "verified">(
    "checking"
  );
  const router = useRouter();

  // Refs for focus trapping
  const yesButtonRef = useRef<HTMLButtonElement>(null);
  const noButtonRef = useRef<HTMLButtonElement>(null);

  // Trap focus within the dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (status !== "checking") return;

      if (e.key === "Tab") {
        // If shift+tab on first focusable element, move to last
        if (e.shiftKey && document.activeElement === noButtonRef.current) {
          e.preventDefault();
          yesButtonRef.current?.focus();
        }
        // If tab on last focusable element, move to first
        else if (
          !e.shiftKey &&
          document.activeElement === yesButtonRef.current
        ) {
          e.preventDefault();
          noButtonRef.current?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    // Focus the "Yes" button on mount for easier access
    yesButtonRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [status]);

  if (status === "underage") {
    return <UnderageMessage />;
  }

  if (status === "verified") {
    router.push("/home");
    return null;
  }

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-[380px] w-[90vw] bg-white border border-gray-100 shadow-md font-serif"
        aria-labelledby="age-gate-title"
        aria-describedby="age-gate-description"
      >
        <DialogHeader className="space-y-2">
          <DialogTitle
            id="age-gate-title"
            className="text-xl sm:text-2xl text-center text-[#495057] font-bold"
          >
            Age Verification
          </DialogTitle>
          <DialogDescription
            id="age-gate-description"
            className="text-base sm:text-lg text-center text-[#495057]"
          >
            You must be 21 years or older to enter this site.
          </DialogDescription>
        </DialogHeader>
        <div className="py-3">
          <p className="text-center text-base sm:text-lg font-bold text-[#495057]">
            Are you 21 or older?
          </p>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-3 sm:gap-4">
          <Button
            variant="outline"
            onClick={() => setStatus("underage")}
            className="w-full border-gray-100 text-[#495057] hover:bg-[#f8f9fa] hover:text-[#495057]"
            ref={noButtonRef}
          >
            <VisuallyHidden>I am under 21 years old - </VisuallyHidden>
            No
          </Button>
          <Button
            onClick={() => setStatus("verified")}
            className="w-full bg-[#4dd783] hover:bg-[#3bb871] text-white"
            ref={yesButtonRef}
          >
            <VisuallyHidden>I am 21 years or older - </VisuallyHidden>
            Yes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
