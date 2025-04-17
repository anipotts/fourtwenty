"use client";

import React, { useState } from "react";
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

const UnderageMessage = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-[#f8f9fa] p-6">
    <div className="w-full max-w-xs rounded-lg border border-[#e9ecef] bg-white p-6 shadow-md text-center">
      <h1 className="text-xl font-bold mb-3 text-[#212529]">Sorry!</h1>
      <p className="text-base text-[#495057] font-sans">
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

  if (status === "underage") {
    return <UnderageMessage />;
  }

  if (status === "verified") {
    router.push("/home");
    return null;
  }

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[380px] w-[90vw] bg-white border border-[#e9ecef] shadow-md">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-xl sm:text-2xl text-center text-[#212529] font-bold">
            Age Verification
          </DialogTitle>
          <DialogDescription className="text-base sm:text-lg text-center text-[#495057] font-sans">
            You must be 21 years or older to enter this site.
          </DialogDescription>
        </DialogHeader>
        <div className="py-3">
          <p className="text-center text-base sm:text-lg font-bold text-[#212529]">
            Are you 21 or older?
          </p>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-3 sm:gap-4">
          <Button
            variant="outline"
            onClick={() => setStatus("underage")}
            className="w-full border-[#e9ecef] text-[#495057] hover:bg-[#f8f9fa] hover:text-[#212529]"
          >
            No
          </Button>
          <Button
            onClick={() => setStatus("verified")}
            className="w-full bg-[#4dd783] hover:bg-[#3bb871] text-white"
          >
            Yes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
