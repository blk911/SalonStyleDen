/**
 * VMB Network Visualization Generator
 * 
 * This script uses Madge and Graphviz to generate a clean, scalable
 * visualization of the application's component dependencies.
 * 
 * Usage: node generate-network-map.js [--layout=dot|fdp|twopi|circo] [--format=svg|png] [--depth=N]
 * 
 * Options:
 *  --layout: The graphviz layout algorithm to use (default: dot)
 *  --format: Output format (default: svg)
 *  --depth: Maximum dependency depth to show (default: 15)
 *  --focus: Focus on a specific directory (e.g., "client/src/components")
 */

const madge = require('madge');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  layout: 'dot',
  format: 'svg',
  depth: 15,
  focus: null
};

args.forEach(arg => {
  if (arg.startsWith('--layout=')) options.layout = arg.split('=')[1];
  if (arg.startsWith('--format=')) options.format = arg.split('=')[1];
  if (arg.startsWith('--depth=')) options.depth = parseInt(arg.split('=')[1]);
  if (arg.startsWith('--focus=')) options.focus = arg.split('=')[1];
});

// Define visualization options
const visualizationOptions = {
  layout: options.layout,
  fontName: 'Arial',
  fontSize: '10px',
  backgroundColor: '#f5f5f5',
  nodeColor: '#71639e',
  noDependencyColor: '#6abe83',
  cyclicNodeColor: '#ff6c6c',
  edgeColor: '#757575',
  rankdir: 'TB', // Top to bottom layout
  includeNpm: false,
  imageFormat: options.format
};

// Entry points for analysis
const entryPoints = options.focus ? 
  path.resolve(options.focus) : 
  [
    './client/src',
    './server',
    './shared'
  ];

console.log(`🔍 Analyzing dependencies with Madge...`);
console.log(`📊 Visualization options:`, 
  `Layout: ${options.layout}`,
  `Format: ${options.format}`,
  `Depth: ${options.depth}`,
  `Focus: ${options.focus || 'All'}`
);

// Generate the dependency graph
madge(entryPoints, {
  fileExtensions: ['js', 'jsx', 'ts', 'tsx'],
  excludeRegExp: [
    /node_modules/,
    /\.(test|spec|e2e)\.(js|jsx|ts|tsx)$/,
    /\.d\.ts$/
  ],
  graphVizOptions: visualizationOptions
}).then((res) => {
  console.log(`✅ Dependency analysis complete!`);
  console.log(`📊 Found ${Object.keys(res.obj()).length} modules`);
  
  // Check for circular dependencies
  const circular = res.circular();
  if (circular.length) {
    console.log(`⚠️ Found ${circular.length} circular dependencies:`);
    circular.forEach((path, i) => {
      console.log(`   ${i + 1}. ${path.join(' → ')}`);
    });
  }
  
  // Generate the dependency graph image
  const outputFile = `vmb-network-map-${new Date().toISOString().slice(0, 10)}.${options.format}`;
  console.log(`🖼️ Generating ${options.format.toUpperCase()} visualization...`);
  
  res.image(outputFile)
    .then(() => {
      console.log(`✨ Visualization complete! Output saved to: ${outputFile}`);
    })
    .catch(err => {
      console.error('Error generating visualization:', err);
    });
})
.catch(err => {
  console.error('Error analyzing dependencies:', err);
});