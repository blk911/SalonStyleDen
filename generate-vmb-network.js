/**
 * VMB Network Visualization Generator
 * 
 * This script uses Madge to generate a network map of the application's dependency structure.
 * It outputs a structured visualization of the component relationships.
 */

const madge = require('madge');
const path = require('path');
const fs = require('fs');

// Output file path
const outputPath = path.join(process.cwd(), 'vmb-network.svg');

// Configuration
const config = {
  layout: 'dot', // dot = hierarchical, fdp = force-directed
  fontName: 'Arial',
  fontSize: '12px',
  backgroundColor: '#ffffff',
  nodeColor: '#6a55a5',
  noDependencyColor: '#78c57c',
  cyclicNodeColor: '#ff6666',
  edgeColor: '#666666',
  rankdir: 'TB', // TB = top to bottom, LR = left to right
  includeNpm: false
};

// Entry points to analyze
const entryPoints = [
  './client/src',
  './server',
  './shared'
];

console.log('Starting VMB Network Visualization Analysis...');
console.log(`Using visualization layout: ${config.layout}`);
console.log(`Analyzing entry points:`, entryPoints);

// Run the analysis
madge(entryPoints, {
  fileExtensions: ['js', 'jsx', 'ts', 'tsx'],
  excludeRegExp: [
    /node_modules/,
    /\.(test|spec|e2e)\.(js|jsx|ts|tsx)$/,
    /\.d\.ts$/
  ],
  graphVizOptions: config
}).then((res) => {
  // Check for circular dependencies
  const circular = res.circular();
  if (circular.length) {
    console.log(`Found ${circular.length} circular dependencies:`);
    circular.forEach((path, i) => {
      console.log(`   ${i + 1}. ${path.join(' → ')}`);
    });
  } else {
    console.log('No circular dependencies found.');
  }
  
  // Generate the image
  return res.image(outputPath).then(() => {
    console.log(`Network visualization generated successfully: ${outputPath}`);
    
    // Get stats for the image
    const stats = fs.statSync(outputPath);
    const fileSizeInKB = Math.round(stats.size / 1024);
    console.log(`File size: ${fileSizeInKB} KB`);
    
    // Get module stats
    const modules = res.obj();
    const moduleCount = Object.keys(modules).length;
    const dependencyCount = Object.values(modules).reduce((acc, deps) => acc + deps.length, 0);
    
    console.log(`Total modules: ${moduleCount}`);
    console.log(`Total dependencies: ${dependencyCount}`);
    
    // Find the most dependent-upon modules
    const dependedUpon = {};
    Object.entries(modules).forEach(([module, dependencies]) => {
      dependencies.forEach(dep => {
        dependedUpon[dep] = (dependedUpon[dep] || 0) + 1;
      });
    });
    
    const topDependedUpon = Object.entries(dependedUpon)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    console.log('\nTop 10 most used modules:');
    topDependedUpon.forEach(([module, count], index) => {
      console.log(`${index + 1}. ${module} (used by ${count} modules)`);
    });
    
    // Components by category
    const components = Object.keys(modules)
      .filter(m => m.includes('/components/'));
    const pages = Object.keys(modules)
      .filter(m => m.includes('/pages/'));
    const hooks = Object.keys(modules)
      .filter(m => m.includes('/hooks/'));
    const contexts = Object.keys(modules)
      .filter(m => m.includes('/contexts/'));
    
    console.log(`\nComponent counts by category:`);
    console.log(`- Components: ${components.length}`);
    console.log(`- Pages: ${pages.length}`);
    console.log(`- Hooks: ${hooks.length}`);
    console.log(`- Contexts: ${contexts.length}`);
  });
}).catch(err => {
  console.error('Error generating network visualization:', err);
});