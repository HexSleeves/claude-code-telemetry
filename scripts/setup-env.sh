#!/bin/bash

# Environment setup for Claude Code telemetry
echo "🔧 Setting up Claude Code telemetry environment variables..."

# Detect the shell
if [[ "$SHELL" == *"zsh"* ]]; then
    PROFILE_FILE="$HOME/.zshrc"
    SHELL_NAME="zsh"
elif [[ "$SHELL" == *"bash"* ]]; then
    PROFILE_FILE="$HOME/.bashrc"
    SHELL_NAME="bash"
elif [[ "$SHELL" == *"fish"* ]]; then
    PROFILE_FILE="$HOME/.config/fish/config.fish"
    SHELL_NAME="fish"
else
    echo "⚠️  Unknown shell. Please manually add environment variables to your shell profile."
    exit 1
fi

echo "📝 Detected shell: $SHELL_NAME"
echo "📁 Profile file: $PROFILE_FILE"

# Check if variables already exist
if grep -q "CLAUDE_CODE_ENABLE_TELEMETRY" "$PROFILE_FILE" 2>/dev/null; then
    echo "⚠️  Environment variables already exist in $PROFILE_FILE"
    echo "    Please check and update manually if needed."
else
    # Add environment variables
    echo "" >>"$PROFILE_FILE"
    echo "# Claude Code Telemetry Configuration" >>"$PROFILE_FILE"
    echo "export CLAUDE_CODE_ENABLE_TELEMETRY=1" >>"$PROFILE_FILE"
    echo "export OTEL_METRICS_EXPORTER=otlp" >>"$PROFILE_FILE"
    echo "export OTEL_EXPORTER_OTLP_PROTOCOL=grpc" >>"$PROFILE_FILE"
    echo "export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317" >>"$PROFILE_FILE"
    echo "export OTEL_METRIC_EXPORT_INTERVAL=10000" >>"$PROFILE_FILE"

    echo "✅ Environment variables added to $PROFILE_FILE"
fi

# Set variables for current session
export CLAUDE_CODE_ENABLE_TELEMETRY=1
export OTEL_METRICS_EXPORTER=otlp
export OTEL_EXPORTER_OTLP_PROTOCOL=grpc
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
export OTEL_METRIC_EXPORT_INTERVAL=10000

echo "✅ Environment variables set for current session"
echo ""
echo "🚀 Quick Start:"
echo "1. Restart your terminal or run: source $PROFILE_FILE"
echo "2. Run a Claude Code command to generate telemetry data"
echo "3. Check your dashboard: http://localhost:3000 (admin/admin)"
echo "4. Generate a report: npm run monitor"
echo ""
echo "📊 Current environment variables:"
env | grep -E "(CLAUDE_CODE|OTEL_)" || echo "  No variables found in current session"
