/**
 * Represents the color names used for logging.
 */
export type ColorName =
  | 'bold'
  | 'green'
  | 'yellow'
  | 'red'
  | 'magentaBright'
  | 'cyanBright'
  | 'cyan'
  | 'gray'
  | 'plain';

/**
 * Represents the log levels.
 */
export type LogLevel = 'verbose' | 'debug' | 'info' | 'log' | 'error' | 'warn' | 'fatal';

/**
 * Represents the severity levels of log messages.
 */
export type Severity = 'verbose' | 'debug' | 'info' | 'error' | 'warn' | 'fatal';

/**
 * Represents the format of log messages.
 *
 * Only `text` is supported. Extend this union (and add a corresponding output
 * path in `printMessage`) if structured formats are needed later.
 */
export type LogFormat = 'text';

/**
 * Represents the arguments for printing a log message.
 */
export interface PrintMessageArgs {
  /**
   * The log message.
   */
  message: string;
  /**
   * Additional parameters for the log message.
   */
  params: unknown[];
  /**
   * The context of the log message.
   */
  context: LogContext | null;
  /**
   * The severity level of the log message.
   */
  severity: Severity;
  /**
   * The stack trace of the log message.
   */
  stack?: string | null;
}

/**
 * Represents the options for configuring a logger.
 */
export interface LoggerOptions {
  /**
   * The name of the logger.
   */
  name?: string;
  /**
   * The logging level.
   */
  level?: LogLevel;
  /**
   * The format of the log messages.
   * @default 'text'
   */
  format?: LogFormat;
  /**
   * Whether the logger is enabled.
   * @default true
   */
  enabled?: boolean;
}

/**
 * Free-form log context. Callers may attach any structured metadata.
 */
export type LogContext = Record<string, unknown>;

/**
 * Interface for a structured logger.
 */
export interface IStructuredLogger {
  log(message: string, context?: LogContext): void;
  error(message: string | Error, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  debug(message: string, context?: LogContext): void;
  verbose(message: string, context?: LogContext): void;
  fatal(message: string | Error, context?: LogContext): void;
}

const logLevels: Record<LogLevel, number> = {
  verbose: 0,
  debug: 1,
  log: 2,
  info: 2,
  warn: 3,
  error: 4,
  fatal: 5,
};

function isPlainObject(obj: unknown): obj is Record<string, unknown> {
  return obj != null && Object.getPrototypeOf(obj) === Object.prototype;
}

/**
 * ANSI color codes for terminal output
 */
const ANSI_COLORS = {
  bold: '\x1B[1m',
  green: '\x1B[32m',
  yellow: '\x1B[33m',
  red: '\x1B[31m',
  magentaBright: '\x1B[95m',
  cyanBright: '\x1B[96m',
  cyan: '\x1B[36m',
  gray: '\x1B[90m',
  reset: '\x1B[0m',
  resetForeground: '\x1B[39m',
} as const;

export abstract class BaseLogger {
  /**
   * The logging level.
   */
  protected logLevel: LogLevel;

  /**
   * The format of the log messages.
   */
  protected format: LogFormat;

  /**
   * The name of the logger.
   */
  protected name: string;

  /**
   * Creates an instance of the logger.
   * @param options - The options for the logger.
   * @param options.logLevel - The logging level.
   * @param options.format - The format of the log messages.
   * @param options.name - The name of the logger.
   */
  constructor(options: { logLevel: LogLevel; format: LogFormat; name: string }) {
    this.logLevel = options.logLevel;
    this.format = options.format;
    this.name = options.name;
  }

  /**
   * Checks if the specified log level is enabled.
   * @param level - The log level to check.
   * @returns True if the log level is enabled, false otherwise.
   */
  protected isLevelEnabled(level: LogLevel): boolean {
    return logLevels[level] >= logLevels[this.logLevel];
  }

  /**
   * Prints the log message based on the specified format.
   * @param args - The arguments for the log message.
   */
  protected printMessage(args: PrintMessageArgs): void {
    if (this.format === 'text') {
      this.printText(args);
    }
  }

  /**
   * Prints the log message in text format.
   * @param message - The log message.
   * @param params - Additional parameters for the log message.
   * @param context - The context of the log message.
   * @param severity - The severity level of the log message.
   * @param stack - The stack trace of the log message.
   */
  protected printText({ message, params, context, severity, stack }: PrintMessageArgs) {
    const output: string[] = [
      this.colorize(severity.toUpperCase(), this.getColorNameByLogLevel(severity)),
      this.colorize(`[${this.name}]`, 'gray'),
    ];

    // Add message
    if (severity === 'error') {
      output.push(this.colorize(message, this.getColorNameByLogLevel(severity)));
    } else if (message) {
      output.push(message);
    }

    // Add context if it exists
    if (context) {
      const contextStr = this.formatObject(context);
      output.push(this.colorize(`[${contextStr}]`, 'yellow'));
    }

    // Add params
    for (const param of params) {
      if (isPlainObject(param)) {
        output.push(`${this.formatObject(param)}`);
      } else if (param) {
        output.push(`${this.colorize(`${param}`, 'bold')}`);
      }
    }

    this.print(output.filter((t) => t).join(' '));

    if (severity === 'error' && stack) {
      this.print(stack);
    }
  }

