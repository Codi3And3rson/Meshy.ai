#!/bin/bash

# start.sh - Launch both backend and frontend

echo "Starting Backend..."
(cd backend && python -m uvicorn main:app --reload --host 127.0.0.1 --port 8010) &
BACKEND_PID=$!

echo "Starting Frontend..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo "Waiting for services to start..."
sleep 5
echo "Services should be accessible at http://localhost:5173"

# Wait for background processes
wait $BACKEND_PID
wait $FRONTEND_PID
