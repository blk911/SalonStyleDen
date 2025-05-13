import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { StyleOptionSelector } from '../services/StyleOptionSelector';
import { apiRequest } from '@/lib/queryClient';
import { useNavigate } from 'wouter';

interface StyleOption {
  id: number;
  name: string;
  description: string;
  price: number;
  duration: number;
  imageUrl?: string;
}

export const GiftCreationFlow: React.FC = () => {
  const [step, setStep] = useState(1);
  const [selectedStyle, setSelectedStyle] = useState<StyleOption | null>(null);
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleStyleSelect = (style: StyleOption) => {
    setSelectedStyle(style);
  };

  const handleNext = () => {
    if (step === 1 && !selectedStyle) {
      toast({
        title: 'Style Required',
        description: 'Please select a style option to continue',
        variant: 'destructive',
      });
      return;
    }
    
    if (step === 2 && !recipientPhone) {
      toast({
        title: 'Phone Required',
        description: 'Please enter a recipient phone number',
        variant: 'destructive',
      });
      return;
    }
    
    setStep(prev => prev + 1);
  };

  const handlePrevious = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!selectedStyle || !recipientPhone) {
      toast({
        title: 'Missing Information',
        description: 'Please complete all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const response = await apiRequest('/api/gifts', {
        method: 'POST',
        data: {
          recipientPhone,
          recipientName,
          styleId: selectedStyle.id,
          styleName: selectedStyle.name,
          amount: selectedStyle.price * 100, // Convert to cents
          message,
          giftType: 'style_card',
        },
      });

      toast({
        title: 'Gift Created',
        description: 'Your gift has been sent successfully!',
      });
      
      // Navigate back to dashboard or gift confirmation
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Error creating gift:', error);
      toast({
        title: 'Error',
        description: 'Failed to create gift. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto overflow-hidden shadow-lg">
      <CardHeader className="bg-pink-50">
        <CardTitle className="text-2xl text-center text-pink-700">Create Gift Request</CardTitle>
        <CardDescription className="text-center">
          Send a gift request for nail services
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* Step indicator */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                  s === step 
                    ? 'bg-pink-500 text-white' 
                    : s < step 
                      ? 'bg-pink-200 text-pink-700' 
                      : 'bg-gray-200 text-gray-500'
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div 
                  className={`h-0.5 w-10 ${
                    s < step ? 'bg-pink-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        
        {/* Step 1: Select Style Option */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Select a Style</h3>
            <p className="text-sm text-gray-500 mb-4">
              Choose the style you'd like to gift
            </p>
            
            <StyleOptionSelector 
              onSelectStyle={handleStyleSelect}
              selectedStyleId={selectedStyle?.id}
              className="mt-4"
            />
            
            {selectedStyle && (
              <div className="mt-4 p-4 bg-pink-50 rounded-md">
                <h4 className="font-medium">Selected Style:</h4>
                <p className="font-semibold">{selectedStyle.name} - ${selectedStyle.price}</p>
                <p className="text-sm text-gray-500">{selectedStyle.description}</p>
              </div>
            )}
          </div>
        )}
        
        {/* Step 2: Recipient Information */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Recipient Information</h3>
            <p className="text-sm text-gray-500 mb-4">
              Enter the details of the person you're gifting to
            </p>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recipientPhone">Phone Number (required)</Label>
                <Input 
                  id="recipientPhone"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="recipientName">Recipient Name (optional)</Label>
                <Input 
                  id="recipientName"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Enter recipient's name"
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Step 3: Message and Review */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Add a Personal Message</h3>
            <p className="text-sm text-gray-500 mb-4">
              Write a message to include with your gift
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="message">Message (optional)</Label>
              <Textarea 
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write a personal message here..."
                className="h-32"
              />
            </div>
            
            <div className="mt-6 p-4 bg-pink-50 rounded-md">
              <h3 className="font-semibold mb-2">Gift Summary</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-500">Style:</span>
                <span className="font-medium">{selectedStyle?.name}</span>
                
                <span className="text-gray-500">Price:</span>
                <span className="font-medium">${selectedStyle?.price}</span>
                
                <span className="text-gray-500">Recipient:</span>
                <span className="font-medium">{recipientName || 'Not specified'}</span>
                
                <span className="text-gray-500">Phone:</span>
                <span className="font-medium">{recipientPhone}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between p-6 bg-gray-50">
        <Button
          variant="outline"
          onClick={step === 1 ? () => navigate('/dashboard') : handlePrevious}
        >
          {step === 1 ? 'Cancel' : 'Back'}
        </Button>
        
        <Button
          onClick={step === 3 ? handleSubmit : handleNext}
          disabled={isSubmitting}
          className="bg-pink-500 hover:bg-pink-600 text-white"
        >
          {step === 3 ? 'Send Gift' : 'Continue'}
        </Button>
      </CardFooter>
    </Card>
  );
};