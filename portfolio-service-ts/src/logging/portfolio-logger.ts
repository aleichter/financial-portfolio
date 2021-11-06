import {
  createLogger, format, transports,
} from 'winston';
import appConfig from '../../config/appConfig';

const {
  combine, timestamp, label, printf,
} = format;
const myFormat = printf(({
  level, message, label, timestamp,
}) => `${timestamp} [${label}] ${level}: ${message}`);

const consoleTransport = new (transports.Console)({ level: appConfig.logger.level });
const myWinstonOptions = {
  format: combine(
    format.splat(),
    label({ label: 'Portfolio Service' }),
    timestamp(),
    myFormat,
  ),
  transports: [consoleTransport],
};
export default new (createLogger as any)(myWinstonOptions);
