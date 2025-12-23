/**
 * MCP Code Execution - Type Definitions
 */

export interface ExecutionRequest {
  language: 'python' | 'bash';
  code: string;
  timeout?: number;
  workingDir?: string;
}

export interface ExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number;
  error?: string;
}

export interface ExecutorConfig {
  maxTimeout: number;
  maxMemoryMB: number;
  allowedCommands?: string[];
  blockedCommands?: string[];
}

export const DEFAULT_CONFIG: ExecutorConfig = {
  maxTimeout: 30000, // 30 seconds
  maxMemoryMB: 512,
  blockedCommands: [
    'rm -rf',
    'dd',
    'mkfs',
    'format',
    ':(){:|:&};:',  // fork bomb
    'sudo',
    'su',
  ]
};
