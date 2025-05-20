import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Eye, XCircleIcon, TrashIcon } from "lucide-react";
import { formatPhoneNumber } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

// Define types
interface Salon {
  id: number;
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  licenseStatus?: 'verified' | 'pending' | 'rejected' | 'not_submitted';
  licenseNumber?: string;
  licenseState?: string;
  licenseVerificationDate?: string;
  suspended?: boolean;
}

interface SimpleSalonListProps {
  salons: Salon[];
  isLoading: boolean;
  error: Error | null;
}

export function SimpleSalonList({ salons, isLoading, error }: SimpleSalonListProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedSalon, setExpandedSalon] = useState<number | null>(null);
  const [salonToSuspend, setSalonToSuspend] = useState<Salon | null>(null);
  const [licenseViewSalon, setLicenseViewSalon] = useState<Salon | null>(null);

  // Suspend salon mutation
  const suspendSalonMutation = useMutation({
    mutationFn: async (salonId: number) => {
      return apiRequest(`/api/salons/${salonId}/suspend`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons'] });
      toast({
        title: "Salon suspended",
        description: "The salon has been suspended successfully."
      });
      setSalonToSuspend(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error suspending salon",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Delete salon mutation
  const deleteSalonMutation = useMutation({
    mutationFn: async (salonId: number) => {
      return apiRequest(`/api/salons/${salonId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons'] });
      toast({
        title: "Salon deleted",
        description: "The salon has been permanently deleted."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting salon",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // License verification mutation
  const verifyLicenseMutation = useMutation({
    mutationFn: async (salonId: number) => {
      return apiRequest(`/api/salons/${salonId}/verify-license`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons'] });
      toast({
        title: "License verified",
        description: "The salon license has been verified successfully."
      });
      setLicenseViewSalon(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error verifying license",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // License rejection mutation
  const rejectLicenseMutation = useMutation({
    mutationFn: async (salonId: number) => {
      return apiRequest(`/api/salons/${salonId}/reject-license`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons'] });
      toast({
        title: "License rejected",
        description: "The salon license has been rejected."
      });
      setLicenseViewSalon(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error rejecting license",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  if (isLoading) return <div className="py-8 text-center text-gray-500">Loading salons...</div>;
  
  if (error) return <div className="py-8 text-center text-red-500">Error loading salons</div>;
  
  if (!salons || salons.length === 0) return <div className="py-8 text-center text-gray-500">No salons found</div>;
  
  return (
    <>
      <div className="space-y-2">
        {salons.map((salon) => (
          <div key={salon.id} className="border rounded-md overflow-hidden">
            <div 
              className={`px-4 py-3 flex justify-between items-center cursor-pointer ${
                salon.suspended ? 'bg-red-50' : 'bg-white hover:bg-gray-50'
              }`}
              onClick={() => setExpandedSalon(expandedSalon === salon.id ? null : salon.id)}
            >
              <div className="flex items-center">
                <span className="font-medium text-pink-800">{salon.name}</span>
                <span className="ml-2 text-xs text-pink-600">ID: {salon.id}</span>
                
                {/* License Status Badge */}
                {salon.licenseStatus && (
                  <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full 
                    ${salon.licenseStatus === 'verified' ? 'bg-green-100 text-green-800' : ''}
                    ${salon.licenseStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                    ${salon.licenseStatus === 'rejected' ? 'bg-red-100 text-red-800' : ''}
                    ${salon.licenseStatus === 'not_submitted' ? 'bg-gray-100 text-gray-800' : ''}
                  `}>
                    {salon.licenseStatus === 'verified' && 'License Verified'}
                    {salon.licenseStatus === 'pending' && 'License Pending'}
                    {salon.licenseStatus === 'rejected' && 'License Rejected'}
                    {salon.licenseStatus === 'not_submitted' && 'No License Info'}
                  </span>
                )}
                {!salon.licenseStatus && (
                  <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-800">
                    No License Info
                  </span>
                )}
                
                {/* Suspended Badge */}
                {salon.suspended && (
                  <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-800">
                    Suspended
                  </span>
                )}
              </div>
              <div className="flex items-center">
                <Link 
                  to={`/salon/${salon.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setLocation(`/salon/${salon.id}`);
                  }}
                  className="mr-3 px-2 py-1 text-[10px] bg-pink-200 text-pink-700 rounded hover:bg-pink-300"
                >
                  Salon Page
                </Link>
                
                {/* View License Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLicenseViewSalon(salon);
                  }}
                  className="mr-2 px-2 py-1 text-[10px] bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center gap-1"
                  title="View License Info"
                >
                  <Eye className="h-3 w-3" />
                  License
                </button>
                
                {/* Suspend Button - Not shown for VMB or Tiffany's salon */}
                {salon.id !== 1 && salon.id !== 2 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSalonToSuspend(salon);
                    }}
                    className="mr-2 px-2 py-1 text-[10px] bg-orange-100 text-orange-700 rounded hover:bg-orange-200 flex items-center gap-1"
                    title="Suspend Salon"
                  >
                    <XCircleIcon className="h-3 w-3" />
                    Suspend
                  </button>
                )}
                
                {/* Delete Button - Not shown for VMB or Tiffany's salon */}
                {salon.id !== 1 && salon.id !== 2 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Are you sure you want to delete ${salon.name}? This cannot be undone.`)) {
                        deleteSalonMutation.mutate(salon.id);
                      }
                    }}
                    className="mr-3 px-2 py-1 text-[10px] bg-red-100 text-red-700 rounded hover:bg-red-200 flex items-center gap-1"
                    title="Delete Salon"
                  >
                    <TrashIcon className="h-3 w-3" />
                    Delete
                  </button>
                )}
                
                {expandedSalon === salon.id ? (
                  <ChevronUp className="h-4 w-4 text-pink-600" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-pink-600" />
                )}
              </div>
            </div>
            
            {/* Salon Details - Hidden until expanded */}
            {expandedSalon === salon.id && (
              <div className="p-4 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Salon Information</h3>
                    <dl className="space-y-1 text-sm">
                      <div className="flex">
                        <dt className="w-24 font-medium text-gray-500">Owner:</dt>
                        <dd>{salon.ownerName}</dd>
                      </div>
                      <div className="flex">
                        <dt className="w-24 font-medium text-gray-500">Email:</dt>
                        <dd>{salon.email}</dd>
                      </div>
                      <div className="flex">
                        <dt className="w-24 font-medium text-gray-500">Phone:</dt>
                        <dd>{formatPhoneNumber(salon.phone)}</dd>
                      </div>
                      <div className="flex">
                        <dt className="w-24 font-medium text-gray-500">License:</dt>
                        <dd>
                          {salon.licenseNumber ? (
                            <Badge variant="outline" className="text-xs">
                              {salon.licenseNumber}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">Not submitted</span>
                          )}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="mt-4 flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocation(`/salon/${salon.id}`);
                    }}
                  >
                    View Full Profile
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* License Viewing/Approval Dialog */}
      {licenseViewSalon && (
        <AlertDialog open={!!licenseViewSalon} onOpenChange={(open) => !open && setLicenseViewSalon(null)}>
          <AlertDialogContent className="max-w-xl">
            <AlertDialogHeader>
              <AlertDialogTitle>License Information - {licenseViewSalon.name}</AlertDialogTitle>
              <AlertDialogDescription>
                Review and manage license verification for this salon
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <div 
                className={`p-4 mb-4 rounded-md border ${
                  licenseViewSalon.licenseStatus === 'verified' ? 'bg-green-50 border-green-100 text-green-800' :
                  licenseViewSalon.licenseStatus === 'pending' ? 'bg-yellow-50 border-yellow-100 text-yellow-800' :
                  licenseViewSalon.licenseStatus === 'rejected' ? 'bg-red-50 border-red-100 text-red-800' :
                  'bg-gray-50 border-gray-100 text-gray-800'
                }`}
              >
                <div className="font-medium">
                  Status: {' '}
                  {licenseViewSalon.licenseStatus === 'verified' && 'Verified'}
                  {licenseViewSalon.licenseStatus === 'pending' && 'Pending Verification'}
                  {licenseViewSalon.licenseStatus === 'rejected' && 'Rejected'}
                  {(!licenseViewSalon.licenseStatus || licenseViewSalon.licenseStatus === 'not_submitted') && 'Not Submitted'}
                </div>
              </div>
              
              <div className="space-y-4">
                <dl className="space-y-2">
                  <div className="flex">
                    <dt className="w-32 font-medium text-gray-600">License Number:</dt>
                    <dd>{licenseViewSalon.licenseNumber || 'Not provided'}</dd>
                  </div>
                  <div className="flex">
                    <dt className="w-32 font-medium text-gray-600">State/Region:</dt>
                    <dd>{licenseViewSalon.licenseState || 'Not provided'}</dd>
                  </div>
                  {licenseViewSalon.licenseVerificationDate && (
                    <div className="flex">
                      <dt className="w-32 font-medium text-gray-600">Verified On:</dt>
                      <dd>{licenseViewSalon.licenseVerificationDate}</dd>
                    </div>
                  )}
                </dl>
                
                {/* Approval/Rejection Buttons */}
                {(licenseViewSalon.licenseStatus === 'pending' || !licenseViewSalon.licenseStatus || licenseViewSalon.licenseStatus === 'not_submitted') && (
                  <div className="flex flex-col gap-2 pt-4 border-t">
                    <div className="text-sm text-gray-500 mb-2">
                      Approving this license will grant the salon full platform access.
                    </div>
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        if (licenseViewSalon) {
                          verifyLicenseMutation.mutate(licenseViewSalon.id);
                        }
                      }}
                    >
                      Approve License
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="w-full"
                      onClick={() => {
                        if (licenseViewSalon) {
                          rejectLicenseMutation.mutate(licenseViewSalon.id);
                        }
                      }}
                    >
                      Reject License
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Suspend Salon Confirmation */}
      {salonToSuspend && (
        <AlertDialog open={!!salonToSuspend} onOpenChange={(open) => !open && setSalonToSuspend(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Suspend Salon</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to suspend <strong>{salonToSuspend.name}</strong>?
                This will temporarily disable their account access.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                className="bg-orange-500 hover:bg-orange-600"
                onClick={() => {
                  if (salonToSuspend) {
                    suspendSalonMutation.mutate(salonToSuspend.id);
                  }
                }}
              >
                Suspend
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}