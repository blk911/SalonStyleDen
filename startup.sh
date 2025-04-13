
#!/bin/bash

MAX_RETRIES=5
RETRY_COUNT=0

cleanup_port() {
  pkill -f "tsx server/index.ts"
  sleep 2
}

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  echo "Attempt $(($RETRY_COUNT + 1)) of $MAX_RETRIES"
  
  cleanup_port
  npm run dev &
  
  # Wait for startup
  sleep 5
  
  # Check if service is running
  if curl -s http://0.0.0.0:5000 > /dev/null; then
    echo "Service started successfully!"
    exit 0
  fi
  
  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo "Startup failed, retrying..."
done

echo "Failed to start service after $MAX_RETRIES attempts"
exit 1
