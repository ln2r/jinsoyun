const {createLogger, format, transports} = require('winston');

require('winston-mongodb');
const { combine, timestamp, label, printf } = format;
const levels = {error: 0, warn: 1, info: 3};
const colors = {error: 'red', warn: 'yellow', info: 'green'};

const myLevels = {levels: levels, colors: colors};

/**
 * SendLog
 * for logging
 * @param {String} level log level
 * @param {String} location current log location
 * @param {String} message log message 
 */
module.exports = function(level, location, message){
  const myFormat = printf(info => {
    return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`;
  });

  const logger = createLogger({
    format: combine(
      format.colorize(),
      format.errors({ stack: true }),
      label({ label: location }),
      timestamp(),
      format.splat(),
      myFormat
    ),
    transports: [
      new transports.Console(),
      new transports.MongoDB({
        db: process.env.SOYUN_BOT_DB_CONNECT_URL,
        collection: 'log',
        options: {
          poolSize: 5,
          useNewUrlParser: true,
          useUnifiedTopology: true
        },
        level: 'error'
      }),
    ],    
    levels: myLevels.levels
  });

  // winston logger
  logger.log(level, message);
};