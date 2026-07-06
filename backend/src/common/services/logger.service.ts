import { Injectable, LoggerService, Scope } from '@nestjs/common';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import * as path from 'path';
import * as fs from 'fs';

const LOG_DIR = path.join(process.cwd(), 'logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(
    ({ timestamp, level, message, context, trace, ...meta }) => {
      const ctx = context ? `[${context}]` : '';
      const metaStr = Object.keys(meta).length
        ? ` ${JSON.stringify(meta)}`
        : '';
      const traceStr = trace ? `\n  trace: ${trace}` : '';
      return `${timestamp} ${level} ${ctx} ${message}${metaStr}${traceStr}`;
    },
  ),
);

const fileRotateTransport = (filename: string, level?: string) =>
  new winston.transports.DailyRotateFile({
    filename: path.join(LOG_DIR, `${filename}-%DATE%.log`),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    level,
    format: jsonFormat,
  });

@Injectable({ scope: Scope.TRANSIENT })
export class Logger implements LoggerService {
  private winston: winston.Logger;

  constructor(context?: string) {
    this.winston = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      transports: [
        fileRotateTransport('error', 'error'),
        fileRotateTransport('combined'),
        new winston.transports.Console({
          format: consoleFormat,
        }),
      ],
    });
    if (context) {
      this.winston.defaultMeta = { context };
    }
  }

  setContext(context: string) {
    this.winston.defaultMeta = { ...this.winston.defaultMeta, context };
  }

  log(message: string, ...optionalParams: any[]) {
    this.winston.info(message, ...optionalParams);
  }

  error(message: string, trace?: string, ...optionalParams: any[]) {
    this.winston.error(message, { trace, ...optionalParams?.[0] });
  }

  warn(message: string, ...optionalParams: any[]) {
    this.winston.warn(message, ...optionalParams);
  }

  debug(message: string, ...optionalParams: any[]) {
    this.winston.debug(message, ...optionalParams);
  }

  verbose(message: string, ...optionalParams: any[]) {
    this.winston.verbose(message, ...optionalParams);
  }
}
