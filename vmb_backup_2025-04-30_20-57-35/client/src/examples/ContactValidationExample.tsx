import { useState } from 'react';
import { useContactValidation } from '@/hooks/use-contact-validation';
import { ContactValidationDialog } from '@/components/ui/ContactValidationDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { formatPhoneNumber } from '@/lib/utils';

/**
 * Example component showcasing the contact validation system
 * This can be used as a reference for implementing validation in other parts of the app
 */
export function ContactValidationExample() {
  // State for contact input
  const [contact, setContact] = useState('');
  
  // State for dialog visibility
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Use the validation hook
  const {
    validationResult,
    validateContact,
    isValidating,
    validatedContactType,
    resetValidation
  } = useContactValidation();
  
  // Format phone numbers as they're typed
  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // If it looks like a phone number, format it
    if (value.match(/^[\d\(\)\s\-\+]+$/)) {
      setContact(formatPhoneNumber(value));
    } else {
      // Otherwise just set it as is (could be email)
      setContact(value);
    }
  };
  
  // Validate the contact and show dialog
  const handleValidate = async () => {
    await validateContact(contact);
    setDialogOpen(true);
  };
  
  // Clear the form and reset validation
  const handleClear = () => {
    setContact('');
    resetValidation();
    setDialogOpen(false);
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Contact Validation Demo</CardTitle>
        <CardDescription>
          Test the contact validation system with email or phone
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="contact" className="text-sm font-medium">
              Contact Information (Email or Phone)
            </label>
            <Input
              id="contact"
              placeholder="Enter email or phone number"
              value={contact}
              onChange={handleContactChange}
            />
            <p className="text-xs text-muted-foreground">
              Try with test contacts: (496) 464-9849 or rand@gma.com
            </p>
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={isValidating}
            >
              Clear
            </Button>
            
            <Button
              onClick={handleValidate}
              className="bg-green-200 hover:bg-green-300 text-green-800"
              disabled={isValidating || !contact}
            >
              {isValidating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Validating...
                </>
              ) : (
                "Ven Me, Baby!"
              )}
            </Button>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex-col items-start gap-2">
        <div className="text-sm font-medium">Status:</div>
        {validationResult && (
          <div className={`text-sm w-full p-2 rounded ${
            validationResult === 'registered' ? 'bg-green-50 text-green-700' : 
            validationResult === 'not_registered' ? 'bg-amber-50 text-amber-700' :
            validationResult === 'invalid' ? 'bg-red-50 text-red-700' :
            'bg-gray-50 text-gray-700'
          }`}>
            {validationResult === 'loading' && 'Validating...'}
            {validationResult === 'registered' && 'Contact is registered in the database (IN DB)'}
            {validationResult === 'not_registered' && 'Contact is not registered in the database'}
            {validationResult === 'invalid' && 'Invalid contact format'}
          </div>
        )}
      </CardFooter>
      
      {/* Validation Dialog */}
      <ContactValidationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        validationResult={validationResult}
        contactType={validatedContactType}
        contactValue={contact}
      />
    </Card>
  );
}