/**
 * Shared invitation types to ensure consistency across components
 */

export interface Invitation {
  id: number;
  name: string;
  phone: string;
  email: string;
  notes?: string;
  status: string | undefined;
  createdAt: string;
  inviteHash?: string;
  firstServiceDate?: string;
  favoriteServices: string[];
  salonId?: number;
  salonName?: string;
  sponsor?: string;
}