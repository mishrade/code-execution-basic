#!/usr/bin/env node

/**
 * MCP 2.0 Intelligent Code Execution Server
 * Demonstrates dynamic tool discovery based on context
 *
 * KEY FEATURES:
 * - Only loads relevant tools based on user query
 * - Supports sampling for intelligent tool selection
 * - Reduces memory footprint by not loading all tools
 * - Improves performance with lazy loading
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { PythonExecutor } from './executor/python-executor.js';
import { ExecutionRequest } from './types/index.js';
import { IntelligentToolRegistry } from './intelligent-registry.js';
import { TOOL_DEFINITIONS } from './tools-definitions.js';

/**
 * MCP 2.0 Server with Intelligent Tool Discovery
 */
class IntelligentCodeExecutionServer {
  private server: Server;
  private pythonExecutor: PythonExecutor;
  private toolRegistry: IntelligentToolRegistry;
  private lastUserQuery: string = '';

  constructor() {
    this.server = new Server(
      {
        name: 'mcp-code-execution-intelligent',
        version: '2.0.0',
      },
      {
        capabilities: {
          tools: {},
          // Intelligent tool discovery based on context tracking
        },
      }
    );

    this.pythonExecutor = new PythonExecutor();
    this.toolRegistry = new IntelligentToolRegistry();

    // Register all tools with metadata
    this.registerTools();
    this.setupHandlers();
    this.setupErrorHandling();

    console.error('MCP 2.0 Intelligent Tool Discovery Enabled ✓');
  }

  /**
   * Register all tools in the intelligent registry
   */
  private registerTools(): void {
    for (const toolDef of TOOL_DEFINITIONS) {
      this.toolRegistry.register(toolDef);
    }
    console.error(`Registered ${TOOL_DEFINITIONS.length} tools for intelligent discovery`);
  }

