const { transformToRequest } = require('../transformer/fidelity-transformer')
const { pipeWith } = require('../utilities/pipe');
const { transformCSVToRequestObj, filterRequests, formatRequestsCurrency } = require('../utilities/common-transformer');
const { applyRequests } = require('../api/apply-request');

const output = (input) => {
    if(input) {
        console.log(input)
    }
}

const data = `



Brokerage

Run Date,Account,Action,Symbol,Security Description,Security Type,Quantity,Price ($),Commission ($),Fees ($),Accrued Interest ($),Amount ($),Settlement Date
 04/01/2021,INDIVIDUAL - TOD X70744875, YOU BOUGHT ADVANCED MICRO DEVICES INC (AMD) (Cash), AMD, ADVANCED MICRO DEVICES INC,Cash,49,81.01,,,,-3969.46,04/06/2021
 03/31/2021,INDIVIDUAL - TOD X70744875, REINVESTMENT CASH (315994103) (Cash), 315994103, CASH,Cash,0.04,1,,,,-0.04,
 03/31/2021,INDIVIDUAL - TOD X70744875, INTEREST EARNED CASH (315994103) (Cash), 315994103, CASH,Cash,,,,,,0.04,
 03/26/2021,INDIVIDUAL - TOD X70744875, DIVIDEND RECEIVED GLOBAL PAYMENTS INC (GPN) (Cash), GPN, GLOBAL PAYMENTS INC,Cash,,,,,,25.94,
 03/18/2021,INDIVIDUAL - TOD X70744875, YOU BOUGHT DROPBOX INC CL A (DBX) (Cash), DBX, DROPBOX INC CL A,Cash,180,27.8,,,,-5003.1,03/22/2021
 03/18/2021,INDIVIDUAL - TOD X70744875, YOU BOUGHT DISNEY WALT CO COM (DIS) (Cash), DIS, DISNEY WALT CO COM,Cash,25,193.63,,,,-4840.66,03/22/2021
 03/18/2021,INDIVIDUAL - TOD X70744875, Electronic Funds Transfer Paid (Cash), , No Description,Cash,,,,,,-10000,
 03/16/2021,INDIVIDUAL - TOD X70744875, YOU SOLD GLOBAL PAYMENTS INC (GPN) (Cash), GPN, GLOBAL PAYMENTS INC,Cash,-133,212.8,4.95,0.15,,28297.3,03/18/2021

            
`;

const transform = (lines) => {
    return transformCSVToRequestObj(lines, transformToRequest);
}

describe("Test suite for activity-transformer", () => {
    test("Transform test data", async () => {
        var lines = data.split('\n');
        var requests = pipeWith(
            lines,
            transform,
            formatRequestsCurrency,
            filterRequests
        );
        var createRequests = [
            { 
                requestType: "CREATE_PORTFOLIO" 
            },
            { 
                requestType: "ADD_ACCOUNT", 
                accountNumber: "1234"
            }
        ];
        console.log(await createRequests.reduce(applyRequests, null));
        console.log(requests);

    });
});