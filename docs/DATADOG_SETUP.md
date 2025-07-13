# Datadog Setup for Claude Code Telemetry

This section covers setting up Claude Code telemetry with Datadog using a local agent approach.

## 🐕 Quick Start with Datadog

### Prerequisites

- Datadog account with API access
- Docker installed and running
- Claude Code installed

### 1. Get Your Datadog API Key

1. Log into your Datadog account
2. Go to [API Keys](https://app.datadoghq.com/organization-settings/api-keys)
3. Create a new API key or copy an existing one
4. **Optional**: Get an [Application Key](https://app.datadoghq.com/organization-settings/application-keys) for advanced monitoring

### 2. Set Up Datadog Agent

```bash
# Export your Datadog API key
export DD_API_KEY="your_datadog_api_key_here"

# Optional: Set your Datadog site (default: datadoghq.com)
export DD_SITE="datadoghq.com"  # or us3.datadoghq.com, datadoghq.eu, etc.

# Run the setup script
./setup-datadog.sh
```

### 3. Configure Claude Code

```bash
# Configure Claude Code to send metrics to Datadog
./configure-claude-datadog.sh
```

### 4. Test the Setup

```bash
# Test that everything is working
./test-datadog-setup.sh

# Run a Claude Code command to generate telemetry
claude-code run "echo 'Hello Datadog'"

# Check your metrics (requires Application Key)
export DD_APPLICATION_KEY="your_app_key_here"
npm run monitor-datadog
```

## 📊 Datadog Dashboard

Import the pre-built dashboard from Martin's blog post:

- **Dashboard JSON**: <https://gist.github.com/martinamps/300a8b0ac5a273c18209261113d89514>
- **Metrics Summary**: <https://app.datadoghq.com/metric/summary> (filter for `claude_code.*`)

## 🔧 Available Metrics in Datadog

| Metric Name | Type | Description | Tags |
|-------------|------|-------------|------|
| `claude_code.session.count` | Counter | CLI sessions started | `user.email`, `organization.id`, `session.id` |
| `claude_code.token.usage` | Counter | Tokens consumed | `type` (input/output/cache*), `model` |
| `claude_code.cost.usage` | Counter | Cost in USD | `model` |
| `claude_code.lines_of_code.count` | Counter | Lines added/removed | `type` (added/removed) |
| `claude_code.commit.count` | Counter | Git commits created | - |
| `claude_code.pull_request.count` | Counter | Pull requests created | - |

## 🛠️ Commands

```bash
# Datadog-specific commands
npm run setup-datadog        # Set up Datadog agent
npm run configure-claude     # Configure Claude Code for Datadog
npm run test-datadog         # Test Datadog setup
npm run monitor-datadog      # Generate Datadog usage report

# Agent management
docker-compose -f datadog/docker-compose-datadog.yaml up -d    # Start agent
docker-compose -f datadog/docker-compose-datadog.yaml down     # Stop agent
docker-compose -f datadog/docker-compose-datadog.yaml logs -f  # View logs
```

## 🔍 Troubleshooting

### 1. Check Agent Status

```bash
docker exec datadog-agent agent status
```

### 2. Verify OTLP Configuration

```bash
docker exec datadog-agent agent status | grep -A10 OTLP
```

### 3. Check Network Connectivity

```bash
# Check if OTLP ports are open
lsof -i :4317
nc -z 127.0.0.1 4317
```

### 4. Enable Debug Output

Add console output to see metrics being generated:

```bash
export OTEL_METRICS_EXPORTER="otlp,console"
```

### 5. Common Issues

**No metrics appearing in Datadog:**

- Verify API key is correct
- Check agent logs: `docker-compose -f datadog/docker-compose-datadog.yaml logs`
- Ensure Claude Code telemetry is enabled
- Run a Claude Code command to generate data

**Connection refused errors:**

- Verify Datadog agent is running: `docker ps | grep datadog-agent`
- Check port binding: `docker port datadog-agent`
- Restart the agent: `docker-compose -f datadog/docker-compose-datadog.yaml restart`

## 📈 Advanced Configuration

### Custom Tags

Add custom tags to your metrics by modifying `datadog/datadog.yaml`:

```yaml
tags:
  - env:production
  - team:engineering
  - project:my-project
```

### Metrics Without Limits

Configure [Metrics Without Limits](https://docs.datadoghq.com/metrics/metrics-without-limits/) in Datadog to control cardinality and costs.

### Cost Monitoring

Set up monitors for:

- High token usage: `sum:claude_code.token.usage{*}`
- Cost spikes: `sum:claude_code.cost.usage{*}`
- Session anomalies: `sum:claude_code.session.count{*}`

## 🔐 Security Best Practices

1. **API Key Management**: Store API keys securely, don't commit to version control
2. **Network Security**: Use VPN or tunnels for remote agents
3. **Monitoring**: Set up anomaly detection for unusual metric patterns
4. **Cardinality Control**: Use Metrics Without Limits to prevent cost overruns

## 🏗️ Alternative Deployments

### Remote Agent via SSH Tunnel

For shared/centralized agents, set up an SSH tunnel:

```bash
# Add to ~/.ssh/config
Host metrics-gw
  User yourusername
  LocalForward 14317 localhost:4317
  # Optional: Use Cloudflare Zero Trust
  ProxyCommand /opt/homebrew/bin/cloudflared access ssh --hostname gw.example.com

# Update Claude Code endpoint
export OTEL_EXPORTER_OTLP_ENDPOINT=http://127.0.0.1:14317
```

### Agentless OTLP API (Preview)

Direct API integration (requires preview access):

```json
{
  "env": {
    "CLAUDE_CODE_ENABLE_TELEMETRY": "1",
    "OTEL_METRICS_EXPORTER": "otlp",
    "OTEL_EXPORTER_OTLP_PROTOCOL": "http/protobuf",
    "OTEL_EXPORTER_OTLP_ENDPOINT": "https://api.datadoghq.com/api/v1/otlp",
    "OTEL_EXPORTER_OTLP_HEADERS": "DD-API-KEY=your_api_key"
  }
}
```
