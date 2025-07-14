import {
  ClaudeCodeMonitor,
  execute as executeClaudeCodeMonitor,
} from "./claude-code-monitor";
// Run if called directly
if (require.main === module) {
  executeClaudeCodeMonitor().catch(console.error);
}
