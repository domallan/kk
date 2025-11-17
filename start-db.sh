#!/bin/bash

# Start the PostgreSQL database container
echo "Starting PostgreSQL database container..."
docker-compose up -d

echo "Waiting for database to be ready..."
sleep 5

# Check if container is running
if docker ps | grep -q kk_postgres; then
    echo "✓ Database container is running"
    echo ""
    echo "To check logs: docker-compose logs -f"
    echo "To stop: docker-compose down"
    echo ""
    echo "Database will be ready in about 10-15 seconds."
    echo "Then you can start the server with: node server.js"
else
    echo "✗ Failed to start database container"
    echo "Check logs with: docker-compose logs"
    exit 1
fi

