const { REQUEST_TYPE, getAbsoluteValue, removeDecimal } = require('../utilities/common-transformer');

const determineRequestType = (input) => {
    if (input.includes('SOLD')) {
        return REQUEST_TYPE.SELL_SECURITY;
    } else if (input.includes('Transfer')) {
        return REQUEST_TYPE.WITHDRAW_CASH;
    } else if (input.includes('BOUGHT')) {
        return REQUEST_TYPE.BUY_SECURITY;
    } else if (input.includes('DIVIDEND RECEIVED')) {
        return REQUEST_TYPE.RECEIVE_DIVIDEND;
    } else if (input.includes('INTEREST EARNED')) {
        return REQUEST_TYPE.EARN_INTEREST;
    }
}

exports.transformToRequest = (record) => {
    if(Array.isArray(record)) {
        switch(determineRequestType(record[2])) {
            case REQUEST_TYPE.SELL_SECURITY:
                return {
                    portfolioId: '',
                    accountId: '',
                    securityId: record[3],
                    cashAdjustment: record[11],
                    quantityAdjustment: record[7],
                    commission: record[8],
                    fee: record[9],
                    settlementDate: record[12] ? record[12] : record[0],
                    expectedRevision: '',
                    requestType: REQUEST_TYPE.SELL_SECURITY
                };
            case REQUEST_TYPE.WITHDRAW_CASH:
                return {
                    portfolioId: '',
                    accountId: '',
                    cashAdjustment: record[11],
                    settlementDate: record[12] ? record[12] : record[0],
                    expectedRevision: '',
                    requestType: REQUEST_TYPE.WITHDRAW_CASH
                };
            case REQUEST_TYPE.BUY_SECURITY:
                return {
                    portfolioId: '',
                    accountId: '',
                    securityId: record[3],
                    cashAdjustment: record[11],
                    quantityAdjustment: record[7],
                    commission: record[8],
                    fee: record[9],
                    settlementDate: record[12] ? record[12] : record[0],
                    expectedRevision: '',
                    requestType: REQUEST_TYPE.BUY_SECURITY
                }
            case REQUEST_TYPE.RECEIVE_DIVIDEND:
                return {
                    portfolioId: '',
                    accountId: '',
                    cashAdjustment: record[11],
                    settlementDate: record[12] ? record[12] : record[0],
                    expectedRevision: '',
                    requestType: REQUEST_TYPE.RECEIVE_DIVIDEND
                };
            case REQUEST_TYPE.EARN_INTEREST:
                return {
                    portfolioId: '',
                    accountId: '',
                    cashAdjustment: record[11],
                    settlementDate: record[12] ? record[12] : record[0],
                    expectedRevision: '',
                    requestType: REQUEST_TYPE.EARN_INTEREST
                };
            default:
                return '';
        }
    } else {
        return null;
    }

}