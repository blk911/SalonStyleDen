import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const licenseFormSchema = z.object({
  licenseName: z.string().min(2, { message: "License name is required" }),
  licenseNumber: z.string().min(1, { message: "License number is required" }),
  licenseState: z.string().min(1, { message: "License state is required" }),
  verifyAccuracy: z.boolean().refine((val) => val === true, {
    message: "You must verify the accuracy of your information",
  }),
});

type LicenseFormValues = z.infer<typeof licenseFormSchema>;

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
  "DC", "PR", "VI"
];

interface LicenseVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (licenseData: LicenseFormValues) => void;
  onSkip: () => void;
  salonId: number | null;
  salonName: string;
}

export default function LicenseVerificationDialog({
  open,
  onOpenChange,
  onSubmit,
  onSkip,
  salonId,
  salonName,
}: LicenseVerificationDialogProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [licenseData, setLicenseData] = useState<LicenseFormValues | null>(null);

  const form = useForm<LicenseFormValues>({
    resolver: zodResolver(licenseFormSchema),
    defaultValues: {
      licenseName: "",
      licenseNumber: "",
      licenseState: "",
      verifyAccuracy: false,
    },
  });

  const handleLicenseSubmit = (data: LicenseFormValues) => {
    setLicenseData(data);
    setShowConfirmation(true);
  };

  const handleConfirmSubmit = () => {
    if (licenseData) {
      onSubmit(licenseData);
      onOpenChange(false);
    }
  };

  const handleSkip = () => {
    onSkip();
    onOpenChange(false);
  };

  if (showConfirmation) {
    return (
      <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen) {
          setShowConfirmation(false);
        }
        onOpenChange(isOpen);
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm License Information</DialogTitle>
            <DialogDescription>
              Please verify that the following information is correct.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Name on License</p>
              <p className="text-sm">{licenseData?.licenseName}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">License Number</p>
              <p className="text-sm">{licenseData?.licenseNumber}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">State</p>
              <p className="text-sm">{licenseData?.licenseState}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmation(false)}>
              Edit Information
            </Button>
            <Button onClick={handleConfirmSubmit}>Confirm & Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[475px]">
        <DialogHeader>
          <DialogTitle className="text-lg text-center">VMB! Salon License Requirement</DialogTitle>
          <DialogDescription className="text-center pt-2">
            To register as a SALON OWNER, a valid state license for your specialization IS REQUIRED.
          </DialogDescription>
        </DialogHeader>
        <div className="text-sm text-gray-600 pb-2">
          <p>
            Enter your license info and submit. The verification of status typically takes 2-3 days; 
            often it's same day, but this is not guaranteed. During this period, you will be limited 
            to 3 client invitations.
          </p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleLicenseSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="licenseName"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Your name as listed on license" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="licenseNumber"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="License number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="licenseState"
              render={({ field }) => (
                <FormItem>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {US_STATES.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="verifyAccuracy"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <p className="text-sm">
                      I verify this information is accurate
                    </p>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-between pt-2">
              <Button type="button" variant="outline" onClick={handleSkip}>
                Enter Later
              </Button>
              <Button type="submit">Enter License</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}