const PortfolioBuilder = require('../src/model/portfolio-state-builder');

describe('Portfolio test', () => {
  test('PortfolioState Test', () => {
    let portfolio = PortfolioBuilder.build('123', 0n);
    expect(portfolio.get('portfolioId')).toEqual('123');
    expect(portfolio.get('revisionNumber')).toEqual(0n);

    portfolio = PortfolioBuilder.updateRevision(portfolio, 1n);
    expect(portfolio.get('revisionNumber')).toEqual(1n);

    let account = PortfolioBuilder.AccountBuilder.build('1001', '2001');
    portfolio = PortfolioBuilder.updateOrAddAccount(portfolio, account);
    expect(portfolio.get('accounts').get(0).get('accountId')).toEqual('1001');
    expect(portfolio.get('accounts').get(0).get('accountNumber')).toEqual('2001');

    account = PortfolioBuilder.AccountBuilder.build('1001', '3001');
    portfolio = PortfolioBuilder.updateOrAddAccount(portfolio, account);
    expect(portfolio.get('accounts').get(0).get('accountId')).toEqual('1001');
    expect(portfolio.get('accounts').get(0).get('accountNumber')).toEqual('3001');

    account = PortfolioBuilder.AccountBuilder.build('2001', '4001');
    portfolio = PortfolioBuilder.updateOrAddAccount(portfolio, account);
    expect(portfolio.get('accounts').get(1).get('accountId')).toEqual('2001');
    expect(portfolio.get('accounts').get(1).get('accountNumber')).toEqual('4001');

    portfolio = PortfolioBuilder.removeAccount(portfolio, account.get('accountId'));
    expect(portfolio.get('accounts').size).toEqual(1);

    let accountSecurity = PortfolioBuilder.AccountSecurityBuilder.build('APPL', '10000');
    account = PortfolioBuilder.getAccount(portfolio, '1001');
    account = PortfolioBuilder.AccountBuilder.updateOrAddAccountSecurity(account, accountSecurity);
    portfolio = PortfolioBuilder.updateOrAddAccount(portfolio, account);
    expect(portfolio.get('accounts').get(0).get('accountSecurities').get(0)
      .get('securityId')).toEqual('APPL');
    expect(portfolio.get('accounts').get(0).get('accountSecurities').get(0)
      .get('quantity')).toEqual('10000');

    accountSecurity = PortfolioBuilder.AccountSecurityBuilder.build('GPN', '20000');
    account = PortfolioBuilder.getAccount(portfolio, '1001');
    account = PortfolioBuilder.AccountBuilder.updateOrAddAccountSecurity(account, accountSecurity);
    portfolio = PortfolioBuilder.updateOrAddAccount(portfolio, account);
    expect(portfolio.get('accounts').get(0).get('accountSecurities').get(1)
      .get('securityId')).toEqual('GPN');
    expect(portfolio.get('accounts').get(0).get('accountSecurities').get(1)
      .get('quantity')).toEqual('20000');

    accountSecurity = PortfolioBuilder.AccountSecurityBuilder.build('GPN', '30000');
    account = PortfolioBuilder.getAccount(portfolio, '1001');
    account = PortfolioBuilder.AccountBuilder.updateOrAddAccountSecurity(account, accountSecurity);
    portfolio = PortfolioBuilder.updateOrAddAccount(portfolio, account);
    expect(portfolio.get('accounts').get(0).get('accountSecurities').get(1)
      .get('securityId')).toEqual('GPN');
    expect(portfolio.get('accounts').get(0).get('accountSecurities').get(1)
      .get('quantity')).toEqual('30000');

    account = PortfolioBuilder.getAccount(portfolio, '1001');
    accountSecurity = PortfolioBuilder.AccountBuilder.getAccountSecurity(account, 'GPN');
    expect(accountSecurity.get('quantity')).toEqual('30000');

    account = PortfolioBuilder.getAccount(portfolio, '1001');
    const cashAmount = BigInt(account.get('cashAmount')) + 1000n;
    account = PortfolioBuilder.AccountBuilder.updateCashAmount(account, cashAmount.toString());
    expect(account.get('cashAmount')).toEqual('1000');
  });
});
