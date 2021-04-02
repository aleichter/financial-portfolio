/*
    One of the key tenants to the event processor is that it should throw no exceptions.  It is 
    not the job of the event processor to validate if events were serialized correctly. The challenge
    with throwing exceptions in the event processor is that there is no way to recover.  Events are
    immutable and you cannot inject an new event into the middle of the stream.  It is append only
    so corrections can only be made to the end of the stream of events.  That means validation has
    to occur prior to appending new events and exception notifications can be thrown in the UI
    after state is calculated to indicate a correction event needs to be appended.  For example: 
    selling a security before it exists in the account should create a security with a 
    negative quantity even though this is an invalid state.  It is the aggregate root object that 
    should validate data consistency before serializing the event. 
*/

const PortfolioBuilder = require("../model/portfolio-state-builder");

const EVENT_TYPE = {
    PORTFOLIO_CREATED : "PORTFOLIO_CREATED",
    ACCOUNT_ADDED : "ACCOUNT_ADDED",
    ACCOUNT_UPDATED : "ACCOUNT_UPDATED",
    ACCOUNT_REMOVED : "ACCOUNT_REMOVED",
    SECURITY_BOUGHT : "SECURITY_BOUGHT",
    SECURITY_SOLD : "SECURITY_SOLD",
    CASH_DEPOSITED : "CASH_DEPOSITED",
    CASH_WITHDRAWN : "CASH_WITHDRAWN",
    SECURITY_TRANSFERRED_IN : "SECURITY_TRANSFERRED_IN",
    SECURITY_TRANSFERRED_OUT : "SECURITY_TRANSFERRED_OUT",
    SECURITY_SPLIT : "SECURITY_SPLIT",
    SECURITY_CONSOLIDATED : "SECURITY_CONSOLIDATED",
    SECURITY_MERGED : "SECURITY_MERGED",
    SECURITY_SPUNOFF : "SECURITY_SPUNOFF",
    FEES_PAID : "FEES_PAID",
    DIVIDEND_RECEIVED : "DIVIDEND_RECEIVED",
    SNAPSHOT_CREATED : "SNAPSHOT_CREATED"
}

const addCash = (portfolio, accountId, cashAmount) => {
    const account = PortfolioBuilder.getAccount(portfolio, accountId);
    const newCashAmount = BigInt(account.get("cashAmount")) + BigInt(cashAmount);
    return PortfolioBuilder.AccountBuilder.updateCashAmount(account, newCashAmount.toString());
}

const subtractCash = (portfolio, accountId, cashAmount) => {
    const account = PortfolioBuilder.getAccount(portfolio, accountId);
    const newCashAmount = BigInt(account.get("cashAmount")) - BigInt(cashAmount);
    return PortfolioBuilder.AccountBuilder.updateCashAmount(account, newCashAmount.toString());
}

const addSecurityQuantity = (account, quantityAdjustment, securityId) => {
    const security = PortfolioBuilder.AccountBuilder.getAccountSecurity(account, securityId);
    var newQuantity = quantityAdjustment;
    if(security.get("quantity") != null) {
        newQuantity = BigInt(security.get("quantity")) + BigInt(quantityAdjustment);
    }
    return PortfolioBuilder.AccountSecurityBuilder.build(securityId, newQuantity.toString());
}

const subtractSecurityQuantity = (account, quantityAdjustment, securityId) => {
    const security = PortfolioBuilder.AccountBuilder.getAccountSecurity(account, securityId);
    const newQuantity = BigInt(security.get("quantity")) - BigInt(quantityAdjustment);
    return PortfolioBuilder.AccountSecurityBuilder.build(securityId, newQuantity.toString());
}

