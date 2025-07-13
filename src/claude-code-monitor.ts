import axios from "axios";

const DEFAULT_PROMETHEUS_URL = "http://localhost:9090";
const DEFAULT_POLL_INTERVAL = 30000;

const DEFAULT_CONFIG = {
  prometheusUrl: DEFAULT_PROMETHEUS_URL,
  pollInterval: DEFAULT_POLL_INTERVAL,
};

interface PrometheusQueryResult {
  status: string;
  data: {
    resultType: string;
    result: Array<{
      metric: Record<string, string>;
      value: [number, string];
    }>;
  };
}

interface ClaudeCodeMetrics {
  sessionCount: number;
  totalTokensUsed: number;
  totalCost: number;
  linesOfCodeAdded: number;
  linesOfCodeRemoved: number;
  commitsCreated: number;
  pullRequestsCreated: number;
}

class ClaudeCodeMonitor {
  private prometheusUrl: string;
  private pollInterval: number;
  private isPolling: boolean = false;
  private pollTimer?: NodeJS.Timeout;

  constructor(
    options: {
      prometheusUrl?: string;
      pollInterval?: number;
    } = DEFAULT_CONFIG
  ) {
    const { prometheusUrl, pollInterval } = options;

    this.prometheusUrl = prometheusUrl ?? DEFAULT_PROMETHEUS_URL;
    this.pollInterval = pollInterval ?? DEFAULT_POLL_INTERVAL;
  }

  private async query(prometheusQuery: string): Promise<PrometheusQueryResult> {
    try {
      const response = await axios.get(`${this.prometheusUrl}/api/v1/query`, {
        params: { query: prometheusQuery },
      });
      return response.data;
    } catch (error) {
      console.error("Error querying Prometheus:", error);
      throw error;
    }
  }

  private extractValue(result: PrometheusQueryResult): number {
    if (result.data.result.length === 0) return 0;
    return parseFloat(result.data.result[0].value[1]);
  }

  async getMetrics(): Promise<ClaudeCodeMetrics> {
    const queries = {
      sessionCount: "sum(claude_code_claude_code_session_count_total)",
      totalTokensUsed: "sum(claude_code_claude_code_token_usage_tokens_total)",
      totalCost: "sum(claude_code_claude_code_cost_usage_USD_total)",
      linesOfCodeAdded:
        'sum(claude_code_claude_code_lines_of_code_count_total{type="added"})',
      linesOfCodeRemoved:
        'sum(claude_code_claude_code_lines_of_code_count_total{type="removed"})',
      commitsCreated: "sum(claude_code_claude_code_commit_count_total)",
      pullRequestsCreated:
        "sum(claude_code_claude_code_pull_request_count_total)",
    };

    const results = await Promise.all(
      Object.entries(queries).map(async ([key, query]) => [
        key,
        this.extractValue(await this.query(query)),
      ])
    );

    return Object.fromEntries(results) as ClaudeCodeMetrics;
  }

  async getTokenUsageByType(): Promise<Record<string, number>> {
    const result = await this.query(
      "sum by (type) (claude_code_claude_code_token_usage_tokens_total)"
    );

    const usage: Record<string, number> = {};
    result.data.result.forEach((item) => {
      const type = item.metric.type || "unknown";
      usage[type] = parseFloat(item.value[1]);
    });

    return usage;
  }

  async getCostByModel(): Promise<Record<string, number>> {
    const result = await this.query(
      "sum by (model) (claude_code_claude_code_cost_usage_USD_total)"
    );

    const costs: Record<string, number> = {};
    result.data.result.forEach((item) => {
      const model = item.metric.model || "unknown";
      costs[model] = parseFloat(item.value[1]);
    });

    return costs;
  }

  async getUsageReport(): Promise<void> {
    try {
      console.log("📊 Claude Code Usage Report");
      console.log("==========================");

      const metrics = await this.getMetrics();
      const tokensByType = await this.getTokenUsageByType();
      const costsByModel = await this.getCostByModel();

      console.log(`\n📈 Overall Metrics:`);
      console.log(`  Sessions: ${metrics.sessionCount}`);
      console.log(`  Total Cost: $${metrics.totalCost.toFixed(2)}`);
      console.log(`  Lines Added: ${metrics.linesOfCodeAdded}`);
      console.log(`  Lines Removed: ${metrics.linesOfCodeRemoved}`);
      console.log(`  Commits: ${metrics.commitsCreated}`);
      console.log(`  Pull Requests: ${metrics.pullRequestsCreated}`);

      console.log(`\n🎯 Token Usage by Type:`);
      Object.entries(tokensByType).forEach(([type, count]) => {
        console.log(`  ${type}: ${count.toLocaleString()}`);
      });

      console.log(`\n💰 Cost by Model:`);
      Object.entries(costsByModel).forEach(([model, cost]) => {
        console.log(`  ${model}: $${cost.toFixed(2)}`);
      });
    } catch (error) {
      console.error("Failed to generate usage report:", error);
    }
  }

  startPolling(): void {
    if (this.isPolling) {
      console.log("Polling is already running");
      return;
    }

    this.isPolling = true;
    console.log(
      `Starting Claude Code monitoring with ${this.pollInterval}ms interval`
    );

    const poll = async () => {
      try {
        console.clear();
        console.log(
          `🔄 Auto-refreshing every ${
            this.pollInterval / 1000
          }s (Press Ctrl+C to stop)\n`
        );
        await this.getUsageReport();
      } catch (error) {
        console.error("Error during polling:", error);
      }

      if (this.isPolling) {
        this.pollTimer = setTimeout(poll, this.pollInterval);
      }
    };

    poll();
  }

  stopPolling(): void {
    if (!this.isPolling) {
      console.log("Polling is not running");
      return;
    }

    this.isPolling = false;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = undefined;
    }
    console.log("Polling stopped");
  }

  setPollInterval(interval: number): void {
    this.pollInterval = interval;
    if (this.isPolling) {
      console.log(
        `Poll interval updated to ${interval}ms. Restart polling to apply changes.`
      );
    }
  }
}

// Export for use as a module
export { ClaudeCodeMonitor, type ClaudeCodeMetrics };
