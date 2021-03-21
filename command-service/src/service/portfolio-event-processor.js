const PortfolioBuilder = require("../model/portfolio-state-builder");
const { AccountUpdateException, SecurityDoesNotExistException } = require("../model/exception/domain-exceptions");
const { securityTransferedOut } = require("./portfolio-event-service");

const EVENT_TYPE = {
    PORTFOLIO_CREATED : "PORTFOLIO_CREATED",
    ACCOUNT_ADDED : "ACCOUNT_ADDED",
    ACCOUNT_UPDATED : "ACCOUNT_UPDATED",
    ACCOUNT_REMOVED : "ACCOUNT_REMOVED",
    SECURITY_BOUGHT : "SECURITY_BOUGHT",
    SECUIRTY_SOLD : "SECURITY_SOLD",
    CASH_DEPOSITED : "CASH_DEPOSITED",
    CASH_WITHDRAWN : "CASH_WITHDRAWN",
    SECURITY_TRANSFERED_IN : "SECURITY_TRANSFERED_IN",
    SECURITY_TRANSFERED_OUT : "SECURITY_TRANSFERED_OUT",
    FEES_PAID : "FEES_PAID",
    DIVIDEND_RECEIVED : "DIVIDEND_RECEIVED"
}

const addCash = (portfolio, accountId, cashAmount) => {
    var account = PortfolioBuilder.getAccount(portfolio, accountId);
    var newCashAmount = BigInt(account.get("cashAmount")) + BigInt(cashAmount);
    return PortfolioBuilder.AccountBuilder.updateCashAmount(account, newCashAmount.toString());
}

const subtractCash = (portfolio, accountId, cashAmount) => {
    var account = PortfolioBuilder.getAccount(portfolio, accountId);
    var newCashAmount = BigInt(account.get("cashAmount")) - BigInt(cashAmount);
    return PortfolioBuilder.AccountBuilder.updateCashAmount(account, newCashAmount.toString());
}

const addSecurityQuantity = (account, quantityAdjustment, securityId) => {
    var security = PortfolioBuilder.AccountBuilder.getAccountSecurity(account, securityId);
    var newQuantity = quantityAdjustment;
    if(security.get("quantity") != null) {
        newQuantity = BigInt(security.get("quantity")) + BigInt(quantityAdjustment);
    }
    return PortfolioBuilder.AccountSecurityBuilder.build(securityId, newQuantity.toString());
}

const subtractSecurityQuantity = (account, quantityAdjustment, securityId) => {
    var security = PortfolioBuilder.AccountBuilder.getAccountSecurity(account, securityId);
    var newQuantity = BigInt(security.get("quantity")) - BigInt(quantityAdjustment);
    return PortfolioBuilder.AccountSecurityBuilder.build(securityId, newQuantity.toString());
}

//TODO:  Check for accountId where it is used and throw domain exception if necessary
exports.EVENT_TYPE = EVENT_TYPE;
exports.apply = (accum, event) => {
    var newAccum = null;
    switch(event.event.type) {
        case EVENT_TYPE.PORTFOLIO_CREATED:
            var newAccum = PortfolioBuilder.build(event.event.data.portfolioId);
            break;
        case EVENT_TYPE.ACCOUNT_UPDATED:
            if(PortfolioBuilder.getAccount(accum, event.event.data.accountId).get("accountId") == null) {
                throw new AccountUpdateException(event.event.data.accountId);
            }
            //No break is intended.  ACCOUNT_ADDED and ACCOUNT_UPDATED is the same except for the check of
            //an existing account.
        case EVENT_TYPE.ACCOUNT_ADDED:
            var account = PortfolioBuilder.AccountBuilder.build(event.event.data.accountId, event.event.data.accountNumber);
            newAccum = PortfolioBuilder.updateOrAddAccount(accum, account);
            break;
        case EVENT_TYPE.ACCOUNT_REMOVED:
            var account = PortfolioBuilder.getAccount(accum, event.event.data.accountId);
            newAccum = PortfolioBuilder.removeAccount(accum, event.event.data.accountId);
            break;
        case EVENT_TYPE.SECURITY_BOUGHT:
            var updatedAccount = subtractCash(accum, event.event.data.accountId, event.event.data.cashAmount);
            var newSecurity = addSecurityQuantity(updatedAccount, event.event.data.quantity, event.event.data.securityId);
            var newUpdatedAccountSecurity = PortfolioBuilder.AccountBuilder.updateOrAddAccountSecurity(updatedAccount, newSecurity);
            newAccum = PortfolioBuilder.updateOrAddAccount(accum, newUpdatedAccountSecurity);
            break;
        case EVENT_TYPE.SECUIRTY_SOLD:
            var account = PortfolioBuilder.getAccount(accum, event.event.data.accountId);
            var security = PortfolioBuilder.AccountBuilder.getAccountSecurity(account, event.event.data.securityId);
            if(security.get("securityId") != null) {
                var updatedAccount = addCash(accum, event.event.data.accountId, event.event.data.cashAmount);
                var newSecurity = subtractSecurityQuantity(updatedAccount, event.event.data.quantity, event.event.data.securityId);
                var newUpdatedAccountSecurity = PortfolioBuilder.AccountBuilder.updateOrAddAccountSecurity(updatedAccount, newSecurity);
                newAccum = PortfolioBuilder.updateOrAddAccount(accum, newUpdatedAccountSecurity);                
            } else {
                throw new SecurityDoesNotExistException(event.event.data.securityId);
            }
            break;
        case EVENT_TYPE.CASH_DEPOSITED:
        case EVENT_TYPE.DIVIDEND_RECEIVED:
            var updatedAccount = addCash(accum, event.event.data.accountId, event.event.data.cashAmount);
            newAccum = PortfolioBuilder.updateOrAddAccount(accum, updatedAccount);
            break;
        case EVENT_TYPE.CASH_WITHDRAWN:
        case EVENT_TYPE.FEES_PAID:
            var updatedAccount = subtractCash(accum, event.event.data.accountId, event.event.data.cashAmount);
            newAccum = PortfolioBuilder.updateOrAddAccount(accum, updatedAccount);
            break;
        case EVENT_TYPE.SECURITY_TRANSFERED_IN:
            var account = PortfolioBuilder.getAccount(accum, event.event.data.accountId);
            var newSecurity = addSecurityQuantity(account, event.event.data.quantity, event.event.data.securityId);
            var newUpdatedAccountSecurity = PortfolioBuilder.AccountBuilder.updateOrAddAccountSecurity(account, newSecurity);
            newAccum = PortfolioBuilder.updateOrAddAccount(accum, newUpdatedAccountSecurity);
            break;
        case EVENT_TYPE.SECURITY_TRANSFERED_OUT:
            var account = PortfolioBuilder.getAccount(accum, event.event.data.accountId);
            var security = PortfolioBuilder.AccountBuilder.getAccountSecurity(account, event.event.data.securityId);
            if(security.get("securityId") != null) {
                var newSecurity = subtractSecurityQuantity(account, event.event.data.quantity, event.event.data.securityId);
                var newUpdatedAccountSecurity = PortfolioBuilder.AccountBuilder.updateOrAddAccountSecurity(account, newSecurity);
                newAccum = PortfolioBuilder.updateOrAddAccount(accum, newUpdatedAccountSecurity);
                break;
            } else {
                throw new SecurityDoesNotExistException(event.event.data.securityId);
            }
    }

    return newAccum;
}