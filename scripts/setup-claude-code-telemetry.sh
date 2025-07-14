#!/bin/bash

# Setup script for Claude Code telemetry with Grafana
set -e

echo "🚀 Setting up Claude Code telemetry with Grafana..."

# Set Claude Code environment variables
export CLAUDE_CODE_ENABLE_TELEMETRY=1
export OTEL_METRICS_EXPORTER=otlp
export OTEL_EXPORTER_OTLP_PROTOCOL=grpc
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
export OTEL_METRIC_EXPORT_INTERVAL=10000 # 10 seconds as per documentation

echo "✅ Set Claude Code environment variables"

# Add environment variables to shell profile (for both bash and zsh)
if [[ "$SHELL" == *"zsh"* ]]; then
    PROFILE_FILE="$HOME/.zshrc"
elif [[ "$SHELL" == *"fish"* ]]; then
    PROFILE_FILE="$HOME/.config/fish/config.fish"
else
    PROFILE_FILE="$HOME/.bashrc"
fi

# Ask the user if they want to add the environment variables to the profile file
read -p "Do you want to add the environment variables to the profile file? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    {
        echo "# Claude Code Telemetry"
        echo "export CLAUDE_CODE_ENABLE_TELEMETRY=1"
        echo "export OTEL_METRICS_EXPORTER=otlp"
        echo "export OTEL_EXPORTER_OTLP_PROTOCOL=grpc"
        echo "export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317"
        echo "export OTEL_METRIC_EXPORT_INTERVAL=10000"
    } >>"$PROFILE_FILE"
fi

echo "✅ Added environment variables to $PROFILE_FILE"

# Start the services
echo "🐳 Starting services with Docker Compose..."
docker-compose --profile default up -d

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
echo "  docker-compose --profile default logs -f          # View all logs"
echo "  docker-compose --profile default down             # Stop all services"
echo "  docker-compose --profile default up -d            # Start services again"
