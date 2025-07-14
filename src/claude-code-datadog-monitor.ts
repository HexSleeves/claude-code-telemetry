import axios from "axios";

interface DatadogMetricsQuery {
  from: number;
  to: number;
  query: string;
}

interface DatadogMetricsResponse {
  status: string;
  res_type: string;
  series: {
    metric: string;
    attributes: Record<string, string>;
    display_name: string;
    unit: {
      family: string;
      scale_factor: number;
      name: string;
      short_name: string;
      plural: string;
      id: number;
    };
    pointlist: [number, number][];
    start: number;
    end: number;
    interval: number;
    length: number;
    aggr: string;
    scope: string;
    expression: string;
  }[];
  values: Record<string, number>;
  from_date: number;
  to_date: number;
  group_by: string[];
  message: string;
}

interface ClaudeCodeDatadogMetrics {
  sessionCount: number;
  totalTokensUsed: number;
  totalCost: number;
  totalCommits: number;
  totalPullRequests: number;
  linesOfCodeAdded: number;
  linesOfCodeRemoved: number;
}

class ClaudeCodeDatadogMonitor {
  private apiKey: string;
  private appKey: string;
  private baseUrl: string;

  constructor(apiKey: string, appKey: string, site = "datadoghq.com") {
    this.apiKey = apiKey;
    this.appKey = appKey;
    this.baseUrl = `https://api.${site}`;
  }

