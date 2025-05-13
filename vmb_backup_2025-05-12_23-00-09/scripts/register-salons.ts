import { db } from '../server/db';
import { salons } from '../shared/schema';

// Function to register a new salon
async function registerSalon(salonData: any) {
  try {
    const [salon] = await db.insert(salons)
      .values({
        name: salonData.name,
        ownerName: salonData.ownerName || salonData.name.split(' ')[0], // Use first word of name as owner name if not provided
        phone: salonData.phone,
        email: salonData.email || '',
        address: salonData.address || null,
        city: salonData.city || null,
        state: salonData.state || null,
        zipCode: salonData.zipCode || null,
        type: "salon",
        sponsor: "VMB, LTD",
        sponsorId: 105, // VMB, LTD's salon ID
        socialMedia: salonData.website 
          ? JSON.stringify([{ platform: 'website', handle: salonData.website }]) 
          : null
      })
      .returning();
    
    console.log(`✅ Successfully registered salon: ${salonData.name} with ID: ${salon.id}`);
    return salon;
  } catch (error) {
    console.error(`❌ Failed to register salon: ${salonData.name}`, error);
    throw error;
  }
}

// List of salons to register
const salonsToRegister = [
  {
    name: "Tip To Toe Nails",
    address: "8775 E Orchard Rd, Suite 816",
    city: "Greenwood Village",
    state: "CO",
    zipCode: "80111",
    phone: "303-221-9130",
    email: "tiptotoenailsdtc@gmail.com",
    website: "https://www.tiptotoenailsdtc.com"
  },
  {
    name: "In Style Nails",
    address: "8860 Maximus Dr",
    city: "Lone Tree",
    state: "CO",
    zipCode: "80124",
    phone: "303-662-8063",
    website: "http://instylenails-hub.com"
  },
  {
    name: "Luxury Nails",
    address: "324 St Paul St",
    city: "Denver",
    state: "CO",
    zipCode: "80206",
    phone: "303-321-4720",
    website: "https://cherrycreeknorth.com/go/luxury-nails"
  },
  {
    name: "Cherry Creek Nail Spa",
    address: "2700 E 6th Ave, Unit A",
    city: "Denver",
    state: "CO",
    zipCode: "80206",
    phone: "303-321-0655",
    email: "hello@cherrycreeknailspa.com",
    website: "https://cherrycreeknailspa.com"
  },
  {
    name: "Pearl Nail Bar",
    address: "4955 S Ulster St, Suite 105",
    city: "Denver",
    state: "CO",
    zipCode: "80237",
    phone: "303-694-6245",
    website: "https://www.pearlnailbar.com"
  },
  {
    name: "Shine Nail Spa",
    address: "6901 S Yosemite St, Suite 204",
    city: "Centennial",
    state: "CO",
    zipCode: "80112",
    phone: "303-771-0063",
    website: "https://www.shinenailspaandlounge.com"
  },
  {
    name: "5280 Beauty Bar",
    address: "9580 Ridgegate Pkwy, Suite B",
    city: "Lone Tree",
    state: "CO",
    zipCode: "80124",
    phone: "303-790-2000",
    email: "info@5280beautybar.com",
    website: "https://www.5280beautybar.com"
  },
  {
    name: "Beyond Nails",
    address: "9623 E County Line Rd, Unit E",
    city: "Englewood",
    state: "CO",
    zipCode: "80112",
    phone: "303-799-6592",
    website: "https://beyondnails.co"
  },
  {
    name: "Magic Nails & Lash",
    address: "10005 Commons St, Unit 270",
    city: "Lone Tree",
    state: "CO",
    zipCode: "80124",
    phone: "303-708-8985",
    website: "https://magicnailslonetree.com"
  },
  {
    name: "I Capelli Salon",
    address: "5123 S Yosemite St",
    city: "Greenwood Village",
    state: "CO",
    zipCode: "80111",
    phone: "303-773-3315",
    website: "http://www.icapellisalon.com"
  }
];

// Main function to register all salons
async function registerAllSalons() {
  console.log('Starting registration of salons...');
  
  try {
    for (const salonData of salonsToRegister) {
      await registerSalon(salonData);
    }
    console.log('All salons registered successfully!');
  } catch (error) {
    console.error('Error during salon registration process:', error);
  } finally {
    process.exit(0);
  }
}

// Run the registration
registerAllSalons();