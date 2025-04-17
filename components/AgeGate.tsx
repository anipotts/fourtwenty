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

export default function AgeGate() {
  const [open, setOpen] = useState(true);
  const [underage, setUnderage] = useState(false);
  const router = useRouter();

  const handleYes = () => {
    setOpen(false);
    router.push("/home");
  };

  const handleNo = () => {
    setOpen(false);
    setUnderage(true);
  };

  if (underage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background p-6">
        <div className="max-w-md text-center">
          <h1 className="mb-4 text-2xl font-bold">Sorry!</h1>
          <p className="mb-6 text-lg">
            Please come back on your 21st birthday.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl">
            Age Verification
          </DialogTitle>
          <DialogDescription className="text-md sm:text-lg">
            You must be 21 years or older to enter this site.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-center text-lg font-medium">
            Are you 21 or older?
          </p>
        </div>
        <DialogFooter>
          <div className="flex w-full flex-col space-y-2 sm:flex-row sm:justify-center sm:space-x-4 sm:space-y-0">
            <Button
              variant="destructive"
              onClick={handleNo}
              className="w-full sm:w-auto"
            >
              No
            </Button>
            <Button onClick={handleYes} className="w-full sm:w-auto">
              Yes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
