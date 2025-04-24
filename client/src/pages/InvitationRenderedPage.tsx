import React from 'react';
import { RenderedInvitation } from '@/components/invitations/RenderedInvitation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function InvitationRenderedPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold text-center mb-6">Your Invitation</h1>
        
        <RenderedInvitation 
          recipientName="Jane"
          styleOption="Gel Manicure"
          priceAndTime="$55, Friday at 2pm"
          signature="Sarah"
          inviteId="82F7J5"
          onVenSelected={() => console.log('Ven selected')}
          onCashAppSelected={() => console.log('CashApp selected')}
          onZelleSelected={() => console.log('Zelle selected')}
          onPass={() => console.log('Pass selected')}
          onDecline={() => console.log('Decline selected')}
        />
      </main>
      
      <Footer />
    </div>
  );
}