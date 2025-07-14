
#!/bin/bash

echo "🔄 Restarting VMB Application..."

# Kill any existing server processes
pkill -f "tsx server/index.ts" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true

# Wait a moment for processes to fully terminate
sleep 2

echo "🚀 Starting fresh server instance..."

# Start the development server
npm run dev &

# Wait for server to start
sleep 3

# Run health check
echo "🔍 Running health check..."
node health-check.js

if [ $? -eq 0 ]; then
    echo "✅ Application successfully restarted and verified!"
else
    echo "❌ Health check failed. Please check the server logs."
fi
