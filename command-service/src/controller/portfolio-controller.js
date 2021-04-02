const Portfolio = require("../model/portfolio");
const ESDB = require("../db/esdb");
const config = require("config");

if(!config.hasOwnProperty("esdbConfig") || !config.esdbConfig.hasOwnProperty("connection") ||
    !config.esdbConfig.hasOwnProperty("snapshotTrigger")) {
        throw new Error("configuration must include an esdbConfig node with both connection and snapshotTrigger properties");
}

const dbclient = new ESDB(config.esdbConfig.connection, config.esdbConfig.snapshotTrigger);
const portfolio = new Portfolio(dbclient);

exports.getPortfolioState = async (request) => {
    const response = await portfolio.getPortfolioState(request.portfolioId);
    return response;
}

exports.createPortfolio = async () => {
    const response = await portfolio.createPortfolio();
    return {
        portfolioId: response.portfolioId,
        nextExpectedRevision: response.nextExpectedRevision.toString()
    }
}

exports.addAccount = async (request) => {
    const response = await portfolio.addAccount(request.portfolioId, 
                                                request.accountNumber, request.expectedRevision);
    return {
        accountId: response.accountId,
        nextExpectedRevision: response.nextExpectedRevision.toString()
    }
}

exports.updateAccount = async (request) => {
    const response = await portfolio.updateAccount(request.portfolioId, request.accountId, 
                                                    request.accountNumber, request.expectedRevision);
    return {
        nextExpectedRevision: response.toString()
    }
}

exports.depositCash = async (request) => {
    const response = await portfolio.depositCash(request.portfolioId, request.accountId, 
                                                    request.cashAdjustment, request.settlementDate, 
                                                    request.expectedRevision);
    return {
        nextExpectedRevision: response.toString()
    }
}

exports.withdrawCash = async (request) => {
    const response = await portfolio.withdrawCash(request.portfolioId, request.accountId, 
                                                    request.cashAdjustment, request.settlementDate, 
                                                    request.expectedRevision);
    return {
        nextExpectedRevision: response.toString()
    }
}

exports.payFees = async (request) => {
    const response = await portfolio.payFees(request.portfolioId, request.accountId, 
                                                request.cashAdjustment, request.settlementDate, 
                                                request.expectedRevision);
    return {
        nextExpectedRevision: response.toString()
    }
}

exports.receiveDividend = async (request) => {
    const response = await portfolio.receiveDividend(request.portfolioId, request.accountId, 
                                                        request.cashAdjustment, request.settlementDate, 
                                                        request.expectedRevision);
    return {
        nextExpectedRevision: response.toString()
    }
}

exports.buySecurity = async (request) => {
    const response = await portfolio.buySecurity(request.portfolioId, request.accountId, 
                                                    request.securityId, request.quantityAdjustment, 
                                                    request.cashAdjustment, request.settlementDate, 
                                                    request.expectedRevision);
    return {
        nextExpectedRevision: response.toString()
    }
}

exports.sellSecurity = async (request) => {
    const response = await portfolio.sellSecurity(request.portfolioId, request.accountId, 
                                                    request.securityId, request.quantityAdjustment, 
                                                    request.cashAdjustment, request.settlementDate, 
                                                    request.expectedRevision);
    return {
        nextExpectedRevision: response.toString()
    }
}

exports.transferSecurityIn = async (request) => {
    const response = await portfolio.transferSecurityIn(request.portfolioId, request.accountId, 
                                                            request.securityId, request.quantityAdjustment, 
                                                            request.settlementDate, request.expectedRevision);
    return {
        nextExpectedRevision: response.toString()
    }
}

exports.transferSecurityOut = async (request) => {
    const response = await portfolio.transferSecurityOut(request.portfolioId, request.accountId, 
                                                            request.securityId, request.quantityAdjustment, 
                                                            request.settlementDate, request.expectedRevision);
    return {
        nextExpectedRevision: response.toString()
    }
}

exports.splitSecurity = async (request) => {
    const response = await portfolio.splitSecurity(request.portfolioId, request.accountId, 
                                                    request.securityId, request.quantityAdjustment, 
                                                    request.settlementDate, request.expectedRevision);
    return {
        nextExpectedRevision: response.toString()
    }
}

exports.consolidateSecurity = async (request) => {
    const response = await portfolio.consolidateSecurity(request.portfolioId, request.accountId, 
                                                        request.securityId, request.quantityAdjustment, 
                                                        request.settlementDate, request.expectedRevision);
    return {
        nextExpectedRevision: response.toString()
    }
}

exports.mergeSecurity = async (request) => {
    const response = await portfolio.mergeSecurity(request.portfolioId, request.accountId, 
                                                    request.acquiredSecurityId, request.acquiringSecurityId, 
                                                    request.acquiredQuantity, request.acquiringQuantity,
                                                    request.settlementDate, request.expectedRevision);
    return {
        nextExpectedRevision: response.toString()
    }                               
}

exports.spinOffSecurity = async (request) => {
    const response = await portfolio.spinOffSecurity(request.portfolioId, request.accountId, 
                                                    request.existingSecurityId, request.newSecurityId, 
                                                    request.newQuantity, request.settlementDate, 
                                                    request.expectedRevision);
}