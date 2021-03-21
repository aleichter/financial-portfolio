const { v4: uuidv4 } = require('uuid');
const { Map } = require("immutable");
const { EVENT_TYPE, apply } = require("./portfolio-event-processor");

class PortfolioEventService {
    #dbclient;
    #streamPrefix = "portfolio-";

    constructor(dbclient) {
        this.#dbclient = dbclient;
    }

    save(event) {
        var result = null;            
        var streamName = this.#streamPrefix + event.get("portfolioId");
        var eventType = event.get("eventType");
        if(eventType == EVENT_TYPE.PORTFOLIO_CREATED) {
            result = this.#dbclient.createStreamWithAppend(streamName, event.toJS(), eventType)
        } else {
            result = this.#dbclient.appendToStream(streamName, event.toJS(), eventType);
        }
        return result;
    }

    load(portfolioId) {
        var stream = this.#streamPrefix + portfolioId;
        return this.#dbclient.readStream(stream)
            .then((events) => {
                return Map(events.reduce(apply, null));
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
        return Map({ portfolioId: portfolioId, accountId: accountId, securityId, quantity, cashAmount: cashAmount, settlementDate: settlementDate, eventType: EVENT_TYPE.SECUIRTY_SOLD });
    }

    static securityTransferedIn(portfolioId, accountId, securityId, quantity, settlementDate) {
        return Map({ portfolioId: portfolioId, accountId: accountId, securityId, quantity, settlementDate: settlementDate, eventType: EVENT_TYPE.SECURITY_TRANSFERED_IN });
    }

    static securityTransferedOut(portfolioId, accountId, securityId, quantity, settlementDate) {
        return Map({ portfolioId: portfolioId, accountId: accountId, securityId, quantity, settlementDate: settlementDate, eventType: EVENT_TYPE.SECURITY_TRANSFERED_OUT });
    }
}

module.exports = PortfolioEventService;