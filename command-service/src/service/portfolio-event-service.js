const { v4: uuidv4 } = require('uuid');
const { Map, fromJS } = require("immutable");
const { EVENT_TYPE, apply } = require("./portfolio-event-processor");

class PortfolioEventService {
    #dbclient;
    #streamPrefix = "portfolio-";
    #snapshotStreamPostfix = "-snapshot";
    #snapshotTrigger;

    constructor(dbclient, snapshotTrigger = 100) {
        this.#dbclient = dbclient;
        this.#snapshotTrigger = snapshotTrigger;
    }

    save(event, expectedRevision = null) {
        var result = null;            
        const stream = this.#streamPrefix + event.get("portfolioId");
        const snapshotStream = stream + this.#snapshotStreamPostfix;
        const eventType = event.get("eventType");
        var writeFunction = () => {
            return this.#dbclient.appendToStream(stream, event.toJS(), eventType, expectedRevision);
        };
        if(eventType == EVENT_TYPE.PORTFOLIO_CREATED) {
            writeFunction = () => {
                const formattedEvent = {
                    event: {
                        type: eventType,
                        data: event.toJS(),
                        revision: 0n
                    }
                }
                const initialState = [formattedEvent].reduce(apply, null);

                return this.#dbclient.createStreamWithAppend(snapshotStream, initialState.toJS(), EVENT_TYPE.SNAPSHOT_CREATED).then(async (r) => {
                    return await this.#dbclient.createStreamWithAppend(stream, event.toJS(), eventType)
                });
            };
        }
        return writeFunction();
    }

    load(portfolioId) {
        const stream = this.#streamPrefix + portfolioId;
        const snapshotStream = stream + this.#snapshotStreamPostfix;
        return new Promise(async (resolve, reject) => {
            try {
                const snapshotEvents = await this.#dbclient.readStreamLastEvent(snapshotStream);
                const portfolioState = fromJS(snapshotEvents[0].event.data);
                const snapshotExpectedRevision = snapshotEvents[0].event.revision;
                const fromRevision = BigInt(portfolioState.get("revisionNumber")) + 1n;
                const readResult = await this.#dbclient.readStream(stream, fromRevision)
                    .then(async (events) => {
                        const newPortfolioState = events.reduce(apply, portfolioState);
                        if (events.length >= this.#snapshotTrigger) {
                            //Create a new snapshot
                            await this.#dbclient.appendToStream(snapshotStream, newPortfolioState.toJS(), EVENT_TYPE.SNAPSHOT_CREATED, snapshotExpectedRevision);
                        }
                        return newPortfolioState;
                    });
                resolve(readResult);
            } catch(err) {
                reject(err);
            }
        });
    }

    delete(portfolioId) {
        return this.#dbclient.deleteStream(this.#streamPrefix + portfolioId);
    }

    static portfolioCreated() {
        return Map({ portfolioId: uuidv4(), eventType: EVENT_TYPE.PORTFOLIO_CREATED });
    }

    static accountAdded(portfolioId, accountNumber) {
        return Map({ portfolioId: portfolioId, accountId: uuidv4(), accountNumber: accountNumber, eventType: EVENT_TYPE.ACCOUNT_ADDED });
    }

    static accountRemoved(portfolioId, accountId) {
        return Map({ portfolioId: portfolioId, accountId: accountId, eventType: EVENT_TYPE.ACCOUNT_REMOVED });
    }

    static accountUpdated(portfolioId, accountId, accountNumber) {
        return Map({ portfolioId: portfolioId, accountId: accountId, accountNumber: accountNumber, eventType: EVENT_TYPE.ACCOUNT_UPDATED });
    }
    
    static cashDeposited(portfolioId, accountId, cashAmount, settlementDate) {
        return Map({ portfolioId: portfolioId, accountId: accountId, cashAmount: cashAmount, settlementDate: settlementDate, eventType: EVENT_TYPE.CASH_DEPOSITED });
    } 
    
    static dividendReceived(portfolioId, accountId, cashAmount, settlementDate) {
        return Map({ portfolioId: portfolioId, accountId: accountId, cashAmount: cashAmount, settlementDate: settlementDate, eventType: EVENT_TYPE.DIVIDEND_RECEIVED });
    } 
    
    static cashWithdrawn(portfolioId, accountId, cashAmount, settlementDate) {
        return Map({ portfolioId: portfolioId, accountId: accountId, cashAmount: cashAmount, settlementDate: settlementDate, eventType: EVENT_TYPE.CASH_WITHDRAWN });
    }
    
    static feesPaid(portfolioId, accountId, cashAmount, settlementDate) {
        return Map({ portfolioId: portfolioId, accountId: accountId, cashAmount: cashAmount, settlementDate: settlementDate, eventType: EVENT_TYPE.FEES_PAID });
    }

    static securityBought(portfolioId, accountId, securityId, quantity, cashAmount, settlementDate) {
        return Map({ portfolioId: portfolioId, accountId: accountId, securityId, quantity, cashAmount: cashAmount, settlementDate: settlementDate, eventType: EVENT_TYPE.SECURITY_BOUGHT });
    }

    static securitySold(portfolioId, accountId, securityId, quantity, cashAmount, settlementDate) {
        return Map({ portfolioId: portfolioId, accountId: accountId, securityId, quantity, cashAmount: cashAmount, settlementDate: settlementDate, eventType: EVENT_TYPE.SECURITY_SOLD });
    }

    static securityTransferredIn(portfolioId, accountId, securityId, quantity, settlementDate) {
        return Map({ portfolioId: portfolioId, accountId: accountId, securityId, quantity, settlementDate: settlementDate, eventType: EVENT_TYPE.SECURITY_TRANSFERRED_IN });
    }

    static securityTransferredOut(portfolioId, accountId, securityId, quantity, settlementDate) {
        return Map({ portfolioId: portfolioId, accountId: accountId, securityId, quantity, settlementDate: settlementDate, eventType: EVENT_TYPE.SECURITY_TRANSFERRED_OUT });
    }
}

module.exports = PortfolioEventService;