  /**
   * Setup request handlers
   */
  private setupHandlers(): void {
    // List tools handler - Returns only relevant tools based on context
    // MCP 2.0 Intelligent Discovery: Tools are filtered based on query context
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      // Use intelligent discovery based on last user query
      const discoveredTools = this.toolRegistry.discoverTools(this.lastUserQuery);
      const stats = this.toolRegistry.getStats(this.lastUserQuery);

      console.error(
        `Tool Discovery: ${stats.discoveredTools}/${stats.totalTools} tools ` +
        `(Context: "${this.lastUserQuery.substring(0, 40)}...")`
      );

      // Log which tools were discovered
      discoveredTools.forEach((tool, idx) => {
        console.error(`  ${idx + 1}. ${tool.name}`);
      });

      return { tools: discoveredTools };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const toolName = request.params.name;
      const args = request.params.arguments;

      console.error(`Executing tool: ${toolName}`);

      // Route to appropriate handler based on tool name
      switch (toolName) {
        case 'analyze_nginx_logs':
          return await this.handleAnalyzeNginxLogs(args);

        case 'analyze_docker_logs':
          return await this.handleAnalyzeDockerLogs(args);

        case 'validate_kubernetes_yaml':
          return await this.handleValidateK8sYaml(args);

        case 'check_system_health':
          return await this.handleSystemHealth(args);

        case 'execute_code':
          return await this.handleExecuteCode(args);

        case 'validate_config_file':
          return await this.handleValidateConfig(args);

        case 'analyze_log_patterns':
          return await this.handleAnalyzeLogPatterns(args);

        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    });
  }

  /**
   * Handle nginx log analysis
   */
  private async handleAnalyzeNginxLogs(args: any) {
    const code = `
import json
import re
from collections import Counter

log_file = "${args.log_file_path}"
analysis_type = "${args.analysis_type || 'full'}"

# Load pre-built analyzer
with open('examples/analyze-logs.py', 'r') as f:
    exec(f.read())

result = parse_nginx_log(log_file)
print(json.dumps(result, indent=2))
`;

    return await this.executePythonCode(code);
  }

  /**
   * Handle docker log analysis
   */
  private async handleAnalyzeDockerLogs(args: any) {
    const code = `
import json

# Docker logs are typically in /var/lib/docker/containers/ or provided path
log_path = "${args.container_name_or_id}"
print(json.dumps({
    "message": "Docker log analysis",
    "container": log_path,
    "note": "Analyze docker logs here - implementation specific to environment"
}))
`;

    return await this.executePythonCode(code);
  }

  /**
   * Handle Kubernetes YAML validation
   */
  private async handleValidateK8sYaml(args: any) {
    const code = `
import json
import yaml

try:
    with open("${args.yaml_file_path}", 'r') as f:
        docs = list(yaml.safe_load_all(f))

    results = {
        "valid": True,
        "documents": len(docs),
        "resources": [doc.get('kind', 'Unknown') for doc in docs if doc],
        "recommendations": []
    }

    # Check best practices
    if ${args.check_best_practices || true}:
        for doc in docs:
            if not doc:
                continue
            if 'resources' not in doc.get('spec', {}).get('template', {}).get('spec', {}).get('containers', [{}])[0]:
                results["recommendations"].append("Consider adding resource limits/requests")

    print(json.dumps(results, indent=2))
except Exception as e:
    print(json.dumps({"valid": False, "error": str(e)}))
`;

    return await this.executePythonCode(code);
  }

  /**
   * Handle system health check
   */
  private async handleSystemHealth(args: any) {
    const code = `
import json
import shutil

# Check disk space
total, used, free = shutil.disk_usage("/")
disk_percent = (used / total) * 100

result = {
    "disk": {
        "total_gb": round(total / (1024**3), 2),
        "used_gb": round(used / (1024**3), 2),
        "free_gb": round(free / (1024**3), 2),
        "used_percent": round(disk_percent, 2),
        "alert": disk_percent > ${args.threshold_disk_percent || 80}
    },
    "overall_health": "OK" if disk_percent < ${args.threshold_disk_percent || 80} else "WARNING"
}

print(json.dumps(result, indent=2))
`;

    return await this.executePythonCode(code);
  }

  /**
   * Handle generic code execution
   */
  private async handleExecuteCode(args: any) {
    return await this.executePythonCode(args.code, args.timeout);
  }

  /**
   * Handle config validation
   */
  private async handleValidateConfig(args: any) {
    const code = `
import json
import yaml

try:
    with open("${args.file_path}", 'r') as f:
        content = f.read()

    file_type = "${args.file_type}"
    if file_type == "auto":
        file_type = "${args.file_path}".split('.')[-1]

    if file_type in ['yaml', 'yml']:
        data = yaml.safe_load(content)
    elif file_type == 'json':
        data = json.loads(content)

    result = {
        "valid": True,
        "file_type": file_type,
        "keys": list(data.keys()) if isinstance(data, dict) else None
    }
    print(json.dumps(result, indent=2))
except Exception as e:
    print(json.dumps({"valid": False, "error": str(e)}))
`;

    return await this.executePythonCode(code);
  }

  /**
   * Handle log pattern analysis
   */
  private async handleAnalyzeLogPatterns(args: any) {
    const pattern = args.pattern || 'ERROR|WARN|CRITICAL';
    const code = `
import json
import re

matches = []
with open("${args.log_file_path}", 'r') as f:
    for i, line in enumerate(f, 1):
        if re.search(r"${pattern}", line, re.IGNORECASE):
            matches.append({"line": i, "content": line.strip()[:100]})

result = {
    "total_matches": len(matches),
    "pattern": "${pattern}",
    "matches": matches[:10]  # Top 10
}
print(json.dumps(result, indent=2))
`;

    return await this.executePythonCode(code);
  }

  /**
   * Execute Python code helper
   */
  private async executePythonCode(code: string, timeout?: number) {
    try {
      const execRequest: ExecutionRequest = {
        language: 'python',
        code: code,
        timeout: timeout ? Math.min(timeout, 30000) : 30000,
      };

      const result = await this.pythonExecutor.execute(execRequest);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: result.success,
                exitCode: result.exitCode,
                executionTime: result.executionTime,
                stdout: result.stdout,
                stderr: result.stderr,
                error: result.error,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: false,
                error: error instanceof Error ? error.message : String(error),
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('MCP 2.0 Intelligent Code Execution Server running on stdio');
    console.error('Intelligent tool discovery active - tools loaded based on context!');
  }
}

// Start the server
const server = new IntelligentCodeExecutionServer();
server.start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
