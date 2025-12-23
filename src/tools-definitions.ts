/**
 * Tool Definitions for Intelligent Discovery
 * Each tool is specialized for specific DevOps tasks
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { ToolMetadata } from './intelligent-registry.js';

/**
 * Define all available tools with their metadata for intelligent discovery
 */
export const TOOL_DEFINITIONS: ToolMetadata[] = [
  // 1. Nginx Log Analyzer - High priority for nginx-related queries
  {
    tool: {
      name: 'analyze_nginx_logs',
      description:
        'Analyze nginx access logs for errors, traffic patterns, and performance metrics. ' +
        'Returns compact summary instead of raw logs. HUGE TOKEN SAVINGS: 20-50x reduction!',
      inputSchema: {
        type: 'object',
        properties: {
          log_file_path: {
            type: 'string',
            description: 'Path to nginx access log file',
          },
          analysis_type: {
            type: 'string',
            enum: ['errors', 'traffic', 'performance', 'security', 'full'],
            description: 'Type of analysis to perform',
            default: 'full',
          },
        },
        required: ['log_file_path'],
      },
    },
    keywords: ['nginx', 'web server', 'access log', 'http', 'web traffic'],
    category: 'log-analysis',
    priority: 10,
  },

  // 2. Docker Log Analyzer - For containerized applications
  {
    tool: {
      name: 'analyze_docker_logs',
      description:
        'Analyze Docker container logs for errors, warnings, and container health issues. ' +
        'Processes logs locally and returns summary. TOKEN SAVINGS: 30-50x',
      inputSchema: {
        type: 'object',
        properties: {
          container_name_or_id: {
            type: 'string',
            description: 'Docker container name or ID, or path to docker log file',
          },
          since: {
            type: 'string',
            description: 'Show logs since timestamp (e.g., "2023-01-01T00:00:00")',
          },
        },
        required: ['container_name_or_id'],
      },
    },
    keywords: ['docker', 'container', 'containerized', 'docker log'],
    category: 'log-analysis',
    priority: 9,
  },

  // 3. Kubernetes YAML Validator
  {
    tool: {
      name: 'validate_kubernetes_yaml',
      description:
        'Validate Kubernetes YAML files for syntax, required fields, and best practices. ' +
        'Returns validation results and recommendations. TOKEN SAVINGS: 10-20x',
      inputSchema: {
        type: 'object',
        properties: {
          yaml_file_path: {
            type: 'string',
            description: 'Path to Kubernetes YAML file',
          },
          check_best_practices: {
            type: 'boolean',
            description: 'Also check for Kubernetes best practices',
            default: true,
          },
        },
        required: ['yaml_file_path'],
      },
    },
    keywords: ['kubernetes', 'k8s', 'kubectl', 'yaml', 'deployment', 'pod', 'service'],
    category: 'validation',
    priority: 8,
  },

  // 4. System Health Check
  {
    tool: {
      name: 'check_system_health',
      description:
        'Check system health metrics: disk space, memory usage, CPU, running processes. ' +
        'Returns only alerts and issues. TOKEN SAVINGS: 5-10x',
      inputSchema: {
        type: 'object',
        properties: {
          checks: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['disk', 'memory', 'cpu', 'processes', 'all'],
            },
            description: 'Which health checks to perform',
            default: ['all'],
          },
          threshold_disk_percent: {
            type: 'number',
            description: 'Disk usage threshold for alerts (default: 80%)',
            default: 80,
          },
        },
      },
    },
    keywords: ['system health', 'disk space', 'memory', 'cpu', 'monitoring', 'health check'],
    category: 'system',
    priority: 7,
  },

  // 5. Generic Code Executor - Fallback for any Python code
  {
    tool: {
      name: 'execute_code',
      description:
        'Execute Python code in a secure sandbox for custom DevOps tasks. ' +
        'Flexible tool for any scripting needs. TOKEN SAVINGS: Varies by use case',
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
    keywords: ['python', 'code', 'script', 'execute', 'run'],
    category: 'execution',
    priority: 5, // Lower priority - only shows when nothing else matches
  },

  // 6. JSON/YAML Config Validator
  {
    tool: {
      name: 'validate_config_file',
      description:
        'Validate JSON, YAML, or TOML configuration files for syntax and structure. ' +
        'Returns validation results and suggestions. TOKEN SAVINGS: 15-25x',
      inputSchema: {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: 'Path to configuration file',
          },
          file_type: {
            type: 'string',
            enum: ['json', 'yaml', 'toml', 'auto'],
            description: 'Configuration file type (auto-detect if not specified)',
            default: 'auto',
          },
        },
        required: ['file_path'],
      },
    },
    keywords: ['config', 'configuration', 'json', 'yaml', 'toml', 'validate'],
    category: 'validation',
    priority: 6,
  },

  // 7. Log Pattern Analyzer (Generic)
  {
    tool: {
      name: 'analyze_log_patterns',
      description:
        'Analyze any log file for patterns, errors, and anomalies using regex. ' +
        'Generic log analyzer for non-nginx logs. TOKEN SAVINGS: 25-40x',
      inputSchema: {
        type: 'object',
        properties: {
          log_file_path: {
            type: 'string',
            description: 'Path to log file',
          },
          pattern: {
            type: 'string',
            description: 'Regex pattern to search for (optional)',
          },
          log_level: {
            type: 'string',
            enum: ['error', 'warn', 'info', 'debug', 'all'],
            description: 'Filter by log level',
            default: 'all',
          },
        },
        required: ['log_file_path'],
      },
    },
    keywords: ['log', 'application log', 'error log', 'syslog', 'pattern'],
    category: 'log-analysis',
    priority: 7,
  },
];
