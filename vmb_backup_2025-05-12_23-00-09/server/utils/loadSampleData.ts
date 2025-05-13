/**
 * Script to load sample data into the database
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { importSalons, importClients } from './importData.js';

// Get the directory name (ES modules version of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function loadSampleData() {
  try {
    console.log('Loading sample data...');
    
    // Load sample salons
    const salonsPath = path.join(__dirname, 'sampleSalons.json');
    const salonsData = JSON.parse(fs.readFileSync(salonsPath, 'utf8'));
    console.log(`Found ${salonsData.length} sample salons`);
    
    // Import salons
    const importedSalons = await importSalons(salonsData);
    console.log(`Successfully imported ${importedSalons.length} salons`);
    
    // Load sample clients
    const clientsPath = path.join(__dirname, 'sampleClients.json');
    const clientsData = JSON.parse(fs.readFileSync(clientsPath, 'utf8'));
    console.log(`Found ${clientsData.length} sample clients`);
    
    // Import clients
    const importedClients = await importClients(clientsData);
    console.log(`Successfully imported ${importedClients.length} clients`);
    
    console.log('Sample data loading complete!');
    return { salons: importedSalons, clients: importedClients };
    
  } catch (error) {
    console.error('Error loading sample data:', error);
    throw error;
  }
}

// Run the function directly
loadSampleData()
  .then(() => console.log('Sample data loaded successfully'))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });

export default loadSampleData;