const ESDB = require('./db/esdb.js')

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
var dbclient = new ESDB("esdb://localhost:2113?tls=false");

const hostname = '127.0.0.1';
const port = 3000;
var i = 0;

function addActivityCommand(call, callback) {
  dbclient.append("account_" + call.request.account, call.request, "AddActivity");
  i = i + 1;
  console.log("Success event " + i + " appended!");
  callback(null, {status: 'Success'});
}

function main() {
  var server = new grpc.Server();
  server.addService(activity_proto.ActivityCommand.service, {addActivityCommand: addActivityCommand});
  server.bindAsync(hostname + ':' + port, grpc.ServerCredentials.createInsecure(), () => {
    server.start();
  });
  console.log(`Server running at http://${hostname}:${port}/`);
}

main();