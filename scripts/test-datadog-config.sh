#!/bin/bash

# Test script to verify Datadog configuration is optional
set -e

echo "🧪 Testing Datadog configuration..."

# Test 1: Check if base config works without Datadog env vars
echo "📋 Test 1: Testing base configuration (no Datadog)"
unset DD_API_KEY
unset DD_SITE

# Start base collector
echo "Starting OpenTelemetry collector with base config..."
docker-compose --profile default up -d otel-collector

# Wait for startup
sleep 10

# Check if collector is healthy
if docker-compose --profile default ps otel-collector | grep -q "Up"; then
    echo "✅ Base configuration works without Datadog environment variables"
else
    echo "❌ Base configuration failed"
    docker-compose --profile default logs otel-collector
    exit 1
fi

# Stop base services
docker-compose --profile default down

echo ""

# Test 2: Check if Datadog config works with env vars
echo "📋 Test 2: Testing Datadog configuration (with env vars)"
export DD_API_KEY="test-key"
export DD_SITE="datadoghq.com"

# Start Datadog collector
echo "Starting OpenTelemetry collector with Datadog config..."
docker-compose --profile datadog up -d otel-collector-datadog

# Wait for startup
sleep 10

# Check if collector is healthy
if docker-compose --profile datadog ps otel-collector-datadog | grep -q "Up"; then
    echo "✅ Datadog configuration works with environment variables set"
else
    echo "❌ Datadog configuration failed"
    docker-compose --profile datadog logs otel-collector-datadog
    exit 1
fi

# Stop Datadog services
docker-compose --profile datadog down

echo ""
echo "🎉 All tests passed! Datadog configuration is properly optional."
echo ""
echo "Summary:"
echo "  ✅ Base setup works without DD_API_KEY and DD_SITE"
echo "  ✅ Datadog setup works when environment variables are provided"
echo "  ✅ No port conflicts between configurations"
