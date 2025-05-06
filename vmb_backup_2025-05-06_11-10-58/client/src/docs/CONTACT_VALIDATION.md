# VMB Contact Validation System

This document provides detailed information about the contact validation system implemented in the Ven Me, Baby! application.

## Overview

The contact validation system provides a standardized way to validate client contact information (phone numbers and email addresses) across the entire application. The system:

1. Validates the format of phone numbers and email addresses
2. Checks if contacts are already registered in the database
3. Provides consistent UI feedback to users
4. Features a "Ven Me, Baby!" button (light green) to trigger validation

## Components

### 1. useContactValidation Hook

Located at `client/src/hooks/use-contact-validation.tsx`, this custom React hook provides a standardized interface for contact validation:

```tsx
const {
  validationResult,   // Current validation result: 'loading' | 'registered' | 'not_registered' | 'invalid' | null
  validateContact,    // Function to validate a contact
  isValidating,       // Boolean indicating if validation is in progress
  validatedContactType, // Type of contact being validated: 'email' | 'phone' | 'unknown'
  resetValidation     // Function to reset validation state
} = useContactValidation();
```

**Usage Example:**

```tsx
import { useContactValidation } from '@/hooks/use-contact-validation';

function ContactForm() {
  const { validateContact, validationResult, isValidating } = useContactValidation();
  const [contact, setContact] = useState('');
  
  const handleValidation = async () => {
    await validateContact(contact);
  };
  
  return (
    <div>
      <input
        type="text"
        value={contact}
        onChange={(e) => setContact(e.target.value)}
        placeholder="Phone or email"
      />
      <button 
        onClick={handleValidation}
        className="bg-green-200 hover:bg-green-300 text-green-800 font-bold py-2 px-4 rounded"
      >
        Ven Me, Baby!
      </button>
      
      {isValidating && <p>Validating...</p>}
      {validationResult === 'registered' && <p>Contact is registered!</p>}
      {validationResult === 'not_registered' && <p>Contact is not registered.</p>}
      {validationResult === 'invalid' && <p>Invalid contact format.</p>}
    </div>
  );
}
```

### 2. ContactValidationDialog Component

Located at `client/src/components/ui/ContactValidationDialog.tsx`, this reusable dialog component displays validation results:

```tsx
<ContactValidationDialog
  open={dialogOpen}
  onOpenChange={setDialogOpen}
  validationResult={validationResult}
  contactType={validatedContactType}
  contactValue={contact}
/>
```

The dialog displays different states:
- **Loading**: Shows a spinner while validation is in progress
- **Registered**: Shows a green confirmation with "IN DB" text
- **Not Registered**: Shows an amber warning
- **Invalid**: Shows a red error message with format instructions

### 3. Utility Functions

Located in `client/src/lib/utils.ts`, these utilities handle contact format validation and API interactions:

- `isValidEmail(email)`: Validates email format
- `isValidPhone(phone)`: Validates phone number format (10 digits for US)
- `cleanPhoneNumber(phone)`: Removes non-digit characters
- `formatPhoneNumber(phone)`: Formats phone as (XXX) XXX-XXXX
- `detectInputType(input)`: Detects if input is phone, email, or unknown
- `validateClientContact(contact)`: Calls the API to validate contact

### 4. Server-Side Validation

The API endpoint `/api/validate-contact` (in `server/routes.ts`) handles validation requests:

```javascript
// Example API request
const response = await fetch('/api/validate-contact', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    phone: '5551234567',  // Either phone or email must be provided
    email: '',
    type: 'client'
  })
});

const result = await response.json();
// result = { exists: true, field: 'phone' }
```

## Implementation Guidelines

### Adding Validation to Forms

1. Import the hook and dialog:
```tsx
import { useContactValidation } from '@/hooks/use-contact-validation';
import { ContactValidationDialog } from '@/components/ui/ContactValidationDialog';
```

2. Use the hook in your component:
```tsx
const {
  validationResult,
  validateContact,
  isValidating,
  validatedContactType,
  resetValidation
} = useContactValidation();
```

3. Add the validation dialog:
```tsx
const [dialogOpen, setDialogOpen] = useState(false);

// Within your component's return statement:
<ContactValidationDialog
  open={dialogOpen}
  onOpenChange={setDialogOpen}
  validationResult={validationResult}
  contactType={validatedContactType}
  contactValue={contact}
/>
```

4. Create a validation handler:
```tsx
const handleValidate = async () => {
  const result = await validateContact(contact);
  setDialogOpen(true);
  return result;
};
```

5. Add a "Ven Me, Baby!" button:
```tsx
<Button
  onClick={handleValidate}
  className="bg-green-200 hover:bg-green-300 text-green-800"
  disabled={isValidating}
>
  {isValidating ? (
    <Loader2 className="h-4 w-4 animate-spin mr-2" />
  ) : null}
  Ven Me, Baby!
</Button>
```

### Testing the Validation

For testing purposes, the system recognizes these test contacts as "registered":
- Phone: (496) 464-9849
- Email: rand@gma.com
- Phone: (464) 564-5646
- Email: tom@mail.com

## Best Practices

1. **Consistent Button Styling**: Always use light green for "Ven Me, Baby!" validation buttons
2. **Appropriate Feedback**: Show feedback using the `ContactValidationDialog` component
3. **Error Handling**: Always handle validation errors and provide user feedback
4. **Format Consistency**: Use the utility functions for formatting and validation
5. **Reset Validation**: Call `resetValidation()` when forms are cleared or reset

## Troubleshooting

Common issues:

1. **Validation Always Returns "Not Registered"**:
   - Check server connection
   - Ensure proper API endpoint is being called
   - Verify database connection

2. **Format Validation Issues**:
   - For phone numbers, ensure 10 digits (US format)
   - For emails, ensure proper format with @ symbol and domain

3. **Dialog Not Showing**:
   - Ensure `dialogOpen` state is being properly set
   - Check that validation result is being passed correctly

## Future Enhancements

Planned enhancements for the validation system:

1. Support for international phone formats
2. Enhanced validation rules for different contexts
3. Batch validation capability
4. Integration with invitation workflow for more contextual validation