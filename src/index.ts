import { ClaudeCodeMonitor } from "./claude-code-monitor";

// Usage example
async function main() {
  let pollInterval = process.argv.includes("--poll")
    ? parseInt(process.argv[3])
    : -1;

  if (Number.isNaN(pollInterval)) {
    console.error("Invalid poll interval, using default 30000ms");
    pollInterval = 30000;
  }

  const monitor = new ClaudeCodeMonitor({ pollInterval });

  if (pollInterval !== -1) {
    // Handle graceful shutdown
    process.on("SIGINT", () => {
      console.log("\nShutting down gracefully...");
      monitor.stopPolling();
      process.exit(0);
    });

    monitor.startPolling();
  } else {
    await monitor.getUsageReport();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
