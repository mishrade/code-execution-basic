/**
 * Intelligent Tool Registry for MCP 2.0
 * Demonstrates dynamic tool discovery based on context
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';

export interface ToolMetadata {
  tool: Tool;
  keywords: string[]; // Keywords that trigger this tool
  category: string;   // Tool category
  priority: number;   // Priority for ranking (higher = more important)
}

export class IntelligentToolRegistry {
  private tools: Map<string, ToolMetadata> = new Map();

  /**
   * Register a tool with metadata for intelligent discovery
   */
  register(metadata: ToolMetadata): void {
    this.tools.set(metadata.tool.name, metadata);
  }

  /**
   * Discover relevant tools based on context/query
   * This is the MCP 2.0 intelligent loading feature!
   */
  discoverTools(context?: string): Tool[] {
    // If no context provided, return all tools (fallback)
    if (!context || context.trim() === '') {
      return this.getAllTools();
    }

    const contextLower = context.toLowerCase();
    const scoredTools: Array<{ tool: Tool; score: number }> = [];

    // Score each tool based on keyword matching
    for (const [name, metadata] of this.tools.entries()) {
      let score = 0;

      // Check if any keywords match the context
      for (const keyword of metadata.keywords) {
        if (contextLower.includes(keyword.toLowerCase())) {
          score += metadata.priority;
        }
      }

      // Only include tools with non-zero scores
      if (score > 0) {
        scoredTools.push({ tool: metadata.tool, score });
      }
    }

    // Sort by score (highest first)
    scoredTools.sort((a, b) => b.score - a.score);

    // Return tools in priority order
    const discoveredTools = scoredTools.map(st => st.tool);

    // If no tools discovered, return a generic fallback
    if (discoveredTools.length === 0) {
      return this.getFallbackTools();
    }

    return discoveredTools;
  }

  /**
   * Get all tools (used when no context available)
   */
  getAllTools(): Tool[] {
    return Array.from(this.tools.values())
      .sort((a, b) => b.priority - a.priority)
      .map(m => m.tool);
  }

  /**
   * Get fallback tools (generic tools that work for any context)
   */
  getFallbackTools(): Tool[] {
    const fallbackNames = ['execute_code'];
    return Array.from(this.tools.values())
      .filter(m => fallbackNames.includes(m.tool.name))
      .map(m => m.tool);
  }

  /**
   * Get tools by category
   */
  getToolsByCategory(category: string): Tool[] {
    return Array.from(this.tools.values())
      .filter(m => m.category === category)
      .sort((a, b) => b.priority - a.priority)
      .map(m => m.tool);
  }

  /**
   * Get statistics about tool discovery
   */
  getStats(context?: string): {
    totalTools: number;
    discoveredTools: number;
    categories: string[];
  } {
    const discovered = this.discoverTools(context);
    const categories = Array.from(new Set(
      Array.from(this.tools.values()).map(m => m.category)
    ));

    return {
      totalTools: this.tools.size,
      discoveredTools: discovered.length,
      categories,
    };
  }
}