  protected print(str: string) {
    process.stdout.write(str + '\n');
  }

  /**
   * Formats an object into a string representation.
   * @param obj - The object to format.
   * @param parentKey - The parent key for nested objects.
   * @returns The formatted string representation of the object.
   */
  protected formatObject(obj: Record<string, unknown>, parentKey = ''): string {
    const values: string[] = [];
    for (const [key, value] of Object.entries(obj)) {
      if (isPlainObject(value)) {
        values.push(this.formatObject(value, `${parentKey}${key}.`));
      } else {
        const k = this.colorize(`${parentKey}${key}`, 'cyan');
        if (value === null) {
          values.push(`${k}=${this.colorize('null', 'gray')}`);
        } else if (value !== undefined) {
          values.push(`${k}=${value}`);
        }
      }
    }

    return values.join(' ');
  }

  protected extractMessages(messages: unknown[]): {
    message: string;
    params: unknown[];
    context: LogContext | null;
  } {
    let message = '';
    let params: unknown[] = [];
    if (typeof messages[0] === 'string') {
      message = messages[0];
      params = messages.slice(1);
    } else {
      params = messages;
    }

    if (params.length === 0) {
      return { message, params, context: null };
    }

    const last = params[params.length - 1];
    if (isPlainObject(last)) {
      return {
        message,
        params: params.slice(0, params.length - 1),
        context: last as LogContext,
      };
    } else {
      return { message, params, context: null };
    }
  }

  /**
   * Extracts the message, parameters, and context from the provided messages.
   * @param args - The array of messages to extract from.
   * @returns An object containing the extracted message, parameters, and context.
   */
  protected extractMessagesWithStack(args: unknown[]): {
    message: string;
    params: unknown[];
    context: LogContext | null;
    stack?: string | null;
  } {
    // Handle: Error, ...params, [context]
    if (args[0] instanceof Error) {
      return this.extractFromError(args[0], args.slice(1));
    }

    // Handle: message, Error, ...params, [context]
    if (args.length > 1 && typeof args[0] === 'string' && args[1] instanceof Error) {
      return this.extractFromErrorWithMessage(args[0], args[1], args.slice(2));
    }

    // Handle: message, stack OR value, stack
    if (args.length === 2 && this.isStackFormat(args[1])) {
      return this.extractFromStack(args[0], args[1]);
    }

    // Handle: message/value, stack, context
    if (args.length === 3 && this.isStackFormat(args[1])) {
      return this.extractFromStackWithContext(args[0], args[1], args[2]);
    }

    // Fallback: standard message extraction
    return this.extractMessages(args);
  }

  /**
   * Extracts message, stack, and context from an Error object and additional parameters.
   */
  private extractFromError(
    err: Error,
    params: unknown[],
  ): {
    message: string;
    params: unknown[];
    context: LogContext | null;
    stack?: string;
  } {
    const last = params[params.length - 1];
    if (isPlainObject(last)) {
      return {
        message: err.message,
        stack: err.stack,
        context: last as LogContext,
        params: params.slice(0, -1),
      };
    }
    return {
      message: err.message,
      stack: err.stack,
      context: null,
      params,
    };
  }

  /**
   * Extracts message, stack, and context when message precedes an Error object.
   */
  private extractFromErrorWithMessage(
    message: string,
    err: Error,
    params: unknown[],
  ): {
    message: string;
    params: unknown[];
    context: LogContext | null;
    stack?: string;
  } {
    const last = params[params.length - 1];
    if (isPlainObject(last)) {
      return {
        message,
        stack: err.stack,
        context: last as LogContext,
        params: params.slice(0, -1).concat([{ error: err.toString() }]),
      };
    }
    return {
      message,
      stack: err.stack,
      context: null,
      params: params.concat([{ error: err.toString() }]),
    };
  }

  /**
   * Extracts message and stack when args contain stack trace.
   */
  private extractFromStack(
    first: unknown,
    stack: string,
  ): {
    message: string;
    params: unknown[];
    context: LogContext | null;
    stack: string;
  } {
    if (typeof first === 'string') {
      return {
        message: first,
        params: [],
        context: null,
        stack,
      };
    }
    return {
      message: '',
      params: [first],
      context: null,
      stack,
    };
  }

