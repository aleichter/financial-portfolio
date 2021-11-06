const Portfolio = require("../model/portfolio.js");
var ESDB = require("../db/esdb.js");
const config = require('config');
const { InvalidSettlementDate, SecurityDoesNotExistException, 
        NegativeSecurityQuantityException, WrongExpectedVersion, AccountDoesNotExist
        } = require("../model/exception/domain-exceptions.js");

const UUID_REGEX = new RegExp("^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$");

jest.mock('../db/esdb');
if(config.hasOwnProperty("testConfig") && config.testConfig.hasOwnProperty("unmockAll") && config.testConfig.unmockAll) {
    ESDB = jest.requireActual('../db/esdb');
}

describe("Test suite for Portfolio", () => {

    test("Create and manage a portfolio", async () => {
        const firstAccountNumber = "12345";
        const secondAccountNumber = "67890";
        const updatedAccountNumber = "09876";
        const firstAccountCashDeposit = "20000000";
        const firstAccountCashWithdraw = "100000";
        const secondAccountCashDeposit = "1500000";
        const secondAccountCashWithdraw = "200000";
        const settlementDate = "03/23/2021";
        const firstSecurityId = "APPL";
        const firstQuantityAdjustment = "100";
        const firstCashAmount = "1220000";
        const secondSecurityId = "APPL";
        const secondQuantityAdjustment = "10";
        const secondCashAmount = "122000";
        const thirdSecurityId = "GPN";
        const thirdQuantityAdjustment = "200";
        const thirdCashAmount = "4300000";
        const fourthSecurityId = "MSFT";
        const fourthQuantityAdjustment = "100";
        const fourthCashAmount = "500000";
        const fifthSecurityId = "GPN";
        const fifthQuantityAdjustment = "10";
        const fifthCashAmount = "215000";
        const sixthSecurityId = "MSFT";
        const sixthQuantityAdjustment = "10";
        const sixthCashAmount = "50000";
        const seventhSecurityId = "PYPL";
        const seventhQuantityAdjustment = "200";
        const eighthSecurityId = "PYPL";
        const eighthQuantityAdjustment = "50";
        const ninthQuantityAdjustment = "300";
        const tenthQuantityAdjustment = "50";
        const firstFeePaid = "2500";
        const dividend = "30000";

        const dbclient = new ESDB("esdb://localhost:2113?tls=false");
        const portfolio = new Portfolio(dbclient, 10);
        const portfolioId = (await portfolio.createPortfolio()).portfolioId;
        const firstAccountId = (await portfolio.addAccount(portfolioId, firstAccountNumber)).accountId;
        const secondAccountId = (await portfolio.addAccount(portfolioId, secondAccountNumber)).accountId;
        await portfolio.updateAccount(portfolioId, firstAccountId, updatedAccountNumber);
        await portfolio.depositCash(portfolioId, firstAccountId, firstAccountCashDeposit, settlementDate);
        await portfolio.withdrawCash(portfolioId, firstAccountId, firstAccountCashWithdraw, settlementDate);
        await portfolio.depositCash(portfolioId, secondAccountId, secondAccountCashDeposit, settlementDate);
        await portfolio.withdrawCash(portfolioId, secondAccountId, secondAccountCashWithdraw, settlementDate);
        await portfolio.buySecurity(portfolioId, firstAccountId, firstSecurityId, 
            firstQuantityAdjustment, firstCashAmount, "0", "0", settlementDate);
        await portfolio.buySecurity(portfolioId, firstAccountId, secondSecurityId, 
            secondQuantityAdjustment, secondCashAmount, "0","0", settlementDate);
        await portfolio.buySecurity(portfolioId, firstAccountId, thirdSecurityId, 
            thirdQuantityAdjustment, thirdCashAmount, "0","0",settlementDate);
        await portfolio.buySecurity(portfolioId, secondAccountId, fourthSecurityId, 
            fourthQuantityAdjustment, fourthCashAmount, "0", "0", settlementDate);
        await portfolio.buySecurity(portfolioId, firstAccountId, fifthSecurityId, 
            fifthQuantityAdjustment, fifthCashAmount, "0", "0", settlementDate);
        await portfolio.sellSecurity(portfolioId, secondAccountId, sixthSecurityId, 
            sixthQuantityAdjustment, sixthCashAmount,"0", "0", settlementDate);
        await portfolio.splitSecurity(portfolioId, secondAccountId, sixthSecurityId, 
            ninthQuantityAdjustment, settlementDate);
        await portfolio.consolidateSecurity(portfolioId, secondAccountId, sixthSecurityId, 
            tenthQuantityAdjustment, settlementDate);
        await portfolio.transferSecurityIn(portfolioId, secondAccountId, seventhSecurityId, 
            seventhQuantityAdjustment, settlementDate);
        await portfolio.transferSecurityOut(portfolioId, secondAccountId, eighthSecurityId, 
            eighthQuantityAdjustment, settlementDate);
        
        const firstTransferredInData = {
            securityId: "AMD",
            quantity: "200",
            acquiringSecurityId: "DIS",
            acquiringQuantity: "100"
        }
        await portfolio.transferSecurityIn(portfolioId, secondAccountId, firstTransferredInData.securityId,
            firstTransferredInData.quantity, settlementDate);
        await portfolio.mergeSecurity(portfolioId, secondAccountId, firstTransferredInData.securityId,
                firstTransferredInData.acquiringSecurityId, firstTransferredInData.quantity,
                firstTransferredInData.acquiringQuantity, settlementDate);
        await portfolio.payFees(portfolioId, firstAccountId, firstFeePaid, settlementDate);
        await portfolio.receiveDividend(portfolioId, firstAccountId, dividend, settlementDate);

        const spinOffData = {
            securityId: "NVDA",
            quantity: "300",
            newSecurityId: "NVDA_NEW",
            newQuantity: "225"
        }
        await portfolio.transferSecurityIn(portfolioId, secondAccountId, spinOffData.securityId,
            spinOffData.quantity, settlementDate);
        await portfolio.spinOffSecurity(portfolioId, secondAccountId, spinOffData.securityId,
            spinOffData.newSecurityId, spinOffData.newQuantity, settlementDate)

        const portfolioState = await portfolio.getPortfolioState(portfolioId);

        const firstAccountCashCalc = BigInt(firstAccountCashDeposit) - BigInt(firstAccountCashWithdraw) -
                                BigInt(firstCashAmount) - BigInt(secondCashAmount) - BigInt(thirdCashAmount) -
                                BigInt(fifthCashAmount) - BigInt(firstFeePaid) + BigInt(dividend);
        
        const secondAccountCashCalc = BigInt(secondAccountCashDeposit) - BigInt(secondAccountCashWithdraw) -
                                BigInt(fourthCashAmount) + BigInt(sixthCashAmount);

        const firstAccountFirstSecurityQuantity = BigInt(firstQuantityAdjustment) + BigInt(secondQuantityAdjustment);
        const firstAccountSecondSecurityQuantity = BigInt(thirdQuantityAdjustment) + BigInt(fifthQuantityAdjustment);
        const secondAccountFirstSecurityQuantity = BigInt(fourthQuantityAdjustment) - BigInt(sixthQuantityAdjustment) + 
                                                    BigInt(ninthQuantityAdjustment) - BigInt(tenthQuantityAdjustment);
        const secondAccountSecondSecurityQuantity = BigInt(seventhQuantityAdjustment) - BigInt(eighthQuantityAdjustment);

        expect(portfolioId).toMatch(UUID_REGEX);
        expect(firstAccountId).toMatch(UUID_REGEX);
        expect(secondAccountId).toMatch(UUID_REGEX);
        expect(portfolioState.accounts[0].accountNumber).toEqual(updatedAccountNumber);
        expect(portfolioState.accounts[0].cashAmount).toEqual(firstAccountCashCalc.toString());
        expect(portfolioState.accounts[1].cashAmount).toEqual(secondAccountCashCalc.toString());
        expect(portfolioState.accounts[0].accountSecurities[0].securityId).toEqual(firstSecurityId);
        expect(portfolioState.accounts[0].accountSecurities[0].quantity).toEqual(firstAccountFirstSecurityQuantity.toString());
        expect(portfolioState.accounts[0].accountSecurities[1].securityId).toEqual(thirdSecurityId);
        expect(portfolioState.accounts[0].accountSecurities[1].quantity).toEqual(firstAccountSecondSecurityQuantity.toString());
        expect(portfolioState.accounts[1].accountSecurities[0].securityId).toEqual(fourthSecurityId);
        expect(portfolioState.accounts[1].accountSecurities[0].quantity).toEqual(secondAccountFirstSecurityQuantity.toString());
        expect(portfolioState.accounts[1].accountSecurities[1].securityId).toEqual(seventhSecurityId);
        expect(portfolioState.accounts[1].accountSecurities[1].quantity).toEqual(secondAccountSecondSecurityQuantity.toString());
        expect(portfolioState.accounts[1].accountSecurities[2].securityId).toEqual(firstTransferredInData.securityId);
        expect(portfolioState.accounts[1].accountSecurities[2].quantity).toEqual("0");
        expect(portfolioState.accounts[1].accountSecurities[3].securityId).toEqual(firstTransferredInData.acquiringSecurityId);
        expect(portfolioState.accounts[1].accountSecurities[3].quantity).toEqual(firstTransferredInData.acquiringQuantity);
        expect(portfolioState.accounts[1].accountSecurities[4].securityId).toEqual(spinOffData.securityId);
        expect(portfolioState.accounts[1].accountSecurities[4].quantity).toEqual(spinOffData.quantity);
        expect(portfolioState.accounts[1].accountSecurities[5].securityId).toEqual(spinOffData.newSecurityId);
        expect(portfolioState.accounts[1].accountSecurities[5].quantity).toEqual(spinOffData.newQuantity);
    });

    test("Test portfolio updates with expectedRevision values", async () => {
        const firstAccountNumber = "102938";
        const secondAccountNumber = "657483";
        const firstAccountNumberUpdate = "019828374"
        const dbclient = new ESDB("esdb://localhost:2113?tls=false");
        const portfolio = new Portfolio(dbclient);
        const createResponse = await portfolio.createPortfolio();
        const portfolioId = createResponse.portfolioId;
        const addFirstAccountResponse = await portfolio.addAccount(portfolioId, 
            firstAccountNumber, createResponse.nextExpectedRevision);
        const addSecondAccountResponse = await portfolio.addAccount(portfolioId, 
            secondAccountNumber, addFirstAccountResponse.nextExpectedRevision);
        const updateAccountNextRevision = await portfolio.updateAccount(portfolioId, 
            addFirstAccountResponse.accountId, firstAccountNumberUpdate, 
            addSecondAccountResponse.nextExpectedRevision);
        const cashDeposit = "20000000";
        const settlementDate = "03/21/2021";
        const cashDepositNextRevision = await portfolio.depositCash(portfolioId, 
            addFirstAccountResponse.accountId, cashDeposit, settlementDate, updateAccountNextRevision);
        const cashWithdraw = "1000000";
        const cashWithdrawNextRevision = await portfolio.withdrawCash(portfolioId,
            addFirstAccountResponse.accountId, cashWithdraw, settlementDate, cashDepositNextRevision);
        const fee = "1000";
        const feesPaidNextRevision = await portfolio.payFees(portfolioId,
            addFirstAccountResponse.accountId, fee, settlementDate, cashWithdrawNextRevision);
        const dividend = "10000";
        const dividendNextRevision = await portfolio.receiveDividend(portfolioId,
            addFirstAccountResponse.accountId, dividend, settlementDate, feesPaidNextRevision);
        const firstSecurityId = "APPL";
        const firstSecurityQuantity = "100";
        const firstSecurityCost = "1000000";
        const buySecurityNextRevision = await portfolio.buySecurity(portfolioId, 
            addFirstAccountResponse.accountId, firstSecurityId, firstSecurityQuantity, firstSecurityCost, "0", "0",
            settlementDate, dividendNextRevision);
        const firstSecuritySaleQuantity = "50";
        const firstSecuritySaleCost = "500000";
        const sellSecurityNextRevision = await portfolio.sellSecurity(portfolioId, 
            addFirstAccountResponse.accountId, firstSecurityId, firstSecuritySaleQuantity, firstSecuritySaleCost, "0", "0",
            settlementDate, buySecurityNextRevision);
        const firstSecurityIdTransferIn = "MSFT";
        const firstSecurityIdTransferInQuantity = "200";
        const transferInNextRevision = await portfolio.transferSecurityIn(portfolioId,
            addFirstAccountResponse.accountId, firstSecurityIdTransferIn, firstSecurityIdTransferInQuantity,
            settlementDate, sellSecurityNextRevision);
        const firstSecurityIdTransferOutQuantity = "50";
        const transferOutNextRevision = await portfolio.transferSecurityOut(portfolioId,
            addFirstAccountResponse.accountId, firstSecurityIdTransferIn, firstSecurityIdTransferOutQuantity,
            settlementDate, transferInNextRevision);

        const cashCalc = BigInt(cashDeposit) - BigInt(cashWithdraw) - BigInt(fee) + BigInt(dividend) -
                        BigInt(firstSecurityCost) + BigInt(firstSecuritySaleCost);
        const firstSecurityQuantityCalc = BigInt(firstSecurityQuantity) - BigInt(firstSecuritySaleQuantity);
        const secondSecurityQuantityCalc = BigInt(firstSecurityIdTransferInQuantity) - BigInt(firstSecurityIdTransferOutQuantity);

        const portfolioState = await portfolio.getPortfolioState(portfolioId);
        
        expect(portfolioState.accounts[0].accountNumber).toEqual(firstAccountNumberUpdate);
        expect(portfolioState.accounts[1].accountNumber).toEqual(secondAccountNumber);
        expect(portfolioState.accounts[0].cashAmount).toEqual(cashCalc.toString());
        expect(portfolioState.accounts[0].accountSecurities[0].securityId).toEqual(firstSecurityId);
        expect(portfolioState.accounts[0].accountSecurities[0].quantity).toEqual(firstSecurityQuantityCalc.toString());
        expect(portfolioState.accounts[0].accountSecurities[1].securityId).toEqual(firstSecurityIdTransferIn);
        expect(portfolioState.accounts[0].accountSecurities[1].quantity).toEqual(secondSecurityQuantityCalc.toString());
    });

    test("Negative Tests", async () => {
        const securityId = "APPL";
        const quantityAdjustment = "100";
        const firstAccountNumber = "12345";
        const cashAmount = "1000000";
        const firstAccountCashDeposit = "2000000";
        const saleQuantityAdjustment = "200";
        const settlementDate = "03/23/2021";
        const dbclient = new ESDB("esdb://localhost:2113?tls=false");
        const portfolio = new Portfolio(dbclient);
        const createResponse = await portfolio.createPortfolio();
        const portfolioId = createResponse.portfolioId;
        const firstAccountId = (await portfolio.addAccount(portfolioId, firstAccountNumber)).accountId;

        await expect(portfolio.sellSecurity(portfolioId, firstAccountId, securityId, 
            quantityAdjustment, cashAmount, "0", "0", settlementDate))
            .rejects.toThrow(SecurityDoesNotExistException);
        
        await expect(portfolio.transferSecurityOut(portfolioId, firstAccountId, securityId, 
            quantityAdjustment, settlementDate))
            .rejects.toThrow(SecurityDoesNotExistException);

        await portfolio.depositCash(portfolioId, firstAccountId, firstAccountCashDeposit, settlementDate);
        await portfolio.buySecurity(portfolioId, firstAccountId, securityId, quantityAdjustment, 
            cashAmount, "0","0", settlementDate);
        
        await expect(portfolio.sellSecurity(portfolioId, firstAccountId, securityId, 
            saleQuantityAdjustment, cashAmount, "0", "0", settlementDate))
            .rejects.toThrow(NegativeSecurityQuantityException);

        await expect(portfolio.transferSecurityOut(portfolioId, firstAccountId, 
            securityId, quantityAdjustment, "BAD DATE STRING"))
            .rejects.toThrow(InvalidSettlementDate);
    });

    test("Negative test cases for expected revision", async () => {
        const firstAccountNumber = "12345";
        const dbclient = new ESDB("esdb://localhost:2113?tls=false");
        const portfolio = new Portfolio(dbclient);
        const portfolioId = (await portfolio.createPortfolio()).portfolioId;
        const firstAccountId = (await portfolio.addAccount(portfolioId, firstAccountNumber)).accountId;
        const updatedAccountNumber = "98765";
        const previousExpectedRevision = await portfolio
            .updateAccount(portfolioId, firstAccountId, updatedAccountNumber);
            
        const nextExpectedRevision = await portfolio
            .updateAccount(portfolioId, firstAccountId, firstAccountNumber);

        await expect(portfolio.updateAccount(portfolioId, firstAccountId, 
            updatedAccountNumber, previousExpectedRevision))
            .rejects.toThrow(WrongExpectedVersion);

        await expect(portfolio.addAccount("ABC", "123"))
            .rejects.toThrow(WrongExpectedVersion);

        await expect(portfolio.addAccount(portfolioId, firstAccountId, previousExpectedRevision))
            .rejects.toThrow(WrongExpectedVersion);

        await expect(portfolio.depositCash(portfolioId, firstAccountId, "100000", 
            "03/21/2021", previousExpectedRevision))
            .rejects.toThrow(WrongExpectedVersion);

        await expect(portfolio.withdrawCash(portfolioId, firstAccountId, "100000",
            "03/21/2021", previousExpectedRevision))
            .rejects.toThrow(WrongExpectedVersion);

        await expect(portfolio.payFees(portfolioId, firstAccountId, "100000", 
            "03/21/2021", previousExpectedRevision))
            .rejects.toThrow(WrongExpectedVersion);

        await expect(portfolio.receiveDividend(portfolioId, firstAccountId, 
            "100000", "03/21/2021", previousExpectedRevision))
            .rejects.toThrow(WrongExpectedVersion);
        
        await expect(portfolio.buySecurity(portfolioId, firstAccountId, "XYZ", "100", 
            "100000", "0", "0", "01/01/2020", previousExpectedRevision))
            .rejects.toThrow(WrongExpectedVersion);

        await expect(portfolio.transferSecurityIn(portfolioId, firstAccountId, "XYZ", 
            "100", "01/01/2020", previousExpectedRevision))
            .rejects.toThrow(WrongExpectedVersion);

        await portfolio.buySecurity(portfolioId, firstAccountId, "APPL", "1000", "10000000", "0","0","03/21/2021");

        await expect(portfolio.sellSecurity(portfolioId, firstAccountId, "APPL", "100", 
            "100000", "0", "0", "01/01/2020", previousExpectedRevision))
            .rejects.toThrow(WrongExpectedVersion);

        await expect(portfolio.transferSecurityOut(portfolioId, firstAccountId, "APPL", 
            "100", "01/01/2020", previousExpectedRevision))
            .rejects.toThrow(WrongExpectedVersion);
    });

    test("Negative test cases for AccountDoesNotExist", async () => {
        const firstAccountNumber = "12345";
        const dbclient = new ESDB("esdb://localhost:2113?tls=false");
        const portfolio = new Portfolio(dbclient);
        const portfolioId = (await portfolio.createPortfolio()).portfolioId;
        const firstAccountId = (await portfolio.addAccount(portfolioId, firstAccountNumber)).accountId;
        const updatedAccountNumber = "98765";
        const previousExpectedRevision = await portfolio
            .updateAccount(portfolioId, firstAccountId, updatedAccountNumber);
        
        const nextExpectedRevision = await portfolio
            .updateAccount(portfolioId, firstAccountId, firstAccountNumber);
        
        const badAccountId = "ABC";
        await expect(portfolio.updateAccount(portfolioId, badAccountId, 
            updatedAccountNumber, previousExpectedRevision))
            .rejects.toThrow(AccountDoesNotExist);

        await expect(portfolio.depositCash(portfolioId, badAccountId, "100000", 
            "03/21/2021", previousExpectedRevision))
            .rejects.toThrow(AccountDoesNotExist);

        await expect(portfolio.withdrawCash(portfolioId, badAccountId, "100000",
            "03/21/2021", previousExpectedRevision))
            .rejects.toThrow(AccountDoesNotExist);

        await expect(portfolio.payFees(portfolioId, badAccountId, "100000", 
            "03/21/2021", previousExpectedRevision))
            .rejects.toThrow(AccountDoesNotExist);

        await expect(portfolio.receiveDividend(portfolioId, badAccountId, 
            "100000", "03/21/2021", previousExpectedRevision))
            .rejects.toThrow(AccountDoesNotExist);
        
        await expect(portfolio.buySecurity(portfolioId, badAccountId, "XYZ", "100", 
            "100000", "0","0","01/01/2020", previousExpectedRevision))
            .rejects.toThrow(AccountDoesNotExist);

        await expect(portfolio.transferSecurityIn(portfolioId, badAccountId, "XYZ", 
            "100", "01/01/2020", previousExpectedRevision))
            .rejects.toThrow(AccountDoesNotExist);

        await expect(portfolio.sellSecurity(portfolioId, badAccountId, "APPL", "100", 
            "100000", "0", "0", "01/01/2020", previousExpectedRevision))
            .rejects.toThrow(AccountDoesNotExist);

        await expect(portfolio.transferSecurityOut(portfolioId, badAccountId, "APPL", 
            "100", "01/01/2020", previousExpectedRevision))
            .rejects.toThrow(AccountDoesNotExist);
    });
})