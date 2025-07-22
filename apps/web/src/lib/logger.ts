import { NextStructuredLogger, type LogContext, type LogFormat } from '@workspace/logger';

const FORMAT = (process.env.LOG_FORMAT as LogFormat) || 'text';

type LoggerLevel = 'debug' | 'info' | 'log' | 'error' | 'warn' | 'fatal';

type LogDetails = {
  url: string;
  status: number;
  method: string;
  agent: string | null;
  message?: string;
  context?: LogContext;
};

const AGENTS: string[] = [
  'Chrome',
  'Firefox',
  'Safari',
  'Edge',
  'OPR',
  'Python-Requests',
  'Python',
  'Curl',
  'Postman',
  'Axios',
  'Node-Fetch',
  'Insomnia',
  'Googlebot',
  'Bingbot',
  'Twitterbot',
] as const;

/**
 * Formats a user agent string to extract and return a concise representation.
 * If the user agent matches one of the predefined agents, the agent name and version are returned.
 * If no match is found, the first part of the user agent string is returned.
 * If the input is null, 'Unknown' is returned.
 *
 * @param userAgent - The user agent string to be formatted.
 * @returns A formatted and concise representation of the user agent.
 */
function formatUserAgent(userAgent: string | null) {
  if (!userAgent) return 'Unknown';
  for (const agent of AGENTS) {
    const match = userAgent.match(new RegExp(`${agent}/(\\d+)`));
    if (match) {
      return `${agent} ${match[1]}`;
    }
  }
  return userAgent.split(' ')[0];
}

/**
 * **SERVER ONLY**
 *
 * Logs details about a specific event or action using the NextStructuredLogger.
 * The log includes information such as HTTP method, status, URL, user agent, and an optional message.
 *
 * @param level - The severity level of the log (e.g., 'debug', 'info', 'error').
 * @param name - The name of the logger instance or the context of the log.
 * @param details - An object containing log details such as the HTTP method, status, URL, user agent, and context.
 */
export function logger(level: LoggerLevel, name: string, details: LogDetails) {
  const logger = new NextStructuredLogger({ format: FORMAT, name });

  const { context, ...rest } = details;
  const shortUserAgent = formatUserAgent(rest.agent);

  logger[level](`${rest.method} ${rest.status} ${shortUserAgent} ${rest.url} ${rest.message || ''}`, context);
}
