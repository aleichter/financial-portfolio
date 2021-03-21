const GrpcServer = require('@aleichter/grpc-server');
const config = require('config');

function main() {

  var grpcConfig = config.get("grpcConfig");
  var host = grpcConfig.bindAddress;
  var port = grpcConfig.port;
  var protopath =  grpcConfig.proto;
  /*
  var routeMap = { 
    "/portfolio.AccountCommand/AddActivityCommand" : addActivityCommand,
    "/portfolio.AccountCommand/CreateAccount" : createAccount,
    "/portfolio.AssetCommand/AddAssetCommand" : addAssetCommand
  }
  */
  var api = new GrpcServer(protopath, host, port, routeMap);

  api.start();
}

main();