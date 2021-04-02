const { set } = require("immutable");
const PortfolioEventService = require("../service/portfolio-event-service");
const { accountAdded } = require("../service/portfolio-event-service");
const Moment = require("moment");
const PortfolioBuilder = require("../model/portfolio-state-builder");
const { AccountDoesNotExist, 
        InvalidSettlementDate, 
        SecurityDoesNotExistException, 
        NegativeSecurityQuantityException } = require("../model/exception/domain-exceptions");

const validateSettlementDate = (date) => {
    if(!(Moment(date,"MM/DD/YYYY", true).isValid())) {
        throw new InvalidSettlementDate(date);
    }
}

const validateAccountExists = (portfolioState, accountId) => {
    if(PortfolioBuilder.getAccount(portfolioState, accountId).get("accountId") == null) {
        throw new AccountDoesNotExist(accountId);
    }
}

const validateSecurityExists = (portfolioState, accountId, securityId) => {
    var account = PortfolioBuilder.getAccount(portfolioState, accountId);
    var security = PortfolioBuilder.AccountBuilder.getAccountSecurity(account, securityId);
    if(security.get("securityId") == null) {
        throw new SecurityDoesNotExistException(securityId);
    }
}

const validateNegativeSecurityQuantity = (portfolioState, accountId, securityId, quantityAdjustment) => {
    var account = PortfolioBuilder.getAccount(portfolioState, accountId);
    var security = PortfolioBuilder.AccountBuilder.getAccountSecurity(account, securityId);
    if(security.get("securityId") == null) {
        throw new SecurityDoesNotExistException(securityId);
    } else if(BigInt(security.get("quantity")) < BigInt(quantityAdjustment)) {
        throw new NegativeSecurityQuantityException(securityId, security.get("quantity"));
    }
}

class Portfolio {
    #eventService;

