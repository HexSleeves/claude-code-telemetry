#!/bin/bash

# Test script for Claude Code telemetry setup
set -e

echo "🧪 Testing Claude Code Telemetry Setup..."
echo "========================================"

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "✅ Docker is running"

# Check if services are up
echo "🔍 Checking services..."

# Check OpenTelemetry Collector
if curl -s http://localhost:8889/metrics >/dev/null 2>&1; then
    echo "✅ OpenTelemetry Collector is running (port 8889)"
else
    echo "❌ OpenTelemetry Collector is not responding on port 8889"
fi

# Check Prometheus
if curl -s http://localhost:9090 >/dev/null 2>&1; then
    echo "✅ Prometheus is running (port 9090)"
else
    echo "❌ Prometheus is not responding on port 9090"
fi

# Check Grafana
if curl -s http://localhost:3000 >/dev/null 2>&1; then
    echo "✅ Grafana is running (port 3000)"
else
    echo "❌ Grafana is not responding on port 3000"
fi

# Check environment variables
echo ""
echo "🔧 Checking Claude Code environment variables..."

if [ "$CLAUDE_CODE_ENABLE_TELEMETRY" = "1" ]; then
    echo "✅ CLAUDE_CODE_ENABLE_TELEMETRY is set"
else
    echo "⚠️  CLAUDE_CODE_ENABLE_TELEMETRY is not set. Run: export CLAUDE_CODE_ENABLE_TELEMETRY=1"
fi

if [ "$OTEL_METRICS_EXPORTER" = "otlp" ]; then
    echo "✅ OTEL_METRICS_EXPORTER is set to 'otlp'"
else
    echo "⚠️  OTEL_METRICS_EXPORTER is not set. Run: export OTEL_METRICS_EXPORTER=otlp"
fi

if [ "$OTEL_EXPORTER_OTLP_ENDPOINT" = "http://localhost:4317" ]; then
    echo "✅ OTEL_EXPORTER_OTLP_ENDPOINT is set correctly"
else
    echo "⚠️  OTEL_EXPORTER_OTLP_ENDPOINT is not set. Run: export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317"
fi

echo ""
echo "🎯 Next Steps:"
echo "1. If any environment variables are missing, run 'source ~/.zshrc' or 'source ~/.bashrc'"
echo "2. Run some Claude Code commands to generate telemetry data"
echo "3. Check Prometheus targets: http://localhost:9090/targets"
echo "4. View metrics in Grafana: http://localhost:3000 (admin/admin)"
echo "5. Generate a usage report: npm run monitor"
echo ""
echo "📊 Access URLs:"
echo "  - Grafana: http://localhost:3000"
echo "  - Prometheus: http://localhost:9090"
echo "  - OpenTelemetry metrics: http://localhost:8889/metrics"
