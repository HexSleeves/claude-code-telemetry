#!/bin/bash

# Setup script for Claude Code telemetry with Grafana
set -e

echo "🚀 Setting up Claude Code telemetry with Grafana..."

# Set Claude Code environment variables
export CLAUDE_CODE_ENABLE_TELEMETRY=1
export OTEL_METRICS_EXPORTER=otlp
export OTEL_EXPORTER_OTLP_PROTOCOL=grpc
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
export OTEL_METRIC_EXPORT_INTERVAL=30000 # 30 seconds for testing

echo "✅ Set Claude Code environment variables"

# Add environment variables to shell profile (for both bash and zsh)
if [[ "$SHELL" == *"zsh"* ]]; then
    PROFILE_FILE="$HOME/.zshrc"
else
    PROFILE_FILE="$HOME/.bashrc"
fi

echo "# Claude Code Telemetry" >>"$PROFILE_FILE"
echo "export CLAUDE_CODE_ENABLE_TELEMETRY=1" >>"$PROFILE_FILE"
echo "export OTEL_METRICS_EXPORTER=otlp" >>"$PROFILE_FILE"
echo "export OTEL_EXPORTER_OTLP_PROTOCOL=grpc" >>"$PROFILE_FILE"
echo "export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317" >>"$PROFILE_FILE"
echo "export OTEL_METRIC_EXPORT_INTERVAL=30000" >>"$PROFILE_FILE"

echo "✅ Added environment variables to $PROFILE_FILE"

# Start the services
echo "🐳 Starting services with Docker Compose..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30
echo "🎉 Setup complete!"
echo ""
echo "Services are now running:"
echo "  📊 Grafana: http://localhost:3000 (admin/admin)"
echo "  📈 Prometheus: http://localhost:9090"
echo "  🔧 OpenTelemetry Collector: localhost:4317 (gRPC), localhost:4318 (HTTP)"
echo ""
echo "To test the setup:"
echo "1. Run some Claude Code commands"
echo "2. Check Prometheus targets: http://localhost:9090/targets"
echo "3. View metrics in Grafana: http://localhost:3000"
echo ""
echo "Environment variables have been added to $PROFILE_FILE"
echo "Run 'source $PROFILE_FILE' or restart your terminal to apply them."
echo ""
echo "📋 Quick Commands:"
echo "  docker-compose logs -f          # View all logs"
echo "  docker-compose down             # Stop all services"
echo "  docker-compose up -d            # Start services again"
