'use strict';

const { createLogger, format, transports } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const config = require('../config');

const { combine, timestamp, printf, colorize, errors, json } = format;

// ── Console format (dev) ──────────────────────────────────────────────────
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack }) =>
    stack
      ? `${ts} [${level}] ${message}\n${stack}`
      : `${ts} [${level}] ${message}`
  )
);

// ── JSON format (prod) ────────────────────────────────────────────────────
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

// ── Rotating file transport ───────────────────────────────────────────────
const fileTransport = new DailyRotateFile({
  dirname:       path.resolve(config.log.dir),
  filename:      'cashly-%DATE%.log',
  datePattern:   'YYYY-MM-DD',
  zippedArchive: true,
  maxSize:       '20m',
  maxFiles:      '30d',
  format:        prodFormat,
});

const errorFileTransport = new DailyRotateFile({
  dirname:       path.resolve(config.log.dir),
  filename:      'cashly-error-%DATE%.log',
  datePattern:   'YYYY-MM-DD',
  level:         'error',
  zippedArchive: true,
  maxSize:       '20m',
  maxFiles:      '60d',
  format:        prodFormat,
});

const logger = createLogger({
  level:       config.log.level,
  exitOnError: false,
  transports: [
    new transports.Console({
      format: config.isDev ? devFormat : prodFormat,
    }),
    fileTransport,
    errorFileTransport,
  ],
});

module.exports = logger;