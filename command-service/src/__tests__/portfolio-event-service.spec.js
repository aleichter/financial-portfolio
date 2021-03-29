const PortfolioEventService = require("../service/portfolio-event-service");
var ESDB = require("../db/esdb");
const config = require('config');
const { Map } = require("immutable");
const PortfolioBuilder = require("../model/portfolio-state-builder");
const { apply } = require("../service/portfolio-event-processor");

jest.mock('../db/esdb');
if(config.hasOwnProperty("testConfig") && config.testConfig.hasOwnProperty("unmockAll") && config.testConfig.unmockAll) {
    ESDB = jest.requireActual('../db/esdb');
}

describe("Test suite for PortolioEventService and event processor", () => {
    test("Test PortolioEventService portfolioCrated()", async () => {
        const createdEvent = PortfolioEventService.portfolioCreated();
        const portfolioId = createdEvent.get("portfolioId");
        const dbclient = new ESDB("esdb://localhost:2113?tls=false");
        const eventService = new PortfolioEventService(dbclient);
        const r = await eventService.save(createdEvent);
        const portfolioState = await eventService.load(portfolioId);
        expect(portfolioState.get("portfolioId")).toEqual(portfolioId);
        return eventService.delete(portfolioId);
    });

    test("Test PortolioEventService accountAdded()", async () => {
        const accountNumber =  "0123456789";
        const createdEvent = PortfolioEventService.portfolioCreated();
        const portfolioId = createdEvent.get("portfolioId");
        const accountAdded = PortfolioEventService.accountAdded(portfolioId, accountNumber);

        const dbclient = new ESDB("esdb://localhost:2113?tls=false");
        const eventService = new PortfolioEventService(dbclient);
        await eventService.save(createdEvent);
        await eventService.save(accountAdded);

        const portfolioState = await eventService.load(portfolioId);
        expect(portfolioState.get("portfolioId")).toEqual(portfolioId);
        expect(portfolioState.get("accounts").get(0).get("accountNumber")).toEqual(accountNumber);
        return eventService.delete(portfolioId);
    });

    test("Test PortolioEventService accountUpdated()", async () => {
        const accountNumber =  "0123456789";
        const updatedAccountNumber = "0987654321";
        const createdEvent = PortfolioEventService.portfolioCreated();
        const portfolioId = createdEvent.get("portfolioId");
        const accountAdded = PortfolioEventService.accountAdded(portfolioId, accountNumber);
        const accountUpdated = PortfolioEventService.accountUpdated(portfolioId, accountAdded.get("accountId"), updatedAccountNumber);

        const dbclient = new ESDB("esdb://localhost:2113?tls=false");
        const eventService = new PortfolioEventService(dbclient);
        await eventService.save(createdEvent);
        await eventService.save(accountAdded);

        const portfolioState = await eventService.load(portfolioId);

        await eventService.save(accountUpdated);
        const updatedPortfolioState = await eventService.load(portfolioId);

        expect(portfolioState.get("portfolioId")).toEqual(portfolioId);
        expect(portfolioState.get("accounts").get(0).get("accountNumber")).toEqual(accountNumber);
        expect(updatedPortfolioState.get("portfolioId")).toEqual(portfolioId);
        expect(updatedPortfolioState.get("accounts").get(0).get("accountNumber")).toEqual(updatedAccountNumber);

        return eventService.delete(portfolioId);
    });

    test("Test PortolioEventService ACCOUNT_UPDATED when no ACCOUNT_ADDED", async () => {
        const accountNumber =  "0123456789";
        const updatedAccountNumber = "0987654321";
        const createdEvent = PortfolioEventService.portfolioCreated();
        const portfolioId = createdEvent.get("portfolioId");
        const accountAdded = PortfolioEventService.accountAdded(portfolioId, accountNumber);
        const accountUpdated = PortfolioEventService.accountUpdated(portfolioId, accountAdded.get("accountId"), updatedAccountNumber);

        const dbclient = new ESDB("esdb://localhost:2113?tls=false");
        const eventService = new PortfolioEventService(dbclient);
        await eventService.save(createdEvent);
        //Update account without saving the accountAdded event.  Should behave same as accountAdded.
        await eventService.save(accountUpdated);

        portfolioState = (await eventService.load(portfolioId)).toJS();
        expect(portfolioState.accounts[0].accountId).toEqual(accountAdded.get("accountId"));
        expect(portfolioState.accounts[0].accountNumber).toEqual(updatedAccountNumber);
   
        return eventService.delete(portfolioId);
    });

    test("Test PortolioEventService add two account and update the second", async () => {
        const accountNumber1 =  "0123456789";
        const accountNumber2 = "0987654321";
        const updatedAccountNumber = "ABCDEFG";

        const createdEvent = PortfolioEventService.portfolioCreated();
        const portfolioId = createdEvent.get("portfolioId");

        const accountAdded1 = PortfolioEventService.accountAdded(portfolioId, accountNumber1);
        const accountAdded2 = PortfolioEventService.accountAdded(portfolioId, accountNumber2);

        const accountUpdated = PortfolioEventService.accountUpdated(portfolioId, accountAdded2.get("accountId"), updatedAccountNumber);

        const dbclient = new ESDB("esdb://localhost:2113?tls=false");
        const eventService = new PortfolioEventService(dbclient);
        await eventService.save(createdEvent);
        await eventService.save(accountAdded1);
        await eventService.save(accountAdded2);

        const portfolioState = await eventService.load(portfolioId);

        await eventService.save(accountUpdated);
        const updatedPortfolioState = await eventService.load(portfolioId);

        expect(portfolioState.get("portfolioId")).toEqual(portfolioId);
        expect(portfolioState.get("accounts").get(0).get("accountNumber")).toEqual(accountNumber1);
        expect(portfolioState.get("accounts").get(1).get("accountNumber")).toEqual(accountNumber2);
        expect(updatedPortfolioState.get("portfolioId")).toEqual(portfolioId);
        expect(portfolioState.get("accounts").get(0).get("accountNumber")).toEqual(accountNumber1);
        expect(updatedPortfolioState.get("accounts").get(1).get("accountNumber")).toEqual(updatedAccountNumber);

        return eventService.delete(portfolioId);
    });

    test("Test PortolioEventService add two account and remove the first", async () => {
        const accountNumber1 =  "0123456789";
        const accountNumber2 = "0987654321";
        const updatedAccountNumber = "ABCDEFG";

        const createdEvent = PortfolioEventService.portfolioCreated();
        const portfolioId = createdEvent.get("portfolioId");

        const accountAdded1 = PortfolioEventService.accountAdded(portfolioId, accountNumber1);
        const accountAdded2 = PortfolioEventService.accountAdded(portfolioId, accountNumber2);

        const accountRemoved = PortfolioEventService.accountRemoved(portfolioId, accountAdded1.get("accountId"));

        const dbclient = new ESDB("esdb://localhost:2113?tls=false");
        const eventService = new PortfolioEventService(dbclient);
        await eventService.save(createdEvent);
        await eventService.save(accountAdded1);
        await eventService.save(accountAdded2);

        const portfolioState = await eventService.load(portfolioId);

        await eventService.save(accountRemoved);
        const updatedPortfolioState = await eventService.load(portfolioId);

        expect(portfolioState.get("portfolioId")).toEqual(portfolioId);
        expect(portfolioState.get("accounts").get(0).get("accountNumber")).toEqual(accountNumber1);
        expect(portfolioState.get("accounts").get(1).get("accountNumber")).toEqual(accountNumber2);
        expect(updatedPortfolioState.get("portfolioId")).toEqual(portfolioId);
        expect(portfolioState.get("accounts").get(0).get("accountNumber")).toEqual(accountNumber1);
        expect(updatedPortfolioState.get("accounts").size).toEqual(1);
        expect(updatedPortfolioState.get("accounts").get(0).get("accountNumber")).toEqual(accountNumber2);

        return eventService.delete(portfolioId);
    });

    test("Test PortolioEventService with securityBought", async () => {
        const accountNumber =  "0123456789";
        const securityId = "APPL";
        const quantity = "1000";
        const cashAmount = "2000000";
        const createdEvent = PortfolioEventService.portfolioCreated();
        const portfolioId = createdEvent.get("portfolioId");
        const accountAdded = PortfolioEventService.accountAdded(portfolioId, accountNumber);
        const accountId = accountAdded.get('accountId');
        const securityBought = PortfolioEventService.securityBought(portfolioId, accountId, securityId, quantity, cashAmount);

        const dbclient = new ESDB("esdb://localhost:2113?tls=false");
        const eventService = new PortfolioEventService(dbclient);
        await eventService.save(createdEvent);
        await eventService.save(accountAdded);
        await eventService.save(securityBought);

        const portfolioState = await eventService.load(portfolioId);
        expect(portfolioState.get("portfolioId")).toEqual(portfolioId);
        expect(portfolioState.get("accounts").get(0).get("accountNumber")).toEqual(accountNumber);
        expect(BigInt(portfolioState.get("accounts").get(0).get("cashAmount"))).toEqual(BigInt(cashAmount) * -1n);
        expect(portfolioState.get("accounts").get(0).get("accountSecurities").get(0).get("securityId")).toEqual(securityId);
        expect(portfolioState.get("accounts").get(0).get("accountSecurities").get(0).get("quantity")).toEqual(quantity);
    });

    test("Test PortolioEventService with two different securityBought", async () => {
        const accountNumber =  "0123456789";
        const securityId1 = "APPL";
        const quantity1 = "1000";
        const cashAmount1 = "2000000";
        const securityId2 = "GPN";
        const quantity2 = "500";
        const cashAmount2 = "1000000";
        const createdEvent = PortfolioEventService.portfolioCreated();
        const portfolioId = createdEvent.get("portfolioId");
        const accountAdded = PortfolioEventService.accountAdded(portfolioId, accountNumber);
        const accountId = accountAdded.get('accountId');
        const securityBought1 = PortfolioEventService.securityBought(portfolioId, accountId, securityId1, quantity1, cashAmount1);
        const securityBought2 = PortfolioEventService.securityBought(portfolioId, accountId, securityId2, quantity2, cashAmount2);

        const dbclient = new ESDB("esdb://localhost:2113?tls=false");
        const eventService = new PortfolioEventService(dbclient);
        await eventService.save(createdEvent);
        await eventService.save(accountAdded);
        await eventService.save(securityBought1);
        await eventService.save(securityBought2);

        const portfolioState = await eventService.load(portfolioId);
        expect(portfolioState.get("portfolioId")).toEqual(portfolioId);
        expect(portfolioState.get("accounts").get(0).get("accountNumber")).toEqual(accountNumber);
        expect(BigInt(portfolioState.get("accounts").get(0).get("cashAmount"))).toEqual((BigInt(cashAmount1) + BigInt(cashAmount2)) * -1n);
        expect(portfolioState.get("accounts").get(0).get("accountSecurities").get(0).get("securityId")).toEqual(securityId1);
        expect(portfolioState.get("accounts").get(0).get("accountSecurities").get(0).get("quantity")).toEqual(quantity1);
        expect(portfolioState.get("accounts").get(0).get("accountSecurities").get(1).get("securityId")).toEqual(securityId2);
        expect(portfolioState.get("accounts").get(0).get("accountSecurities").get(1).get("quantity")).toEqual(quantity2);
    });

    test("Test PortolioEventService with securitySold", async () => {
        const accountNumber =  "0123456789";
        const securityId = "APPL";
        const quantity = "1000";
        const cashAmount = "2000000";
        const quantitySold = "500";
        const cashAmountSold = "1000000"
        const createdEvent = PortfolioEventService.portfolioCreated();
        const portfolioId = createdEvent.get("portfolioId");
        const accountAdded = PortfolioEventService.accountAdded(portfolioId, accountNumber);
        const accountId = accountAdded.get('accountId');
        const securityBought = PortfolioEventService.securityBought(portfolioId, accountId, securityId, quantity, cashAmount);
        const securitySold = PortfolioEventService.securitySold(portfolioId, accountId, securityId, quantitySold, cashAmountSold);

        const dbclient = new ESDB("esdb://localhost:2113?tls=false");
        const eventService = new PortfolioEventService(dbclient);
        await eventService.save(createdEvent);
        await eventService.save(accountAdded);
        await eventService.save(securityBought);
        await eventService.save(securitySold);

        const portfolioState = await eventService.load(portfolioId);
        expect(portfolioState.get("portfolioId")).toEqual(portfolioId);
        expect(portfolioState.get("accounts").get(0).get("accountNumber")).toEqual(accountNumber);
        expect(portfolioState.get("accounts").get(0).get("cashAmount")).toEqual("-1000000");
        expect(portfolioState.get("accounts").get(0).get("accountSecurities").get(0).get("securityId")).toEqual(securityId);
        expect(portfolioState.get("accounts").get(0).get("accountSecurities").get(0).get("quantity")).toEqual("500");
    });

    test("Test PortolioEventService with cash deposited and withdrawn", async () => {
        const accountNumber =  "0123456789";
        const cashAmountDeposited = "2000000";
        const cashAmountWithdrawn = "1000000"
        const createdEvent = PortfolioEventService.portfolioCreated();
        const portfolioId = createdEvent.get("portfolioId");
        const accountAdded = PortfolioEventService.accountAdded(portfolioId, accountNumber);
        const accountId = accountAdded.get('accountId');
        const cashDeposited = PortfolioEventService.cashDeposited(portfolioId, accountId, cashAmountDeposited);
        const cashWithdrawn = PortfolioEventService.cashWithdrawn(portfolioId, accountId, cashAmountWithdrawn);

        const dbclient = new ESDB("esdb://localhost:2113?tls=false");
        const eventService = new PortfolioEventService(dbclient);
        await eventService.save(createdEvent);
        await eventService.save(accountAdded);
        await eventService.save(cashDeposited);
        await eventService.save(cashWithdrawn);

        const portfolioState = await eventService.load(portfolioId);
        expect(portfolioState.get("portfolioId")).toEqual(portfolioId);
        expect(portfolioState.get("accounts").get(0).get("accountNumber")).toEqual(accountNumber);
        expect(portfolioState.get("accounts").get(0).get("cashAmount")).toEqual("1000000");
    });

    test("Test PortolioEventService with SECURITY_TRANSFERRED_IN and SECURITY_TRANSFERRED_OUT", async () => {
        const accountNumber =  "0123456789";
        const securityId = "APPL";
        const quantity = "1000";
        const quantityTransferredOut = "500";
        const createdEvent = PortfolioEventService.portfolioCreated();
        const portfolioId = createdEvent.get("portfolioId");
        const accountAdded = PortfolioEventService.accountAdded(portfolioId, accountNumber);
        const accountId = accountAdded.get('accountId');
        const securityTransferredIn = PortfolioEventService.securityTransferredIn(portfolioId, accountId, securityId, quantity);
        const securityTransferredOut = PortfolioEventService.securityTransferredOut(portfolioId, accountId, securityId, quantityTransferredOut);

        const dbclient = new ESDB("esdb://localhost:2113?tls=false");
        const eventService = new PortfolioEventService(dbclient);
        await eventService.save(createdEvent);
        await eventService.save(accountAdded);
        await eventService.save(securityTransferredIn);
        await eventService.save(securityTransferredOut);

        const portfolioState = await eventService.load(portfolioId);
        expect(portfolioState.get("portfolioId")).toEqual(portfolioId);
        expect(portfolioState.get("accounts").get(0).get("accountNumber")).toEqual(accountNumber);
        expect(portfolioState.get("accounts").get(0).get("accountSecurities").get(0).get("securityId")).toEqual(securityId);
        expect(portfolioState.get("accounts").get(0).get("accountSecurities").get(0).get("quantity")).toEqual("500");
    });

    test("Test PortolioEventService with FEES_PAID and DIVIDEND_RECEIEVED", async () => {
        const accountNumber =  "0123456789";
        const cashAmountDeposited = "2000000";
        const cashAmountWithdrawn = "1000000"
        const createdEvent = PortfolioEventService.portfolioCreated();
        const portfolioId = createdEvent.get("portfolioId");
        const accountAdded = PortfolioEventService.accountAdded(portfolioId, accountNumber);
        const accountId = accountAdded.get('accountId');
        const dividendReceived = PortfolioEventService.dividendReceived(portfolioId, accountId, cashAmountDeposited);
        const feesPaid = PortfolioEventService.feesPaid(portfolioId, accountId, cashAmountWithdrawn);

        const dbclient = new ESDB("esdb://localhost:2113?tls=false");
        const eventService = new PortfolioEventService(dbclient);
        await eventService.save(createdEvent);
        await eventService.save(accountAdded);
        await eventService.save(dividendReceived);
        await eventService.save(feesPaid);

        const portfolioState = await eventService.load(portfolioId);
        expect(portfolioState.get("portfolioId")).toEqual(portfolioId);
        expect(portfolioState.get("accounts").get(0).get("accountNumber")).toEqual(accountNumber);
        expect(portfolioState.get("accounts").get(0).get("cashAmount")).toEqual("1000000");
    });
    
    test("Test PortolioEventService two subsequent securityBought events on the same securityId", async () => {
        const accountNumber =  "0123456789";
        const securityId = "APPL";
        const quantity = "1000";
        const cashAmount = "2000000";
        const quantityAdditional = "500";
        const cashAmountAdditional = "1000000";
        const createdEvent = PortfolioEventService.portfolioCreated();
        const portfolioId = createdEvent.get("portfolioId");
        const accountAdded = PortfolioEventService.accountAdded(portfolioId, accountNumber);
        const accountId = accountAdded.get('accountId');
        const securityBought = PortfolioEventService.securityBought(portfolioId, accountId, securityId, quantity, cashAmount);
        const securityBoughtAdditional = PortfolioEventService.securityBought(portfolioId, accountId, securityId, quantityAdditional, cashAmountAdditional);

        const dbclient = new ESDB("esdb://localhost:2113?tls=false");
        const eventService = new PortfolioEventService(dbclient);
        await eventService.save(createdEvent);
        await eventService.save(accountAdded);
        await eventService.save(securityBought);
        await eventService.save(securityBoughtAdditional);

        const portfolioState = await eventService.load(portfolioId);
        expect(portfolioState.get("portfolioId")).toEqual(portfolioId);
        expect(portfolioState.get("accounts").get(0).get("accountNumber")).toEqual(accountNumber);
        expect(BigInt(portfolioState.get("accounts").get(0).get("cashAmount"))).toEqual((BigInt(cashAmount) + BigInt(cashAmountAdditional)) * -1n);
        expect(portfolioState.get("accounts").get(0).get("accountSecurities").get(0).get("securityId")).toEqual(securityId);
        expect(BigInt(portfolioState.get("accounts").get(0).get("accountSecurities").get(0).get("quantity"))).toEqual(BigInt(quantity) + BigInt(quantityAdditional));
    });

    test("Test PortolioEventService with securitySold with no securityBought", async () => {
        const accountNumber =  "0123456789";
        const securityId = "APPL";
        const quantitySold = "500";
        const cashAmountSold = "1000000"
        const createdEvent = PortfolioEventService.portfolioCreated();
        const portfolioId = createdEvent.get("portfolioId");
        const accountAdded = PortfolioEventService.accountAdded(portfolioId, accountNumber);
        const accountId = accountAdded.get('accountId');
        const securitySold = PortfolioEventService.securitySold(portfolioId, accountId, securityId, quantitySold, cashAmountSold);

        const dbclient = new ESDB("esdb://localhost:2113?tls=false");
        const eventService = new PortfolioEventService(dbclient);
        await eventService.save(createdEvent);
        await eventService.save(accountAdded);
        await eventService.save(securitySold);

        const portfolioState = await eventService.load(portfolioId);
        expect(portfolioState.get("accounts").get(0).get("cashAmount")).toEqual(cashAmountSold);
        expect(portfolioState.get("accounts").get(0).get("accountSecurities").get(0).get("securityId")).toEqual(securityId);
        expect(portfolioState.get("accounts").get(0).get("accountSecurities").get(0).get("quantity")).toEqual((BigInt(quantitySold) * -1n).toString());
    });

    test("Test PortolioEventService with SECURITY_TRANSFERED_OUT without SECURITY_TRANSFERED_IN", async () => {
        const accountNumber =  "0123456789";
        const securityId = "APPL";
        const quantityTransferredOut = "500";
        const createdEvent = PortfolioEventService.portfolioCreated();
        const portfolioId = createdEvent.get("portfolioId");
        const accountAdded = PortfolioEventService.accountAdded(portfolioId, accountNumber);
        const accountId = accountAdded.get('accountId');
        const securityTransferredOut = PortfolioEventService.securityTransferredOut(portfolioId, accountId, securityId, quantityTransferredOut);

        const dbclient = new ESDB("esdb://localhost:2113?tls=false");
        const eventService = new PortfolioEventService(dbclient);
        await eventService.save(createdEvent);
        await eventService.save(accountAdded);
        await eventService.save(securityTransferredOut);

        const portfolioState = await eventService.load(portfolioId);
        expect(portfolioState.get("accounts").get(0).get("accountSecurities").get(0).get("securityId")).toEqual(securityId);
        expect(portfolioState.get("accounts").get(0).get("accountSecurities").get(0).get("quantity")).toEqual((BigInt(quantityTransferredOut) * -1n).toString());
    });

    test("Test PortfolioEventService testing applying events with and without a starting state value", async () => {
        const accountNumber =  "0123456789";
        const cashAmountDeposited = "10000000";
        const cashAmountWithdrawn = "1000000";

        const eventFormat = (data, revision) => {
            return {
                event: {
                    type: data.eventType,
                    data: data,
                    revision: revision
                }
            }
        }
        const portfolioCreatedEvent = PortfolioEventService.portfolioCreated();
        const portfolioId = portfolioCreatedEvent.get("portfolioId");
        const accountAddedEvent = PortfolioEventService.accountAdded(portfolioId, accountNumber);
        const accountId = accountAddedEvent.get('accountId');
        const cashDepositedEvent = PortfolioEventService.cashDeposited(portfolioId, accountId, cashAmountDeposited);
        const cashWithdrawnEvent = PortfolioEventService.cashWithdrawn(portfolioId, accountId, cashAmountWithdrawn);
        const securityBoughtEvent = PortfolioEventService.securityBought(portfolioId, accountId, "APPL", "100", "1000000", "03/28/2021");

        const events = [
            eventFormat(portfolioCreatedEvent.toJS(), 0n), 
            eventFormat(accountAddedEvent.toJS(), 1n), 
            eventFormat(cashDepositedEvent.toJS(), 2n), 
            eventFormat(cashWithdrawnEvent.toJS(), 3n)
        ];

        const portfolioState = events.reduce(apply, null);

        const events2 = [
            eventFormat(securityBoughtEvent.toJS(), 4n)
        ];

        const portfolioState2 = events2.reduce(apply, portfolioState);

        const events3 = [
            eventFormat(portfolioCreatedEvent.toJS(), 0n), 
            eventFormat(accountAddedEvent.toJS(), 1n), 
            eventFormat(cashDepositedEvent.toJS(), 2n), 
            eventFormat(cashWithdrawnEvent.toJS(), 3n),
            eventFormat(securityBoughtEvent.toJS(), 4n)
        ];
        
        const portfolioState3 = events3.reduce(apply, null);
        expect(portfolioState3.toJS()).toMatchObject(portfolioState2.toJS());
    });
});