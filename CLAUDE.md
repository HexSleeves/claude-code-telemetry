# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Claude Code telemetry monitoring system that sets up comprehensive observability using OpenTelemetry, Prometheus, Grafana, and optionally Datadog. The project monitors Claude Code usage metrics including sessions, token consumption, costs, and productivity metrics like lines of code and commits.

## Architecture

The system follows a telemetry pipeline pattern:

```mermaid
Claude Code → OpenTelemetry Collector → Prometheus → Grafana
                ↓
            Datadog (Optional)
```

- **OpenTelemetry Collector**: Receives telemetry data from Claude Code via OTLP (gRPC/HTTP)
- **Prometheus**: Stores metrics with `claude_code` namespace
- **Grafana**: Provides visualization dashboards
- **Datadog**: Optional cloud monitoring service for logs and metrics
- **TypeScript Monitor**: Programmatic client for querying metrics

## Essential Commands

### Development

```bash
# Build TypeScript
npm run build

# Run monitoring script in development
npm run dev

# Generate usage report
npm run monitor

# Start monitoring service
npm start
```

### Infrastructure

```bash
# Initial setup (sets environment variables and starts services)
./scripts/setup-claude-code-telemetry.sh

# Setup with Datadog (requires DD_API_KEY environment variable)
./scripts/setup-claude-code-datadog.sh

# Start all services
docker-compose up -d

# Start services with Datadog
docker-compose --profile datadog up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Check service status
docker-compose ps
```

### Required Environment Variables

The setup script automatically configures these for Claude Code telemetry:

```bash
export CLAUDE_CODE_ENABLE_TELEMETRY=1
export OTEL_METRICS_EXPORTER=otlp
export OTEL_EXPORTER_OTLP_PROTOCOL=grpc
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
export OTEL_METRIC_EXPORT_INTERVAL=30000
```

#### Additional Variables for Datadog Integration

```bash
export DD_API_KEY=your_datadog_api_key_here
export DD_SITE=datadoghq.com  # or datadoghq.eu, us3.datadoghq.com, etc.
```

## Key Components

### ClaudeCodeMonitor (`claude-code-monitor.ts`)

- TypeScript class for programmatically accessing Claude Code metrics
- Queries Prometheus API to extract usage statistics
- Provides methods for overall metrics, token usage by type, and cost by model
- Main entry point: `ClaudeCodeMonitor.getUsageReport()`

### Configuration Files

- `otel-collector-config.yaml`: OpenTelemetry Collector configuration with `claude_code` namespace
- `prometheus.yml`: Prometheus scraping configuration
- `docker-compose.yaml`: Orchestrates all services (collector, Prometheus, Grafana)
- `grafana/`: Pre-configured dashboards and datasources

## Service Endpoints

- **Grafana**: <http://localhost:3000> (admin/admin)
- **Prometheus**: <http://localhost:9090>
- **OpenTelemetry Collector**: localhost:4317 (gRPC), localhost:4318 (HTTP)
- **Datadog**: https://app.datadoghq.com (when enabled)

## Tracked Metrics

The system monitors these Claude Code metrics:

- `claude_code_session_count_total`: Total sessions
- `claude_code_token_usage_total`: Token consumption by type
- `claude_code_cost_usage_total`: Cost by model
- `claude_code_lines_of_code_count_total`: Lines added/removed
- `claude_code_commit_count_total`: Git commits created
- `claude_code_pull_request_count_total`: PRs created

## Development Patterns

- TypeScript with strict mode enabled
- Axios for HTTP requests to Prometheus API
- Promise-based async patterns
- Error handling with try/catch blocks
- Type definitions for Prometheus query results
- Module exports for reusability (`ClaudeCodeMonitor` class)

## Troubleshooting

1. Check if services are running: `docker-compose ps`
2. View service logs: `docker-compose logs [service-name]`
3. Check Prometheus targets: <http://localhost:9090/targets>
4. Verify Claude Code telemetry is enabled with environment variables
5. Test metrics appear in Prometheus after running Claude Code commands

### Datadog-specific Troubleshooting

1. Verify DD_API_KEY is set: `echo $DD_API_KEY`
2. Check Datadog Agent logs: `docker-compose logs datadog-agent`
3. Verify metrics in Datadog: Search for `claude_code.*` metrics
4. Check OpenTelemetry Collector logs for Datadog export errors
