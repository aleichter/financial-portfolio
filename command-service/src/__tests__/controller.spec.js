var ESDB = require("../db/esdb.js");
const config = require('config');
const { getPortfolioState, createPortfolio,
        addAccount, updateAccount, 
        depositCash, withdrawCash,
        payFees, receiveDividend, 
        buySecurity, sellSecurity,
        transferSecurityIn, transferSecurityOut,
        splitSecurity, consolidateSecurity,
        mergeSecurity, spinOffSecurity
     } = require("../controller/portfolio-controller");

const UUID_REGEX = new RegExp("^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$");


jest.mock('../db/esdb');
if(config.hasOwnProperty("testConfig") && config.testConfig.hasOwnProperty("unmockAll") && config.testConfig.unmockAll) {
    ESDB = jest.requireActual('../db/esdb');
}


describe("Test suite for portfolio-controller", () => {
    test("Create Portfolio test case", async () => {
        const response = await createPortfolio();
        expect(response.portfolioId).toMatch(UUID_REGEX);
        expect(response.nextExpectedRevision).toEqual("0");
    });

    test("Add Account test case", async () => {
        const createResponse = await createPortfolio();
        const response = await addAccount({
            portfolioId: createResponse.portfolioId,
            accountNumber: "123",
            expectedRevision: createResponse.nextExpectedRevision
        });
        expect(response.accountId).toMatch(UUID_REGEX);
        expect(response.nextExpectedRevision).toEqual("1");
    });

    test("Update Account test case", async () => {
        const createResponse = await createPortfolio();
        const addAccountResponse = await addAccount({
            portfolioId: createResponse.portfolioId,
            accountNumber: "123",
            expectedRevision: createResponse.nextExpectedRevision
        });
        const response = await updateAccount({
            portfolioId: createResponse.portfolioId,
            accountId: addAccountResponse.accountId,
            accountNumber: "098",
            expectedRevision: addAccountResponse.nextExpectedRevision
        });
        expect(response.nextExpectedRevision).toEqual("2");
    });

    test("Cash test cases", async () => {
        const createResponse = await createPortfolio();
        const addAccountResponse = await addAccount({
            portfolioId: createResponse.portfolioId,
            accountNumber: "123",
            expectedRevision: createResponse.nextExpectedRevision
        });
        const cashDepositResponse = await depositCash({
            portfolioId: createResponse.portfolioId,
            accountId: addAccountResponse.accountId,
            cashAdjustment: "10000000",
            settlementDate: "03/28/2021",
            expectedRevision: addAccountResponse.nextExpectedRevision
        });
        const cashWithdrawResponse = await withdrawCash({
            portfolioId: createResponse.portfolioId,
            accountId: addAccountResponse.accountId,
            cashAdjustment: "100000",
            settlementDate: "03/28/2021",
            expectedRevision: cashDepositResponse.nextExpectedRevision
        });
        const payFeesResponse = await payFees({
            portfolioId: createResponse.portfolioId,
            accountId: addAccountResponse.accountId,
            cashAdjustment: "1000",
            settlementDate: "03/28/2021",
            expectedRevision: cashWithdrawResponse.nextExpectedRevision
        });
        await receiveDividend({
            portfolioId: createResponse.portfolioId,
            accountId: addAccountResponse.accountId,
            cashAdjustment: "15000",
            settlementDate: "03/28/2021",
            expectedRevision: payFeesResponse.nextExpectedRevision
        });
        const portfolioState = await getPortfolioState({
            portfolioId: createResponse.portfolioId
        });
        expect(portfolioState.accounts[0].cashAmount).toEqual("9914000");
    });

    test("Securities test cases", async () => {
        const createResponse = await createPortfolio();
        const addAccountResponse = await addAccount({
            portfolioId: createResponse.portfolioId,
            accountNumber: "123",
            expectedRevision: createResponse.nextExpectedRevision
        });
        const cashDepositResponse = await depositCash({
            portfolioId: createResponse.portfolioId,
            accountId: addAccountResponse.accountId,
            cashAdjustment: "10000000",
            settlementDate: "03/28/2021",
            expectedRevision: addAccountResponse.nextExpectedRevision
        });
        const buySecurityResponse = await buySecurity({
            portfolioId: createResponse.portfolioId,
            accountId: addAccountResponse.accountId,
            securityId: "MSFT",
            quantityAdjustment: "100",
            cashAdjustment: "2000000",
            settlementDate: "03/28/2021",
            expectedRevision: cashDepositResponse.nextExpectedRevision 
        });
        const sellSecurityResponse = await sellSecurity({
            portfolioId: createResponse.portfolioId,
            accountId: addAccountResponse.accountId,
            securityId: "MSFT",
            quantityAdjustment: "50",
            cashAdjustment: "1000000",
            settlementDate: "03/28/2021",
            expectedRevision: buySecurityResponse.nextExpectedRevision 
        });
        const transferSecurityInResponse = await transferSecurityIn({
            portfolioId: createResponse.portfolioId,
            accountId: addAccountResponse.accountId,
            securityId: "APPL",
            quantityAdjustment: "150",
            settlementDate: "03/28/2021",
            expectedRevision: sellSecurityResponse.nextExpectedRevision 
        });
        const transferSecurityOutResponse = await transferSecurityOut({
            portfolioId: createResponse.portfolioId,
            accountId: addAccountResponse.accountId,
            securityId: "APPL",
            quantityAdjustment: "25",
            settlementDate: "03/28/2021",
            expectedRevision: transferSecurityInResponse.nextExpectedRevision 
        });
        const transferSecurityInResponse2 = await transferSecurityIn({
            portfolioId: createResponse.portfolioId,
            accountId: addAccountResponse.accountId,
            securityId: "DIS",
            quantityAdjustment: "150",
            settlementDate: "03/28/2021",
            expectedRevision: transferSecurityOutResponse.nextExpectedRevision 
        });
        const splitSecurityResponse = await splitSecurity({
            portfolioId: createResponse.portfolioId,
            accountId: addAccountResponse.accountId,
            securityId: "DIS",
            quantityAdjustment: "100",
            settlementDate: "03/28/2021",
            expectedRevision: transferSecurityInResponse2.nextExpectedRevision 
        });
        const consolidateSecurityResponse = await consolidateSecurity({
            portfolioId: createResponse.portfolioId,
            accountId: addAccountResponse.accountId,
            securityId: "DIS",
            quantityAdjustment: "25",
            settlementDate: "03/28/2021",
            expectedRevision: splitSecurityResponse.nextExpectedRevision 
        });
        const mergeSecurityResponse = await mergeSecurity({
            portfolioId: createResponse.portfolioId,
            accountId: addAccountResponse.accountId,
            acquiredSecurityId: "DIS",
            acquiringSecurityId: "DIS_ACQUIRER",
            acquiredQuantity: "225",
            acquiringQuantity: "125",
            settlementDate: "03/28/2021",
            expectedRevision: consolidateSecurityResponse.nextExpectedRevision 
        });
        const spinOffSecurityResponse = await spinOffSecurity({
            portfolioId: createResponse.portfolioId,
            accountId: addAccountResponse.accountId,
            existingSecurityId: "DIS_ACQUIRER",
            newSecurityId: "DIS_NEW",
            newQuantity: "125",
            settlementDate: "03/28/2021",
            expectedRevision: mergeSecurityResponse.nextExpectedRevision 
        });
        const portfolioState = await getPortfolioState({
            portfolioId: createResponse.portfolioId
        });
        expect(portfolioState.accounts.length).toEqual(1);
        expect(portfolioState.accounts[0].accountNumber).toEqual("123");
        expect(portfolioState.accounts[0].cashAmount).toEqual("9000000");
        expect(portfolioState.accounts[0].accountSecurities[0].securityId).toEqual("MSFT");
        expect(portfolioState.accounts[0].accountSecurities[0].quantity).toEqual("50");
        expect(portfolioState.accounts[0].accountSecurities[1].securityId).toEqual("APPL");
        expect(portfolioState.accounts[0].accountSecurities[1].quantity).toEqual("125");
        expect(portfolioState.accounts[0].accountSecurities[2].securityId).toEqual("DIS");
        expect(portfolioState.accounts[0].accountSecurities[2].quantity).toEqual("0");
        expect(portfolioState.accounts[0].accountSecurities[3].securityId).toEqual("DIS_ACQUIRER");
        expect(portfolioState.accounts[0].accountSecurities[3].quantity).toEqual("125");
        expect(portfolioState.accounts[0].accountSecurities[4].securityId).toEqual("DIS_NEW");
        expect(portfolioState.accounts[0].accountSecurities[4].quantity).toEqual("125");
    });
});