  private async query(
    query: string,
    from?: Date,
    to?: Date
  ): Promise<DatadogMetricsResponse> {
    const now = Math.floor(Date.now() / 1000);
    const oneHourAgo = now - 3600;

    const params = {
      from: from ? Math.floor(from.getTime() / 1000) : oneHourAgo,
      to: to ? Math.floor(to.getTime() / 1000) : now,
      query: query,
    };

    try {
      const response = await axios.get(`${this.baseUrl}/api/v1/query`, {
        params,
        headers: {
          "DD-API-KEY": this.apiKey,
          "DD-APPLICATION-KEY": this.appKey,
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error querying Datadog:", error);
      throw error;
    }
  }

  private extractLatestValue(response: DatadogMetricsResponse): number {
    if (!response.series || response.series.length === 0) return 0;

    const series = response.series[0];
    if (!series.pointlist || series.pointlist.length === 0) return 0;

    // Get the latest (last) value
    const latestPoint = series.pointlist[series.pointlist.length - 1];
    return latestPoint[1] || 0;
  }

  async getMetrics(from?: Date, to?: Date): Promise<ClaudeCodeDatadogMetrics> {
    const queries = {
      sessionCount: "sum:claude_code.session.count{*}",
      totalTokensUsed: "sum:claude_code.token.usage{*}",
      totalCost: "sum:claude_code.cost.usage{*}",
      totalCommits: "sum:claude_code.commit.count{*}",
      totalPullRequests: "sum:claude_code.pull_request.count{*}",
      linesOfCodeAdded: "sum:claude_code.lines_of_code.count{type:added}",
      linesOfCodeRemoved: "sum:claude_code.lines_of_code.count{type:removed}",
    };

    const results = await Promise.all(
      Object.entries(queries).map(async ([key, query]) => {
        try {
          const response = await this.query(query, from, to);
          return [key, this.extractLatestValue(response)];
        } catch (error) {
          console.warn(`Failed to fetch ${key}:`, error);
          return [key, 0];
        }
      })
    );

    return Object.fromEntries(results) as ClaudeCodeDatadogMetrics;
  }

  async getTokenUsageByType(
    from?: Date,
    to?: Date
  ): Promise<Record<string, number>> {
    try {
      const response = await this.query(
        "sum:claude_code.token.usage{*} by {type}",
        from,
        to
      );

      const usage: Record<string, number> = {};
      if (response.series) {
        response.series.forEach((series) => {
          const typeTag = series.scope.match(/type:([^,}]+)/);
          const type = typeTag ? typeTag[1] : "unknown";
          usage[type] = this.extractLatestValue({
            ...response,
            series: [series],
          });
        });
      }

      return usage;
    } catch (error) {
      console.error("Failed to get token usage by type:", error);
      return {};
    }
  }

  async getCostByModel(
    from?: Date,
    to?: Date
  ): Promise<Record<string, number>> {
    try {
      const response = await this.query(
        "sum:claude_code.cost.usage{*} by {model}",
        from,
        to
      );

      const costs: Record<string, number> = {};
      if (response.series) {
        response.series.forEach((series) => {
          const modelTag = series.scope.match(/model:([^,}]+)/);
          const model = modelTag ? modelTag[1] : "unknown";
          costs[model] = this.extractLatestValue({
            ...response,
            series: [series],
          });
        });
      }

      return costs;
    } catch (error) {
      console.error("Failed to get cost by model:", error);
      return {};
    }
  }

  async getUsageReport(from?: Date, to?: Date): Promise<void> {
    try {
      console.log("📊 Claude Code Usage Report (Datadog)");
      console.log("====================================");

      const timeRange =
        from && to
          ? `${from.toISOString()} to ${to.toISOString()}`
          : "Last hour";
      console.log(`📅 Time Range: ${timeRange}`);
      console.log();

      const metrics = await this.getMetrics(from, to);
      const tokensByType = await this.getTokenUsageByType(from, to);
      const costsByModel = await this.getCostByModel(from, to);

      console.log(`📈 Overall Metrics:`);
      console.log(`  Sessions: ${metrics.sessionCount}`);
      console.log(`  Total Cost: $${metrics.totalCost.toFixed(4)}`);
      console.log(
        `  Total Tokens: ${metrics.totalTokensUsed.toLocaleString()}`
      );
      console.log(`  Lines Added: ${metrics.linesOfCodeAdded}`);
      console.log(`  Lines Removed: ${metrics.linesOfCodeRemoved}`);
      console.log(`  Commits: ${metrics.totalCommits}`);
      console.log(`  Pull Requests: ${metrics.totalPullRequests}`);

      if (Object.keys(tokensByType).length > 0) {
        console.log(`\n🎯 Token Usage by Type:`);
        Object.entries(tokensByType).forEach(([type, count]) => {
          console.log(`  ${type}: ${count.toLocaleString()}`);
        });
      }

      if (Object.keys(costsByModel).length > 0) {
        console.log(`\n💰 Cost by Model:`);
        Object.entries(costsByModel).forEach(([model, cost]) => {
          console.log(`  ${model}: $${cost.toFixed(4)}`);
        });
      }
    } catch (error) {
      console.error("Failed to generate usage report:", error);
    }
  }

  async checkConnection(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/v1/validate`, {
        headers: {
          "DD-API-KEY": this.apiKey,
          "DD-APPLICATION-KEY": this.appKey,
        },
      });
      return response.data.valid === true;
    } catch (error) {
      console.error("Failed to validate Datadog connection:", error);
      return false;
    }
  }
}

// Usage example
async function main() {
  const apiKey = process.env.DD_API_KEY;
  const appKey = process.env.DD_APPLICATION_KEY;
  const site = process.env.DD_SITE || "datadoghq.com";

  if (!apiKey) {
    console.error("DD_API_KEY environment variable is required");
    process.exit(1);
  }

  if (!appKey) {
    console.error("DD_APPLICATION_KEY environment variable is required");
    console.log(
      "Get your application key from: https://app.datadoghq.com/organization-settings/application-keys"
    );
    process.exit(1);
  }

  const monitor = new ClaudeCodeDatadogMonitor(apiKey, appKey, site);

  // Test connection
  console.log("🔗 Testing Datadog connection...");
  const isConnected = await monitor.checkConnection();

  if (!isConnected) {
    console.error(
      "❌ Failed to connect to Datadog. Please check your API and Application keys."
    );
    process.exit(1);
  }

  console.log("✅ Connected to Datadog successfully!\n");

  // Generate report
  await monitor.getUsageReport();
}

// Export for use as a module
export { ClaudeCodeDatadogMonitor, type ClaudeCodeDatadogMetrics };

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
