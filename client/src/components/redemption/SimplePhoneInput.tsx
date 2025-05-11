import React, { useState, useRef, useEffect } from 'react';
import { Input, InputProps } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatPhoneNumber, cleanPhoneNumber, isValidPhone } from '@/lib/utils';

interface SimplePhoneInputProps extends Omit<InputProps, 'onChange'> {
  name: string;
  label?: string;
  description?: string;
  onChange: (isValid: boolean, phoneValue?: string) => void;
  initialValue?: string;
}

export function SimplePhoneInput({
  name,
  label,
  description,
  onChange,
  initialValue = '',
  ...props
}: SimplePhoneInputProps) {
  const [value, setValue] = useState(initialValue);
  const [touched, setTouched] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Format the phone number as user types
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatPhoneNumber(e.target.value);
    setValue(formattedValue);
    
    // Validate on every change
    const isValid = isValidPhone(formattedValue);
    onChange(isValid, formattedValue);
  };

  // Handle validation when focus is lost
  const handleBlur = () => {
    setFocused(false);
    setTouched(true);
    
    // Validate on blur
    const isValid = isValidPhone(value);
    onChange(isValid, value);
  };

  // Set focus to the input on mount if autofocus is true
  useEffect(() => {
    if (props.autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [props.autoFocus]);

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={name}>{label}</Label>
      )}
      
      <Input
        ref={inputRef}
        id={name}
        name={name}
        value={value}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={handleBlur}
        className={`${touched && !isValidPhone(value) && !focused ? 'border-red-500' : ''}`}
        {...props}
      />
      
      {description && (
        <p className="text-sm text-gray-500">{description}</p>
      )}
      
      {touched && !isValidPhone(value) && !focused && (
        <p className="text-red-500 text-sm mt-1">
          Please enter a valid 10-digit phone number
        </p>
      )}
    </div>
  );
}