class AccountUpdateException extends Error {  
    constructor (accountId) {
        let message = "Account with id: " + accountId + " was updated before it was added.";
        super(message)
        Error.captureStackTrace(this, this.constructor);
  
        this.name = this.constructor.name
    }
}

class SecurityDoesNotExistException extends Error {  
    constructor (securityId) {
        let message = "Security id: " + securityId + " is expected to already exist in the account.";
        super(message)
        Error.captureStackTrace(this, this.constructor);
  
        this.name = this.constructor.name
    }
}

module.exports = { 
    AccountUpdateException : AccountUpdateException,
    SecurityDoesNotExistException : SecurityDoesNotExistException
};