  /**
   * Extracts message, stack, and context from three arguments where second is stack.
   */
  private extractFromStackWithContext(
    first: unknown,
    stack: string,
    last: unknown,
  ): {
    message: string;
    params: unknown[];
    context: LogContext | null;
    stack?: string;
  } {
    let message = '';
    let params: unknown[] = [];

    if (typeof first === 'string') {
      message = first;
    } else {
      params = [first];
    }

    if (isPlainObject(last)) {
      return {
        message,
        params,
        context: last as LogContext,
        stack,
      };
    }

    if (last === undefined) {
      return {
        message,
        params,
        context: null,
        stack,
      };
    }

    // If none of the above conditions, fall back to standard extraction
    return this.extractMessages([first, stack, last]);
  }

  protected isStackFormat(stack: unknown): stack is string {
    if (typeof stack !== 'string') {
      return false;
    }

    return /^(.)+\n\s+at .+:\d+:\d+/.test(stack);
  }

  protected colorize(text: string, colorName: ColorName): string {
    if (!text) return '';

    const colorMap: Record<ColorName, string> = {
      bold: `${ANSI_COLORS.bold}${text}${ANSI_COLORS.reset}`,
      green: `${ANSI_COLORS.green}${text}${ANSI_COLORS.resetForeground}`,
      yellow: `${ANSI_COLORS.yellow}${text}${ANSI_COLORS.resetForeground}`,
      red: `${ANSI_COLORS.red}${text}${ANSI_COLORS.resetForeground}`,
      magentaBright: `${ANSI_COLORS.magentaBright}${text}${ANSI_COLORS.resetForeground}`,
      cyanBright: `${ANSI_COLORS.cyanBright}${text}${ANSI_COLORS.resetForeground}`,
      cyan: `${ANSI_COLORS.cyan}${text}${ANSI_COLORS.resetForeground}`,
      gray: `${ANSI_COLORS.gray}${text}${ANSI_COLORS.resetForeground}`,
      plain: text,
    };

    return colorMap[colorName];
  }

  protected getColorNameByLogLevel(severity: Severity): ColorName {
    switch (severity) {
      case 'verbose':
        return 'cyanBright';
      case 'info':
        return 'green';
      case 'debug':
        return 'magentaBright';
      case 'warn':
        return 'yellow';
      case 'error':
        return 'red';
      case 'fatal':
        return 'bold';
      default:
        return 'plain';
    }
  }
}

/**
 * A structured logger for Next.js applications.
 *
 * Reads `LOG_LEVEL` from the environment to control verbosity. Output is
 * always text (colorized for terminals).
 */
export class StructuredLogger extends BaseLogger {
  protected print(str: string) {
    console.log(str);
  }

  /**
   * Creates an instance of StructuredLogger.
   * @param options - The options for the logger.
   */
  constructor(options: LoggerOptions = {}) {
    super({
      name: options.name || 'NextJS',
      logLevel: options.level || (process.env.LOG_LEVEL as LogLevel) || 'info',
      format: options.format || 'text',
    });
  }

  /**
   * Logs a message with 'info' severity.
   * @param message - The message to log.
   * @param context - The context of the log message.
   */
  log(message: string, context?: LogContext): void {
    this.logMessage(message, context, 'info', 'log');
  }

  /**
   * Logs a debug message.
   * @param message - The debug message.
   * @param context - The context of the log message.
   */
  debug(message: string, context?: LogContext): void {
    this.logMessage(message, context, 'debug', 'debug');
  }

  /**
   * Logs an info message.
   * @param message - The info message.
   * @param context - The context of the log message.
   */
  info(message: string, context?: LogContext): void {
    this.logMessage(message, context, 'info', 'info');
  }

  /**
   * Logs a warning message.
   * @param message - The warning message.
   * @param context - The context of the log message.
   */
  warn(message: string, context?: LogContext): void {
    this.logMessage(message, context, 'warn', 'warn');
  }

  /**
   * Logs an error message.
   * @param message - The error message or Error object.
   * @param context - The context of the log message.
   */
  error(message: string | Error, context?: LogContext): void {
    this.logMessage(message, context, 'error', 'error');
  }

  /**
   * Logs a fatal error message.
   * @param message - The fatal error message or Error object.
   * @param context - The context of the log message.
   */
  fatal(message: string | Error, context?: LogContext): void {
    this.logMessage(message, context, 'fatal', 'fatal');
  }

  /**
   * Logs a message with the specified severity level.
   */
  private logMessage(
    message: string | Error,
    context: LogContext | undefined,
    severity: Severity,
    logLevel: LogLevel,
  ): void {
    if (!this.isLevelEnabled(logLevel)) return;

    if (message instanceof Error) {
      const {
        message: msg,
        stack,
        params,
        context: ctx,
      } = this.extractMessagesWithStack([message, context]);
      this.printMessage({
        message: msg,
        stack,
        params,
        context: ctx,
        severity,
      });
    } else {
      const { message: msg, params, context: ctx } = this.extractMessages([message, context]);
      this.printMessage({
        message: msg,
        params,
        context: ctx,
        severity,
      });
    }
  }
}