    constructor(dbclient, snapshotTrigger = 100) {
        this.#eventService = new PortfolioEventService(dbclient, snapshotTrigger);
    }
    async createPortfolio() {
        const portfolioCreated = PortfolioEventService.portfolioCreated();
        const response = await this.#eventService.save(portfolioCreated);
        const portfolioId = portfolioCreated.get("portfolioId");
        return { 
            portfolioId: portfolioId,
            nextExpectedRevision: response.nextExpectedRevision
        }
    }
    async getPortfolioState(portfolioId) {
        return (await this.#eventService.load(portfolioId)).toJS();
    }
    async addAccount(portfolioId, accountNumber, expectedRevision = null) {
        const accountAdded = PortfolioEventService.accountAdded(portfolioId, accountNumber);
        const response = await this.#eventService.save(accountAdded, expectedRevision);
        return {
            accountId: accountAdded.get("accountId"),
            nextExpectedRevision: response.nextExpectedRevision
        }
    }
    async updateAccount(portfolioId, accountId, accountNumber, expectedRevision = null) {
        validateAccountExists(await this.#eventService.load(portfolioId), accountId);
        const accountUpdated = PortfolioEventService.accountUpdated(portfolioId, accountId, accountNumber);
        const response = await this.#eventService.save(accountUpdated, expectedRevision);
        return response.nextExpectedRevision;
    }
    async buySecurity(portfolioId, accountId, securityId, quantityAdjustment, cashAdjustment, 
                        settlementDate, expectedRevision = null) {
        validateAccountExists(await this.#eventService.load(portfolioId), accountId);
        validateSettlementDate(settlementDate);        
        const securityBought = PortfolioEventService.securityBought(portfolioId, accountId, 
                                                                    securityId, quantityAdjustment, 
                                                                    cashAdjustment, settlementDate);
        const response = await this.#eventService.save(securityBought, expectedRevision);
        return response.nextExpectedRevision;
    }
    async sellSecurity(portfolioId, accountId, securityId, quantityAdjustment, cashAdjustment, 
                        settlementDate, expectedRevision = null) {
        const portfolioState = await this.#eventService.load(portfolioId);
        validateAccountExists(portfolioState, accountId);
        validateSettlementDate(settlementDate);
        validateNegativeSecurityQuantity(portfolioState, accountId, securityId, quantityAdjustment);
        const securitySold = PortfolioEventService.securitySold(portfolioId, accountId, securityId, 
                                                                quantityAdjustment, cashAdjustment, 
                                                                settlementDate);
        const response = await this.#eventService.save(securitySold, expectedRevision);
        return response.nextExpectedRevision;
    }
    async transferSecurityIn(portfolioId, accountId, securityId, quantityAdjustment, 
                                settlementDate, expectedRevision = null) {
        validateAccountExists(await this.#eventService.load(portfolioId), accountId);
        validateSettlementDate(settlementDate);
        const transferredIn = PortfolioEventService.securityTransferredIn(portfolioId, accountId, 
                                                                            securityId, quantityAdjustment, 
                                                                            settlementDate);
        const response = await this.#eventService.save(transferredIn, expectedRevision);
        return response.nextExpectedRevision;
    }
    async transferSecurityOut(portfolioId, accountId, securityId, quantityAdjustment, 
                                settlementDate, expectedRevision = null) {
        const portfolioState = await this.#eventService.load(portfolioId);
        validateAccountExists(portfolioState, accountId);
        validateSettlementDate(settlementDate);
        validateNegativeSecurityQuantity(portfolioState, accountId, securityId, quantityAdjustment);
        const transferredOut = PortfolioEventService.securityTransferredOut(portfolioId, accountId, 
                                                                            securityId, quantityAdjustment, 
                                                                            settlementDate);
        const response = await this.#eventService.save(transferredOut, expectedRevision);
        return response.nextExpectedRevision;
    }
    async splitSecurity(portfolioId, accountId, securityId, quantityAdjustment,
                        settlementDate, expectedRevision = null) {
        const portfolioState = await this.#eventService.load(portfolioId);
        validateAccountExists(portfolioState, accountId);
        validateSettlementDate(settlementDate);
        validateSecurityExists(portfolioState, accountId, securityId);
        const splitSecurityEvent = PortfolioEventService.securitySplit(portfolioId, accountId, 
                                                                        securityId, quantityAdjustment, 
                                                                        settlementDate);
        const response = await this.#eventService.save(splitSecurityEvent, expectedRevision);
        return response.nextExpectedRevision;
    }
    async consolidateSecurity(portfolioId, accountId, securityId, quantityAdjustment, 
                                settlementDate, expectedRevision = null) {
        const portfolioState = await this.#eventService.load(portfolioId);
        validateAccountExists(portfolioState, accountId);
        validateSettlementDate(settlementDate);
        validateSecurityExists(portfolioState, accountId, securityId);
        const securityConsolidatedEvent = PortfolioEventService.securityConsolidated(portfolioId, accountId, 
                                                                                securityId, quantityAdjustment, 
                                                                                settlementDate);
        const response = await this.#eventService.save(securityConsolidatedEvent, expectedRevision);
        return response.nextExpectedRevision;
    }
    async mergeSecurity(portfolioId, accountId, acquiredSecurityId, acquiringSecurityId, 
                        acquiredQuantity, acquiringQuantity, settlementDate, expectedRevision = null) {
        const portfolioState = await this.#eventService.load(portfolioId);
        validateAccountExists(portfolioState, accountId);
        validateSettlementDate(settlementDate);
        validateSecurityExists(portfolioState, accountId, acquiredSecurityId);
        const securityMergedEvent = PortfolioEventService.securityMerged(portfolioId, accountId,
                                                                        acquiredSecurityId, acquiringSecurityId,
                                                                        acquiredQuantity, acquiringQuantity,
                                                                        settlementDate, expectedRevision);
        const response = await this.#eventService.save(securityMergedEvent, expectedRevision);
        return response.nextExpectedRevision;
    }
    async spinOffSecurity(portfolioId, accountId, existingSecurityId, newSecurityId, 
                        newQuantity, settlementDate, expectedRevision = null) {
        const portfolioState = await this.#eventService.load(portfolioId);
        validateAccountExists(portfolioState, accountId);
        validateSettlementDate(settlementDate);
        validateSecurityExists(portfolioState, accountId, existingSecurityId);
        const securitySpunOff = PortfolioEventService.securitySpunOff(portfolioId, accountId,
                                                                        existingSecurityId, newSecurityId,
                                                                        newQuantity, settlementDate, 
                                                                        expectedRevision);
        const response = await this.#eventService.save(securitySpunOff, expectedRevision);
        return response.nextExpectedRevision;
    }
    async depositCash(portfolioId, accountId, cashAdjustment, settlementDate, expectedRevision = null) {
        validateAccountExists(await this.#eventService.load(portfolioId), accountId);
        validateSettlementDate(settlementDate);
        const cashDeposited = PortfolioEventService.cashDeposited(portfolioId, accountId, 
                                                                cashAdjustment, settlementDate);
        const response = await this.#eventService.save(cashDeposited, expectedRevision);
        return response.nextExpectedRevision;
    }
    async withdrawCash(portfolioId, accountId, cashAdjustment, settlementDate, expectedRevision = null) {
        validateAccountExists(await this.#eventService.load(portfolioId), accountId);
        validateSettlementDate(settlementDate);
        const cashWithdrawn = PortfolioEventService.cashWithdrawn(portfolioId, accountId, 
                                                                    cashAdjustment, settlementDate);
        const response = await this.#eventService.save(cashWithdrawn, expectedRevision);
        return response.nextExpectedRevision;
    }
    async payFees(portfolioId, accountId, feeAmount, settlementDate, expectedRevision = null) {
        validateAccountExists(await this.#eventService.load(portfolioId), accountId);
        validateSettlementDate(settlementDate);
        const feesPaid = PortfolioEventService.feesPaid(portfolioId, accountId, feeAmount, settlementDate);
        const response = await this.#eventService.save(feesPaid, expectedRevision);
        return response.nextExpectedRevision;
    }
    async receiveDividend(portfolioId, accountId, dividendAmount, settlementDate, expectedRevision = null) {
        validateAccountExists(await this.#eventService.load(portfolioId), accountId);
        validateSettlementDate(settlementDate);
        const dividendReceived = PortfolioEventService.dividendReceived(portfolioId, accountId, 
                                                                        dividendAmount, settlementDate);
        const response = await this.#eventService.save(dividendReceived, expectedRevision);
        return response.nextExpectedRevision;
    }
}

module.exports = Portfolio