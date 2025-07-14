
#!/usr/bin/env node

/**
 * VMB Health Check Script
 * Verifies that the server is running and the app loads properly
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000';
const HEALTH_ENDPOINTS = [
  '/api/health',
  '/api/status',
  '/'
];

async function checkEndpoint(path) {
  return new Promise((resolve) => {
    const req = http.get(`${BASE_URL}${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          path,
          status: res.statusCode,
          success: res.statusCode >= 200 && res.statusCode < 400,
          data: data.slice(0, 100) // First 100 chars
        });
      });
    });
    
    req.on('error', (err) => {
      resolve({
        path,
        status: 0,
        success: false,
        error: err.message
      });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        path,
        status: 0,
        success: false,
        error: 'Timeout'
      });
    });
  });
}

async function runHealthCheck() {
  console.log('🔍 VMB Health Check Starting...');
  console.log('================================');
  
  const results = [];
  
  for (const endpoint of HEALTH_ENDPOINTS) {
    console.log(`Checking ${endpoint}...`);
    const result = await checkEndpoint(endpoint);
    results.push(result);
    
    if (result.success) {
      console.log(`✅ ${endpoint} - Status: ${result.status}`);
    } else {
      console.log(`❌ ${endpoint} - Error: ${result.error || 'HTTP ' + result.status}`);
    }
  }
  
  console.log('\n================================');
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  if (successCount === totalCount) {
    console.log('🎉 All health checks passed! Server is running properly.');
    process.exit(0);
  } else {
    console.log(`⚠️  ${successCount}/${totalCount} health checks passed. Server may have issues.`);
    process.exit(1);
  }
}

runHealthCheck();
