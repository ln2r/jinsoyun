const {createLogger, format, transports} = require('winston');

require('winston-mongodb');
const { combine, timestamp, label, printf } = format;
const levels = {error: 0, warn: 1, query: 2, info: 3, debug: 4, silly: 5};
const colors = {error: 'red', warn: 'yellow', info: 'green', debug: 'blue', silly: 'magenta'};

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
      format.errors({ stack: true }),
      label({ label: location }),
      timestamp(),
      format.splat(),
      myFormat
    ),
    transports: [
      new transports.Console(),
      new transports.MongoDB({
        db: 'mongodb://localhost:27017/jinsoyun',
        collection: 'log',
        options: {
          poolSize: 2,
          useNewUrlParser: true,
          useUnifiedTopology: true
        },
      }),
    ],
    exceptionHandlers: [
      new transports.Console(),
      new transports.MongoDB({
        db: 'mongodb://localhost:27017/jinsoyun',
        collection: 'winston',
        options: {
          poolSize: 2,
          useNewUrlParser: true,
          useUnifiedTopology: true
        },
      }),
    ],    
    levels: myLevels.levels
  });

  // winston logger
  logger.log(level, message);
};