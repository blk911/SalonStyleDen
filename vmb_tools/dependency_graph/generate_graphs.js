// VMB Dependency Graph Generator
const madge = require('madge');
const path = require('path');
const fs = require('fs');

// Ensure the output directory exists
const outputDir = path.join(__dirname, 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Configuration for different components to analyze
const componentsToAnalyze = [
  {
    name: 'client_dashboard',
    entry: '../client/src/pages/ClientDashboard.tsx',
    title: 'Client Dashboard Dependencies'
  },
  {
    name: 'salon_dashboard',
    entry: '../client/src/pages/SalonDashboard.tsx',
    title: 'Salon Dashboard Dependencies'
  },
  {
    name: 'invitation_flow',
    entry: '../client/src/components/invitations/RenderedInvitation.tsx',
    title: 'Invitation Flow Dependencies'
  },
  {
    name: 'app_routes',
    entry: '../client/src/App.tsx',
    title: 'Application Routes'
  }
];

// Generate the graph for each component
async function generateDependencyGraphs() {
  console.log('🔍 Generating VMB dependency graphs...');
  
  for (const component of componentsToAnalyze) {
    try {
      console.log(`📊 Processing ${component.name}...`);
      
      const entryPath = path.resolve(__dirname, component.entry);
      const outputPath = path.join(outputDir, `${component.name}_dependencies.svg`);
      
      // Generate the dependency graph visualization
      const result = await madge(entryPath, {
        baseDir: path.resolve(__dirname, '../'),
        includeNpm: false,
        fileExtensions: ['js', 'jsx', 'ts', 'tsx'],
        graphVizOptions: {
          G: {
            rankdir: 'LR',
            labelloc: 't',
            label: component.title
          }
        }
      });
      
      // Create the image
      await result.svg().then(output => {
        fs.writeFileSync(outputPath, output);
        console.log(`✅ Generated ${outputPath}`);
      });
      
      // Also create a JSON file for the dependency data
      const jsonPath = path.join(outputDir, `${component.name}_dependencies.json`);
      fs.writeFileSync(jsonPath, JSON.stringify(result.obj(), null, 2));
      console.log(`💾 Saved dependency data to ${jsonPath}`);
      
    } catch (error) {
      console.error(`❌ Error generating graph for ${component.name}:`, error);
    }
  }
  
  console.log('✨ All dependency graphs generated!');
  console.log(`📁 Output directory: ${outputDir}`);
}

// Generate a summary file with timestamps
function generateSummary() {
  const summaryPath = path.join(outputDir, 'graph_summary.json');
  const summary = {
    generated: new Date().toISOString(),
    components: componentsToAnalyze.map(c => c.name),
    files: fs.readdirSync(outputDir).filter(f => f !== 'graph_summary.json')
  };
  
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`📝 Generated summary at ${summaryPath}`);
}

// Run the main function
generateDependencyGraphs()
  .then(() => {
    generateSummary();
  })
  .catch(err => {
    console.error('Failed to generate dependency graphs:', err);
  });