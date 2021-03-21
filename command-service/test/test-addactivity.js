var GrpcClient = require('./grpcClient.js');

function main() {
    var host = "localhost";
    var port = "3000";
    var PROTO_PATH = __dirname + '/../../protos/commandservice.proto';
    grpcClient = new GrpcClient(PROTO_PATH, host, port);
    accountCommandService = grpcClient.getServiceMap().AccountCommand;
    var i = 1;
        setInterval(() => {
            accountCommandService.addActivityCommand({
                account: "123",
                settlementDate: 1,
                transactionType: "BUY",
                description: "Desc",
                securityId: "APPL",
                quantity: 100,
                price: 10000,
                netamount: 1000000}, function(err, response) {
                    if(err == null) {
                        console.log('AddActivity ' + i + ' Message:', response.message);
                    } else {
                        console.log('Exception thrown for message ' + i + ' Message: ', err);
                    }
                });
                accountCommandService.createAccount({account: "123"}, function(err, response) {
                        if(err == null) {
                            console.log('CreateAccount ' + i + ' Message:', response.message);
                        } else {
                            console.log('Exception thrown for message ' + i + ' Message: ', err);
                        }
                    });
            i = i + 1;
        }, 1000);
    
}

main();