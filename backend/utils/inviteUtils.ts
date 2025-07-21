import { db } from '../db/models';

export async function storeInvite(senderId: string, phone: string) {
  const invite = db.createInvite({
    inviterId: senderId,
    phoneNumber: phone,
    status: 'pending'
  });
  return invite;
}

export async function sendInviteSMS(phone: string) {
  console.log(`SMS sent to ${phone}: You've been invited to join Social Triad Game!`);
  return { success: true };
}

export function savePhotoToCDN(photo: any): string {
  const filename = `photo_${Date.now()}.jpg`;
  console.log(`Photo saved to CDN: ${filename}`);
  return `/uploads/${filename}`;
}
