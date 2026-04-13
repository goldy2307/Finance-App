'use strict';

const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');
const path = require('path');
const config = require('../config');

const { combine, timestamp, printf, colorize, errors } = format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}] ${stack || message}`;
});

const logger = createLogger({
  level: config.log.level,
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat
  ),
  transports: [
    // Console — colourised in dev, plain in prod
    new transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        logFormat
      ),
      silent: config.env === 'test',
    }),

    // Daily rotating file — errors only
    new transports.DailyRotateFile({
      filename:    path.join(config.log.dir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level:       'error',
      maxFiles:    '30d',
      zippedArchive: true,
    }),

    // Daily rotating file — all levels
    new transports.DailyRotateFile({
      filename:    path.join(config.log.dir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles:    '14d',
      zippedArchive: true,
    }),
  ],
});

module.exports = logger;