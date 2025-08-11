#!/bin/bash

echo "Stopping LocalStack environment..."

# Stop LocalStack containers
docker compose down

echo "LocalStack environment stopped."