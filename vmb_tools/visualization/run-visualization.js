/**
 * Run the VMB Network Visualization Generator
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Ensure visualizations directory exists
const visualizationsDir = path.join(process.cwd(), 'visualizations');
if (!fs.existsSync(visualizationsDir)) {
  fs.mkdirSync(visualizationsDir, { recursive: true });
  console.log(`Created visualizations directory at ${visualizationsDir}`);
}

console.log('Running VMB Network Visualization...');

// Run with different layouts
const layouts = ['dot', 'fdp', 'twopi'];
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

layouts.forEach(layout => {
  const outputFile = path.join(visualizationsDir, `vmb-network-${layout}-${timestamp}.svg`);
  
  console.log(`\nGenerating visualization with layout: ${layout}`);
  console.log(`Output file: ${outputFile}`);
  
  try {
    // Configure the command
    const excludePattern = 'node_modules';
    const cmd = `node ./node_modules/.bin/madge --exclude="${excludePattern}" --image="${outputFile}" --layout="${layout}" ./client/src`;
    
    console.log(`Executing: ${cmd}`);
    
    // Execute the command
    const output = execSync(cmd, { encoding: 'utf8' });
    
    console.log(output);
    console.log(`Successfully generated ${layout} visualization`);
    
    // Check if the file was created
    if (fs.existsSync(outputFile)) {
      const stats = fs.statSync(outputFile);
      console.log(`File size: ${Math.round(stats.size / 1024)} KB`);
    } else {
      console.error(`Error: Output file was not created: ${outputFile}`);
    }
  } catch (error) {
    console.error(`Error generating ${layout} visualization:`, error.message);
  }
});

console.log('\nNetwork visualizations complete!');
console.log(`All visualization files are available in the "${visualizationsDir}" directory.`);