/* 
    This project is implemented using the Domain Driven Design pattern
    portfolio-state-bulider.js is designed to create the state object for the
    portfolio state object which is an immutable dataset that is created by
    processing events from the event store.  The portfolio-event-service
    processes the events and uses this builder class to generate the 
    current state of a portfolio aggregate from the serialized events.
    An example of the portfolio state object is described here:
    {
        portfolioId: "123U-3432-83UD-1JF9",
        revisionNumber: 0n,
        accounts: [
            {
                accountId: "838J-48JD-JF82-19IS",
                accountNumber: "0123587",
                cashAmount: "100000",
                accountSecurities: [
                    {
                        securityId: "APPL",
                        quantity: "1000",
                        securityId: "MSFT",
                        quantity: "500"
                    }
                ]
            }
        ]
    }
    Note: All currency values are stored in whole numbers.
*/

const { Map, List, Seq } = require("immutable");

class PortfolioBuilder {
    static build(portfolioId, revisionNumber) {
         return Map({ portfolioId: portfolioId, revisionNumber: revisionNumber, accounts:List([]) });
    }

    static getAccount(portfolio, accountId) {
        return Map(Seq(portfolio.get("accounts")).filter(a => a.get("accountId") === accountId).get(0));
    }
    static updateOrAddAccount(portfolio, account) {
        const accounts = portfolio.get("accounts")
        for(var i = 0; i < accounts.size; i++) {
            if(accounts.get(i).get("accountId") == account.get("accountId")) {
                break;
            }
        }
        return portfolio.set("accounts", accounts.set(i, account));
    }

    static updateRevision(portfolio, newRevisionNumber) {
        return portfolio.set("revisionNumber", newRevisionNumber);
    }

    static removeAccount(portfolio, accountId) {
        var accounts = List(Seq(portfolio.get("accounts")).filter(a => a.get("accountId") != accountId));
        var newPortfolio = portfolio.toJS();
        newPortfolio.accounts = accounts;
        return Map(newPortfolio);
    }

    static AccountBuilder = class Account {
        static build(accountId, accountNumber) {
            return Map({accountId: accountId, accountNumber: accountNumber, cashAmount: "0", accountSecurities: List([])});
        }
        static getAccountSecurity(account, securityId) {
            return Map(Seq(account.get("accountSecurities")).filter(a => a.get("securityId") === securityId).get(0));
        }
        static updateCashAmount(account, cashAmount) {
            return account.merge({ cashAmount: cashAmount });
        }
        static updateOrAddAccountSecurity(account, accountSecurity) {
            const accountSecurities = account.get("accountSecurities")
            for(var i = 0; i < accountSecurities.size; i++) {
                if(accountSecurities.get(i).get("securityId") == accountSecurity.get("securityId")) {
                    break;
                }
            }
            return account.set("accountSecurities", accountSecurities.set(i, accountSecurity));
        }
    }
    
    static AccountSecurityBuilder = class AccountSecurity {
        static build(securityId, quantity) {
            return Map({securityId: securityId, quantity: quantity});
        }
    }
}

module.exports = PortfolioBuilder;