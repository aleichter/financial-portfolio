import appConfig from '../config/appConfig';
import GrpcServer from './api/grpc-server';
import {
  getPortfolioState,
  createPortfolio,
  addAccount,
  updateAccount,
  depositCash,
  withdrawCash,
  payFees,
  receiveDividend,
  buySecurity,
  sellSecurity,
  transferSecurityIn,
  transferSecurityOut,
} from './controller/portfolio-controller';

function main(): void {
  const { grpcConfig } = appConfig;

  const api:GrpcServer = new GrpcServer(grpcConfig.proto, grpcConfig.bindAddress, grpcConfig.port);
  api.route('portfolio', 'PortfolioService', 'GetPortfolioState', getPortfolioState);
  api.route('portfolio', 'PortfolioService', 'CreatePortfolio', createPortfolio);
  api.route('portfolio', 'PortfolioService', 'AddAccount', addAccount);
  api.route('portfolio', 'PortfolioService', 'UpdateAccount', updateAccount);
  api.route('portfolio', 'PortfolioService', 'DepositCash', depositCash);
  api.route('portfolio', 'PortfolioService', 'WithdrawCash', withdrawCash);
  api.route('portfolio', 'PortfolioService', 'PayFees', payFees);
  api.route('portfolio', 'PortfolioService', 'ReceiveDividend', receiveDividend);
  api.route('portfolio', 'PortfolioService', 'BuySecurity', buySecurity);
  api.route('portfolio', 'PortfolioService', 'SellSecurity', sellSecurity);
  api.route('portfolio', 'PortfolioService', 'TransferSecurityIn', transferSecurityIn);
  api.route('portfolio', 'PortfolioService', 'TransferSecurityOut', transferSecurityOut);
  api.start();
}

main();
