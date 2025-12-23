#!/usr/bin/env python3
"""
Nginx Log Analyzer - Demonstrates Token Savings with MCP Code Execution

This script analyzes nginx access logs and returns compact summaries
instead of sending the entire log file to the LLM.

TOKEN SAVINGS DEMO:
- Without MCP: Send entire log file (~50,000 tokens)
- With MCP: Execute this script, return summary (~500 tokens)
- Savings: 100x reduction!
"""

import re
import json
from collections import defaultdict, Counter
from datetime import datetime


def parse_nginx_log(log_file_path):
    """
    Parse nginx log file and extract key metrics
    Returns a compact summary instead of raw logs
    """

    # Initialize counters
    status_codes = Counter()
    endpoints = Counter()
    errors_5xx = []
    errors_4xx = []
    ips = Counter()
    user_agents = Counter()
    hourly_traffic = defaultdict(int)
    methods = Counter()

    # Nginx log pattern
    pattern = r'(\S+) - - \[(.*?)\] "(\S+) (\S+) (\S+)" (\d+) (\d+) "(.*?)" "(.*?)"'

    total_requests = 0
    total_bytes = 0

    try:
        with open(log_file_path, 'r') as f:
            for line in f:
                match = re.match(pattern, line)
                if match:
                    total_requests += 1

                    ip = match.group(1)
                    timestamp = match.group(2)
                    method = match.group(3)
                    endpoint = match.group(4)
                    status = int(match.group(6))
                    size = int(match.group(7))
                    user_agent = match.group(9)

                    # Count status codes
                    status_codes[status] += 1

                    # Track endpoints
                    endpoints[endpoint] += 1

                    # Track errors
                    if 500 <= status < 600:
                        errors_5xx.append({
                            'endpoint': endpoint,
                            'status': status,
                            'ip': ip,
                            'timestamp': timestamp
                        })
                    elif 400 <= status < 500:
                        errors_4xx.append({
                            'endpoint': endpoint,
                            'status': status,
                            'ip': ip
                        })

                    # Track IPs
                    ips[ip] += 1

                    # Track methods
                    methods[method] += 1

                    # Track hourly traffic
                    try:
                        dt = datetime.strptime(timestamp, '%d/%b/%Y:%H:%M:%S %z')
                        hour = dt.strftime('%H:00')
                        hourly_traffic[hour] += 1
                    except:
                        pass

                    # Track user agents (simplified)
                    if 'bot' in user_agent.lower():
                        user_agents['bot'] += 1
                    elif 'curl' in user_agent.lower():
                        user_agents['curl'] += 1
                    elif 'Mozilla' in user_agent:
                        user_agents['browser'] += 1
                    else:
                        user_agents['other'] += 1

                    total_bytes += size

        # Calculate statistics
        success_rate = (status_codes.get(200, 0) / total_requests * 100) if total_requests > 0 else 0
        error_rate_5xx = (sum(1 for s in status_codes if 500 <= s < 600) / total_requests * 100) if total_requests > 0 else 0
        error_rate_4xx = (sum(1 for s in status_codes if 400 <= s < 500) / total_requests * 100) if total_requests > 0 else 0

        # Prepare compact summary
        summary = {
            'overview': {
                'total_requests': total_requests,
                'total_bytes_transferred': total_bytes,
                'avg_response_size': total_bytes // total_requests if total_requests > 0 else 0,
                'success_rate': f"{success_rate:.1f}%",
                'error_rate_5xx': f"{error_rate_5xx:.1f}%",
                'error_rate_4xx': f"{error_rate_4xx:.1f}%"
            },
            'status_codes': dict(status_codes.most_common()),
            'top_endpoints': dict(endpoints.most_common(10)),
            'http_methods': dict(methods),
            'top_ips': dict(ips.most_common(10)),
            'user_agents': dict(user_agents),
            'errors_5xx': {
                'count': len(errors_5xx),
                'details': errors_5xx[:5]  # Top 5 only
            },
            'errors_4xx': {
                'count': len(errors_4xx),
                'top_endpoints': dict(Counter([e['endpoint'] for e in errors_4xx]).most_common(5))
            },
            'hourly_traffic': dict(sorted(hourly_traffic.items())),
            'recommendations': []
        }

        # Add recommendations based on analysis
        if error_rate_5xx > 5:
            summary['recommendations'].append(
                f"⚠️  HIGH: {error_rate_5xx:.1f}% of requests are server errors (5xx). Investigate backend issues."
            )

        if error_rate_4xx > 20:
            summary['recommendations'].append(
                f"⚠️  MEDIUM: {error_rate_4xx:.1f}% of requests are client errors (4xx). Check for broken links or API changes."
            )

        if 404 in status_codes and status_codes[404] > total_requests * 0.1:
            summary['recommendations'].append(
                f"⚠️  MEDIUM: {status_codes[404]} requests are 404 Not Found. Review missing resources."
            )

        if not summary['recommendations']:
            summary['recommendations'].append("✅ No critical issues detected. System health looks good!")

        return summary

    except FileNotFoundError:
        return {
            'error': f'Log file not found: {log_file_path}',
            'suggestion': 'Please provide the correct path to the nginx log file'
        }
    except Exception as e:
        return {
            'error': f'Error analyzing logs: {str(e)}'
        }


if __name__ == '__main__':
    # Example usage - can be modified to accept command line args
    import sys

    if len(sys.argv) > 1:
        log_file = sys.argv[1]
    else:
        # Default to sample log in examples directory
        log_file = 'examples/sample-nginx.log'

    result = parse_nginx_log(log_file)

    # Print as formatted JSON
    print(json.dumps(result, indent=2))