exports.EVENT_TYPE = EVENT_TYPE;
exports.apply = (accum, event) => {
    var newAccum = null;
    const revision = event.event.revision.toString();
    switch(event.event.type) {
        case EVENT_TYPE.PORTFOLIO_CREATED:
            newAccum = PortfolioBuilder.build(event.event.data.portfolioId, revision);
            break;
        case EVENT_TYPE.ACCOUNT_UPDATED:
        case EVENT_TYPE.ACCOUNT_ADDED:
            var portfolioState = PortfolioBuilder.updateRevision(accum, revision);
            var account = PortfolioBuilder.AccountBuilder.build(event.event.data.accountId, event.event.data.accountNumber);
            newAccum = PortfolioBuilder.updateOrAddAccount(portfolioState, account);
            break;
        case EVENT_TYPE.ACCOUNT_REMOVED:
            var portfolioState = PortfolioBuilder.updateRevision(accum, revision);
            var account = PortfolioBuilder.getAccount(portfolioState, event.event.data.accountId);
            newAccum = PortfolioBuilder.removeAccount(portfolioState, event.event.data.accountId);
            break;
        case EVENT_TYPE.SECURITY_BOUGHT:
            var portfolioState = PortfolioBuilder.updateRevision(accum, revision);
            var updatedAccount = subtractCash(portfolioState, event.event.data.accountId, event.event.data.cashAmount);
            var newSecurity = addSecurityQuantity(updatedAccount, event.event.data.quantity, event.event.data.securityId);
            var newUpdatedAccountSecurity = PortfolioBuilder.AccountBuilder.updateOrAddAccountSecurity(updatedAccount, newSecurity);
            newAccum = PortfolioBuilder.updateOrAddAccount(portfolioState, newUpdatedAccountSecurity);
            break;
        case EVENT_TYPE.SECURITY_SOLD:
            var portfolioState = PortfolioBuilder.updateRevision(accum, revision);
            var account = PortfolioBuilder.getAccount(portfolioState, event.event.data.accountId);
            var security = PortfolioBuilder.AccountBuilder.getAccountSecurity(account, event.event.data.securityId);
            var updatedAccount = addCash(portfolioState, event.event.data.accountId, event.event.data.cashAmount);
            if(security.get("securityId") == null) {
                security = PortfolioBuilder.AccountSecurityBuilder.build(event.event.data.securityId, 0);
                updatedAccount = PortfolioBuilder.AccountBuilder.updateOrAddAccountSecurity(updatedAccount, security);
            }
            var newSecurity = subtractSecurityQuantity(updatedAccount, event.event.data.quantity, event.event.data.securityId);
            var newUpdatedAccountSecurity = PortfolioBuilder.AccountBuilder.updateOrAddAccountSecurity(updatedAccount, newSecurity);
            newAccum = PortfolioBuilder.updateOrAddAccount(portfolioState, newUpdatedAccountSecurity);     
            break;
        case EVENT_TYPE.SECURITY_MERGED:
            var portfolioState = PortfolioBuilder.updateRevision(accum, revision);
            var account = PortfolioBuilder.getAccount(portfolioState, event.event.data.accountId);
            var acquiredSecurity = PortfolioBuilder.AccountBuilder.getAccountSecurity(account, event.event.data.acquiredSecurityId);

            acquiredSecurity = subtractSecurityQuantity(account, event.event.data.acquiredQuantity, event.event.data.acquiredSecurityId);
            account = PortfolioBuilder.AccountBuilder.updateOrAddAccountSecurity(account, acquiredSecurity);
            
            var newSecurity = PortfolioBuilder.AccountSecurityBuilder.build(event.event.data.acquiringSecurityId, event.event.data.acquiringQuantity);
            var newUpdatedAccountSecurity = PortfolioBuilder.AccountBuilder.updateOrAddAccountSecurity(account, newSecurity);
            newAccum = PortfolioBuilder.updateOrAddAccount(portfolioState, newUpdatedAccountSecurity);     
            break;
        case EVENT_TYPE.SECURITY_SPUNOFF:
            var portfolioState = PortfolioBuilder.updateRevision(accum, revision);
            var account = PortfolioBuilder.getAccount(portfolioState, event.event.data.accountId);
            var newSecurity = PortfolioBuilder.AccountSecurityBuilder.build(event.event.data.newSecurityId, event.event.data.newQuantity);
            var newUpdatedAccountSecurity = PortfolioBuilder.AccountBuilder.updateOrAddAccountSecurity(account, newSecurity);
            newAccum = PortfolioBuilder.updateOrAddAccount(portfolioState, newUpdatedAccountSecurity);     
            break;
        case EVENT_TYPE.CASH_DEPOSITED:
        case EVENT_TYPE.DIVIDEND_RECEIVED:
            var portfolioState = PortfolioBuilder.updateRevision(accum, revision);
            var updatedAccount = addCash(portfolioState, event.event.data.accountId, event.event.data.cashAmount);
            newAccum = PortfolioBuilder.updateOrAddAccount(portfolioState, updatedAccount);
            break;
        case EVENT_TYPE.CASH_WITHDRAWN:
        case EVENT_TYPE.FEES_PAID:
            var portfolioState = PortfolioBuilder.updateRevision(accum, revision);
            var updatedAccount = subtractCash(portfolioState, event.event.data.accountId, event.event.data.cashAmount);
            newAccum = PortfolioBuilder.updateOrAddAccount(portfolioState, updatedAccount);
            break;
        case EVENT_TYPE.SECURITY_TRANSFERRED_IN:
            var portfolioState = PortfolioBuilder.updateRevision(accum, revision);
            var account = PortfolioBuilder.getAccount(portfolioState, event.event.data.accountId);
            var newSecurity = addSecurityQuantity(account, event.event.data.quantity, event.event.data.securityId);
            var newUpdatedAccountSecurity = PortfolioBuilder.AccountBuilder.updateOrAddAccountSecurity(account, newSecurity);
            newAccum = PortfolioBuilder.updateOrAddAccount(portfolioState, newUpdatedAccountSecurity);
            break;
        case EVENT_TYPE.SECURITY_SPLIT:
            var portfolioState = PortfolioBuilder.updateRevision(accum, revision);
            var account = PortfolioBuilder.getAccount(portfolioState, event.event.data.accountId);
            var newSecurity = addSecurityQuantity(account, event.event.data.distributedQuantity, event.event.data.securityId);
            var newUpdatedAccountSecurity = PortfolioBuilder.AccountBuilder.updateOrAddAccountSecurity(account, newSecurity);
            newAccum = PortfolioBuilder.updateOrAddAccount(portfolioState, newUpdatedAccountSecurity);
            break;
        case EVENT_TYPE.SECURITY_CONSOLIDATED:
            var portfolioState = PortfolioBuilder.updateRevision(accum, revision);
            var account = PortfolioBuilder.getAccount(portfolioState, event.event.data.accountId);
            var newSecurity = subtractSecurityQuantity(account, event.event.data.consolidatedQuantity, event.event.data.securityId);
            var newUpdatedAccountSecurity = PortfolioBuilder.AccountBuilder.updateOrAddAccountSecurity(account, newSecurity);
            newAccum = PortfolioBuilder.updateOrAddAccount(portfolioState, newUpdatedAccountSecurity);
            break;
        case EVENT_TYPE.SECURITY_TRANSFERRED_OUT:
            var portfolioState = PortfolioBuilder.updateRevision(accum, revision);
            var account = PortfolioBuilder.getAccount(portfolioState, event.event.data.accountId);
            var security = PortfolioBuilder.AccountBuilder.getAccountSecurity(account, event.event.data.securityId);
            if(security.get("securityId") == null) {
                security = PortfolioBuilder.AccountSecurityBuilder.build(event.event.data.securityId, 0);
                account = PortfolioBuilder.AccountBuilder.updateOrAddAccountSecurity(account, security);
            }
            var newSecurity = subtractSecurityQuantity(account, event.event.data.quantity, event.event.data.securityId);
            var newUpdatedAccountSecurity = PortfolioBuilder.AccountBuilder.updateOrAddAccountSecurity(account, newSecurity);
            newAccum = PortfolioBuilder.updateOrAddAccount(portfolioState, newUpdatedAccountSecurity);
            break;
    }

    return newAccum;
}