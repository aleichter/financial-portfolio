class AccountDoesNotExist extends Error {  
    constructor (accountId) {
        let message = "Account with id: " + accountId + " does not exist.";
        super(message)
        Error.captureStackTrace(this, this.constructor);
  
        this.name = this.constructor.name
    }
}

class SecurityDoesNotExistException extends Error {  
    constructor (securityId) {
        let message = securityId + " is expected to already exist in the account.";
        super(message)
        Error.captureStackTrace(this, this.constructor);
  
        this.name = this.constructor.name
    }
}

class NegativeSecurityQuantityException extends Error {  
    constructor (securityId, quantityExists, quantityRemoved) {
        let message = "Removing " + quantityRemoved + " units from " + quantityExists + " units from security " + securityId + " would create a negative balance.";
        super(message)
        Error.captureStackTrace(this, this.constructor);
  
        this.name = this.constructor.name
    }
}

class InvalidSettlementDate extends Error {  
    constructor (date) {
        let message = date + " is not a valid settlement date format.  Expected format is MM/DD/YYYY";
        super(message)
        Error.captureStackTrace(this, this.constructor);
  
        this.name = this.constructor.name
    }
}

class WrongExpectedVersion extends Error {
    constructor (expectedVersion, actualVersion) {
        let message = "Expected version is " + expectedVersion + " but actual version is " + actualVersion;
        super(message)
        Error.captureStackTrace(this, this.constructor);
  
        this.name = this.constructor.name
    }
}

module.exports = { 
    AccountDoesNotExist : AccountDoesNotExist,
    SecurityDoesNotExistException : SecurityDoesNotExistException,
    InvalidSettlementDate : InvalidSettlementDate,
    NegativeSecurityQuantityException : NegativeSecurityQuantityException,
    WrongExpectedVersion : WrongExpectedVersion
};