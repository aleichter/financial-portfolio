const { pipeWith } = require('../utilities/pipe');
const Papa = require('papaparse');

const REQUEST_TYPE = {
    CREATE_PORTFOLIO : "CREATE_PORTFOLIO",
    ADD_ACCOUNT : "ADD_ACCOUNT",
    SELL_SECURITY : "SELL_SECURITY",
    WITHDRAW_CASH : "WITHDRAW_CASH",
    BUY_SECURITY : "BUY_SECURITY",
    RECEIVE_DIVIDEND : "RECEIVE_DIVIDEND",
    EARN_INTEREST : "EARN_INTEREST"
}

const removeDecimal = (strValue) => {
    if(strValue) {
        if(strValue.includes('.')) {
            const newStr = strValue.split('.');
            return newStr[0] + newStr[1].padEnd(2,"0");  
        } else {
            return strValue;            
        }
    } else {
        return null;
    }
}

const getAbsoluteValue = (strInteger) => {
    if(strInteger) {
        const value = parseInt(strInteger);
        if(value < 0) {
            return (value * -1).toString();
        } else {
            return value.toString();
        }
    } else {
        return null;
    }
}

const trim = (text) => {
    return text.trim();
}

const parseCSV = (line) => {
    const parsed = Papa.parse(line, { transform: x => x.trim() });
    if(parsed.errors.length == 0) {
        return parsed.data[0];
    } else {
        return null;
    }
}

const formatCurrency = (request) => {
    requestCopy = null;

    if(typeof request === 'object' && request !== null) {
        requestCopy = {...request};
        if(request.hasOwnProperty('cashAdjustment')) {
            requestCopy.cashAdjustment = getAbsoluteValue(removeDecimal(request.cashAdjustment));
        }
        if(request.hasOwnProperty('quantityAdjustment')) {
            requestCopy.quantityAdjustment = getAbsoluteValue(removeDecimal(request.quantityAdjustment));
        }
        if(request.hasOwnProperty('commission')) {
            requestCopy.commission = getAbsoluteValue(removeDecimal(request.commission));
        }
        if(request.hasOwnProperty('fee')) {
            requestCopy.fee = getAbsoluteValue(removeDecimal(request.fee));
        }
    }

    return requestCopy;
}

exports.getAbsoluteValue = getAbsoluteValue;
exports.removeDecimal = removeDecimal;
exports.formatCurrency = formatCurrency;
exports.trim = trim;
exports.parseCSV = parseCSV;
exports.REQUEST_TYPE = REQUEST_TYPE;

exports.formatRequestsCurrency = (requests) => {
    var newRequests = []
    requests.forEach(r => newRequests.push(formatCurrency(r)));

    return newRequests;
}

exports.filterRequests = (requests) => {
    return requests.filter((v) => v != null && v != '' );
}

exports.transformCSVToRequestObj = (lines, transformToRequest) => {
    var requests = []
    lines.forEach((line) => {
        requests.push(pipeWith(
            line,
            trim,
            parseCSV,
            transformToRequest
        ));
    });

    return requests;
}