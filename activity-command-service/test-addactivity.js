var PROTO_PATH = __dirname + '/protos/activityservice.proto';

var grpc = require('@grpc/grpc-js');
var protoLoader = require('@grpc/proto-loader');
var packageDefinition = protoLoader.loadSync(
    PROTO_PATH,
    {keepCase: true,
     longs: String,
     enums: String,
     defaults: true,
     oneofs: true
    });

var activity_proto = grpc.loadPackageDefinition(packageDefinition).portfolio;

function main() {
    var client = new activity_proto.ActivityCommand("localhost:3000",
        grpc.credentials.createInsecure());
    var i = 1;
        setInterval(() => {
            client.addActivityCommand({
                account: "123",
                settlementDate: 1,
                transactionType: "BUY",
                description: "Desc",
                assetid: "APPL",
                quantity: 100,
                price: 10000,
                netamount: 1000000}, function(err, response) {
                    console.log('Command ' + i + ' Status:', response.status);
                });
            i = i + 1;
        }, 1);
    
}

main();