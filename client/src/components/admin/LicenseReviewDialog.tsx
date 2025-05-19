import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

// License form schema
const licenseFormSchema = z.object({
  licenseStatus: z.enum(["verified", "pending", "rejected", "not_submitted"], {
    required_error: "Please select a license status",
  }),
  adminNotes: z.string().optional(),
});

// License data displayed in the dialog
interface LicenseData {
  id: number;
  salonId: number;
  salonName: string;
  ownerName: string;
  licenseNumber: string;
  licenseState: string;
  licenseStatus: "verified" | "pending" | "rejected" | "not_submitted";
  licenseVerificationDate?: string;
  submissionDate?: string;
  adminNotes?: string;
}

// Props for the dialog component
interface LicenseReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  licenseData: LicenseData | null;
  onLicenseUpdated?: (updatedLicense: LicenseData) => void;
}

type LicenseFormValues = z.infer<typeof licenseFormSchema>;

export function LicenseReviewDialog({ open, onOpenChange, licenseData, onLicenseUpdated }: LicenseReviewDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LicenseFormValues>({
    resolver: zodResolver(licenseFormSchema),
    defaultValues: {
      licenseStatus: licenseData?.licenseStatus || "pending",
      adminNotes: licenseData?.adminNotes || "",
    },
  });

  // Update form values when licenseData changes
  useEffect(() => {
    if (licenseData) {
      form.reset({
        licenseStatus: licenseData.licenseStatus,
        adminNotes: licenseData.adminNotes || "",
      });
    }
  }, [licenseData, form]);

  const handleSubmit = async (values: LicenseFormValues) => {
    if (!licenseData) return;
    
    setIsSubmitting(true);
    try {
      // Update license status via API
      await apiRequest(`/api/salons/${licenseData.salonId}/license`, {
        method: "PATCH",
        data: {
          licenseStatus: values.licenseStatus,
          adminNotes: values.adminNotes,
          licenseId: licenseData.id
        }
      });

      // Create updated license data
      const updatedLicense = {
        ...licenseData,
        licenseStatus: values.licenseStatus,
        adminNotes: values.adminNotes,
        licenseVerificationDate: values.licenseStatus === 'verified' ? new Date().toISOString() : licenseData.licenseVerificationDate
      };

      // Notify parent component of the update if callback exists
      if (onLicenseUpdated) {
        onLicenseUpdated(updatedLicense);
      }

      // Show success toast
      toast({
        title: "License status updated",
        description: `The license for ${licenseData.salonName} has been updated to ${values.licenseStatus}.`,
        duration: 5000,
      });

      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/salons'] });
      
      // Close the dialog
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating license status:", error);
      toast({
        title: "Error updating license status",
        description: "There was a problem updating the license status. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "verified":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Review Salon License</DialogTitle>
          <DialogDescription>
            Review and update the license status for this salon.
          </DialogDescription>
        </DialogHeader>

        {licenseData ? (
          <>
            {/* License information display */}
            <div className="space-y-4 my-2 p-4 bg-gray-50 rounded-md border">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{licenseData.salonName}</h3>
                  <p className="text-sm text-gray-500">Salon ID: {licenseData.salonId}</p>
                </div>
                <Badge className={getStatusBadgeClass(licenseData.licenseStatus)}>
                  {licenseData.licenseStatus === "verified" && "Verified"}
                  {licenseData.licenseStatus === "pending" && "Pending"}
                  {licenseData.licenseStatus === "rejected" && "Rejected"}
                  {licenseData.licenseStatus === "not_submitted" && "Not Submitted"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="font-medium">Owner Name</p>
                  <p>{licenseData.ownerName}</p>
                </div>
                <div>
                  <p className="font-medium">License Number</p>
                  <p>{licenseData.licenseNumber || "Not provided"}</p>
                </div>
                <div>
                  <p className="font-medium">License State</p>
                  <p>{licenseData.licenseState || "Not provided"}</p>
                </div>
                <div>
                  <p className="font-medium">Submission Date</p>
                  <p>{licenseData.submissionDate 
                    ? new Date(licenseData.submissionDate).toLocaleDateString() 
                    : "Not submitted"}
                  </p>
                </div>
                {licenseData.licenseVerificationDate && (
                  <div className="col-span-2">
                    <p className="font-medium">Last Verification Date</p>
                    <p>{new Date(licenseData.licenseVerificationDate).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Update license status form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="licenseStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="verified">Verified</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="not_submitted">Not Submitted</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="adminNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Admin Notes</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Add any notes about this license verification"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        These notes are only visible to administrators.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Updating..." : "Update License Status"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        ) : (
          <div className="py-6 text-center text-gray-500">
            License information not available.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}