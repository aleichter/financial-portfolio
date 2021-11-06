const config = require("config");
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;
const myFormat = printf(({ level, message, label, timestamp }) => {
return `${timestamp} [${label}] ${level}: ${message}`;
});
const consoleTransport = new (transports.Console)({ level: config.logger.level })
const myWinstonOptions = {
    format: combine(
        format.splat(),
        label({ label: 'Portfolio Service' }),
        timestamp(),
        myFormat
      ),
    transports: [consoleTransport]
}

module.exports = new createLogger(myWinstonOptions)