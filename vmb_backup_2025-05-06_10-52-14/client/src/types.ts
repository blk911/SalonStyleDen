// Common types used across the application

export interface User {
  id: number;
  username: string;
  createdAt: string;
}

export interface Salon {
  id: number;
  name: string;
  ownerName: string;
  phone: string;
  email: string;
  socialMedia?: Array<{ platform: string; handle: string }>;
  type: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  services?: any[];
  promos?: any[];
  schedule?: any[];
  ownerPhotoUrl?: string;
  licenseName?: string;
  licenseNumber?: string;
  licenseState?: string;
  licenseVerified?: boolean;
  licenseStatus?: string;
  sponsor?: string;
  sponsorId?: number;
  createdAt: string;
}

export interface Client {
  id: number;
  name: string;
  phone: string;
  email?: string;
  isCurrentClient: boolean;
  acceptedTerms?: boolean;
  profilePromptShown?: boolean;
  notes?: string;
  favoriteServices?: string[];
  salonId?: number;
  salonName?: string;
  sponsor?: string;
  sponsorName?: string;
  sponsorSalonId?: number;
  type: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  socialMedia?: Array<{ platform: string; handle: string }>;
  photoUrl?: string;
  createdAt: string;
}

export interface Invitation {
  id: number;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  message?: string;
  type?: string;
  favoriteServices?: string[];
  salonId?: number;
  salonName?: string;
  senderId?: number;
  sponsor?: string;
  inviteHash?: string;
  status: string;
  firstServiceDate?: string;
  styleOption?: string;
  stylePrice?: number;
  styleDuration?: number;
  createdAt: string;
}

export interface StyleSelection {
  id: number;
  clientId: number;
  styleId: number;
  salonId: number;
  selectedAt: string;
  status: string;
}

export interface ActivityLog {
  id: number;
  type: string;
  description: string;
  userId?: number;
  salonId?: number;
  clientId?: number;
  timestamp: string;
}

export interface Appointment {
  id: number;
  clientId: number;
  salonId: number;
  invitationId?: number;
  serviceDate: string;
  serviceTime: string;
  status: string;
  notes?: string;
  createdAt: string;
  // Additional fields when joined with salon/client data
  salonName?: string;
  clientName?: string;
  clientPhone?: string;
  styleName?: string;
  stylePrice?: number;
  styleDuration?: number;
}