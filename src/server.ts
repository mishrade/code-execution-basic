#!/usr/bin/env node

/**
 * MCP Code Execution Server
 * Provides secure code execution capabilities via MCP protocol
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

/**
 * MCP Server for Code Execution
 */
class CodeExecutionServer {
  private server: Server;
  private pythonExecutor: PythonExecutor;

  constructor() {
    this.server = new Server(
      {
        name: 'mcp-code-execution',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.pythonExecutor = new PythonExecutor();
    this.setupHandlers();
    this.setupErrorHandling();
  }

  /**
   * Setup request handlers
   */
  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools: Tool[] = [
        {
          name: 'execute_code',
          description:
            'Execute Python code in a secure sandbox. ' +
            'Perfect for analyzing logs, validating configs, or processing data locally. ' +
            'Returns execution results with stdout, stderr, and exit code. ' +
            'HUGE TOKEN SAVINGS: Process large files locally and return only summaries!',
          inputSchema: {
            type: 'object',
            properties: {
              language: {
                type: 'string',
                enum: ['python'],
                description: 'Programming language (currently only Python supported)',
                default: 'python',
              },
              code: {
                type: 'string',
                description: 'The Python code to execute',
              },
              timeout: {
                type: 'number',
                description: 'Execution timeout in milliseconds (default: 30000, max: 30000)',
                default: 30000,
                maximum: 30000,
              },
            },
            required: ['code'],
          },
        },
      ];

      return { tools };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name === 'execute_code') {
        return await this.handleExecuteCode(request.params.arguments);
      }

      throw new Error(`Unknown tool: ${request.params.name}`);
    });
  }

  /**
   * Handle execute_code tool call
   */
  private async handleExecuteCode(args: any) {
    try {
      // Validate arguments
      if (!args.code || typeof args.code !== 'string') {
        throw new Error('Missing or invalid "code" parameter');
      }

      const language = args.language || 'python';
      if (language !== 'python') {
        throw new Error(`Unsupported language: ${language}. Currently only Python is supported.`);
      }

      // Prepare execution request
      const execRequest: ExecutionRequest = {
        language: 'python',
        code: args.code,
        timeout: args.timeout ? Math.min(args.timeout, 30000) : 30000,
      };

      // Execute code
      const result = await this.pythonExecutor.execute(execRequest);

      // Return results
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
    console.error('MCP Code Execution Server running on stdio');
  }
}

// Start the server
const server = new CodeExecutionServer();
server.start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
