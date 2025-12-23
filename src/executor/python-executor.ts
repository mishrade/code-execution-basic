/**
 * Python Code Executor
 * Executes Python code in a subprocess with timeout and security controls
 */

import { spawn } from 'child_process';
import { ExecutionRequest, ExecutionResult, DEFAULT_CONFIG } from '../types/index.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export class PythonExecutor {
  private config = DEFAULT_CONFIG;

  /**
   * Validate code for basic security checks
   */
  private validateCode(code: string): void {
    // Check for blocked commands
    for (const blocked of this.config.blockedCommands || []) {
      if (code.includes(blocked)) {
        throw new Error(`Security violation: Blocked command detected: ${blocked}`);
      }
    }

    // Basic length check
    if (code.length > 100000) {
      throw new Error('Code too large: Maximum 100KB allowed');
    }
  }

  /**
   * Execute Python code with timeout and resource limits
   */
  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    const startTime = Date.now();
    const timeout = Math.min(
      request.timeout || this.config.maxTimeout,
      this.config.maxTimeout
    );

    try {
      // Validate code
      this.validateCode(request.code);

      // Create temporary file for the code
      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mcp-exec-'));
      const scriptPath = path.join(tmpDir, 'script.py');
      await fs.writeFile(scriptPath, request.code, 'utf-8');

      // Execute Python with resource limits
      const result = await this.executeProcess(scriptPath, timeout, tmpDir);

      // Cleanup
      await fs.rm(tmpDir, { recursive: true, force: true });

      return {
        ...result,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        stdout: '',
        stderr: error instanceof Error ? error.message : String(error),
        exitCode: -1,
        executionTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Execute the Python process
   */
  private executeProcess(
    scriptPath: string,
    timeout: number,
    workingDir: string
  ): Promise<Omit<ExecutionResult, 'executionTime'>> {
    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      let killed = false;

      // Spawn Python process
      const proc = spawn('python3', [scriptPath], {
        cwd: workingDir,
        env: {
          ...process.env,
          PYTHONUNBUFFERED: '1',
        },
        timeout: timeout,
      });

      // Capture stdout
      proc.stdout.on('data', (data) => {
        stdout += data.toString();
        // Limit output size to prevent memory issues
        if (stdout.length > 1000000) { // 1MB limit
          proc.kill();
          killed = true;
        }
      });

      // Capture stderr
      proc.stderr.on('data', (data) => {
        stderr += data.toString();
        if (stderr.length > 1000000) { // 1MB limit
          proc.kill();
          killed = true;
        }
      });

      // Handle timeout
      const timer = setTimeout(() => {
        if (!proc.killed) {
          proc.kill('SIGTERM');
          killed = true;
          setTimeout(() => {
            if (!proc.killed) {
              proc.kill('SIGKILL');
            }
          }, 1000);
        }
      }, timeout);

      // Handle process exit
      proc.on('close', (code) => {
        clearTimeout(timer);

        if (killed) {
          resolve({
            success: false,
            stdout,
            stderr: stderr + '\nExecution timeout or output limit exceeded',
            exitCode: -1,
            error: 'Execution timeout or output limit exceeded',
          });
        } else {
          resolve({
            success: code === 0,
            stdout,
            stderr,
            exitCode: code || 0,
          });
        }
      });

      // Handle errors
      proc.on('error', (error) => {
        clearTimeout(timer);
        resolve({
          success: false,
          stdout,
          stderr: stderr + '\n' + error.message,
          exitCode: -1,
          error: error.message,
        });
      });
    });
  }
}
