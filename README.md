# Claude Code Telemetry with Grafana

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

This project provides a complete solution for monitoring Claude Code usage and performance. It uses OpenTelemetry to collect detailed metrics, Prometheus to store them, and Grafana to visualize them in a pre-configured dashboard.

<p align="center">
  <img src="screenshots/grafana_claude_dash.png" width="600" alt="Claude Code Dashboard">
</p>

## ✨ Features

- **Comprehensive Dashboards**: Visualize key metrics in Grafana.
- **Cost Tracking**: Monitor token usage and associated costs.
- **Performance Metrics**: Track session duration, lines of code changes, and more.
- **Extensible**: Easily add new metrics and visualizations.
- **Simple Setup**: Get up and running with a single script.

## 📸 Screenshots

<table>
  <tr>
    <td><img src="screenshots/grafana_claude_dash.png" width="500" alt="Claude Code Dashboard"></td>
    <td><img src="screenshots/prometheus_targets.png" width="500" alt="Prometheus Targets"></td>
  </tr>
</table>

## 🛠️ Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Node.js](https://nodejs.org/en/download/) (v18 or higher)
- `npm` (or your preferred package manager)

## 🚀 Quick Start

1. **Clone the repository:**

    ```bash
    git clone https://github.com/jlecoq/claude-code-telemetry.git
    cd claude-code-telemetry
    ```

2. **Install dependencies:**

    ```bash
    npm install
    ```

3. **Run the setup script:**

    This script makes the necessary shell scripts executable.

    ```bash
    chmod +x setup-claude-code-telemetry.sh
    ./setup-claude-code-telemetry.sh
    ```

4. **Set up environment variables:**

    This script configures your shell to send telemetry data to the OpenTelemetry Collector.

    ```bash
    ./setup-env.sh
    source ~/.zshrc # Or ~/.bashrc
    ```

5. **Start the monitoring stack:**

    ```bash
    docker-compose up -d
    ```

6. **Access the dashboards:**
    - **Grafana**: <http://localhost:3000> (login with `admin`/`admin`)
    - **Prometheus**: <http://localhost:9090>
    - **OpenTelemetry Collector**: `localhost:4317` (gRPC), `localhost:4318` (HTTP)

7. **Generate Telemetry Data:**

    Run any Claude Code command in your terminal. The environment variables you set earlier will automatically route the telemetry data to the collector.

## 📊 Available Metrics

- **Session Metrics**: Track usage patterns and adoption.
- **Token Usage**: Monitor consumption by type (input, output, cache).
- **Cost Tracking**: Monitor spending across different models.
- **Productivity Metrics**: Lines of code modified, commits, and pull requests.
- **Performance**: Session duration and frequency.

## 🏛️ Architecture

The architecture is straightforward:

```mermaid
graph TD
    A[Claude Code] -->|OTLP Exporter| B(OpenTelemetry Collector);
    B -->|Prometheus Exporter| C(Prometheus);
    C -->|Prometheus Datasource| D(Grafana);
```

- **Claude Code**: Generates telemetry data using its built-in OpenTelemetry instrumentation.
- **OpenTelemetry Collector**: Receives data from Claude Code, processes it, and exposes it to Prometheus.
- **Prometheus**: Scrapes and stores the metrics from the collector.
- **Grafana**: Queries Prometheus and visualizes the data in a dashboard.

## 📝 Environment Variables

The setup script configures the following environment variables to enable telemetry collection:

```bash
export CLAUDE_CODE_ENABLE_TELEMETRY=1
export OTEL_METRICS_EXPORTER=otlp
export OTEL_EXPORTER_OTLP_PROTOCOL=grpc
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
export OTEL_METRIC_EXPORT_INTERVAL=30000 # 30 seconds for testing
```

## 🔧 Commands

| Command | Description |
| :--- | :--- |
| `./setup-env.sh` | Sets up the required environment variables. |
| `docker-compose up -d` | Starts all services in detached mode. |
| `docker-compose logs -f` | Tails the logs of all running services. |
| `docker-compose down` | Stops and removes all services. |
| `./test-setup.sh` | Runs a script to test the setup. |
| `npm run monitor` | Generates a usage report in the console. |
| `npm run build` | Compiles the TypeScript code. |
| `npm run dev` | Runs the monitoring script in development mode. |

## 📈 Monitoring Client

This repository includes a TypeScript-based monitoring client to programmatically access metrics from Prometheus.

### Usage

```typescript
import { ClaudeCodeMonitor } from './claude-code-monitor';

const monitor = new ClaudeCodeMonitor();

async function printReport() {
  await monitor.getUsageReport();
}

printReport();
```

### Methods

- `getMetrics()`: Fetches overall usage metrics.
- `getTokenUsageByType()`: Returns token usage broken down by type.
- `getCostByModel()`: Returns cost information broken down by model.
- `getUsageReport()`: Prints a formatted usage report to the console.

## 🔍 Troubleshooting

1. **Verify services are running:**

    ```bash
    docker-compose ps
    ```

    All services should have the status `Up`.

2. **Check service logs for errors:**

    ```bash
    docker-compose logs <service-name> # e.g., otel-collector
    ```

3. **Check Prometheus targets:**

    Navigate to <http://localhost:9090/targets>. The `otel-collector` should be listed with a status of `UP`.

4. **Test Claude Code telemetry:**

    Run a Claude Code command and then query Prometheus for a metric like `claude_code_session_count_total`.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue.

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a pull request.

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
