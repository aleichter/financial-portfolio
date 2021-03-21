var PROTO_PATH = __dirname + '/../../protos/commandservice.proto';

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

async function main() {
    var client = new activity_proto.AssetCommand("localhost:3000",
        grpc.credentials.createInsecure());
    var i = 1;
        setInterval(() => {
            client.addAssetCommand({
                securityId: "APPL"
            }, function(err, response) {
                    if(err == null) {
                        console.log('AddAsset ' + i + ' Message:', response.message);
                    } else {
                        console.log('Exception thrown for message ' + i + ' Message: ', err);
                    }
                });
            i = i + 1;
        }, 1);
    
}

main();