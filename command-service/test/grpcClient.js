var grpc = require('@grpc/grpc-js');
var protoLoader = require('@grpc/proto-loader');


class GrpcClient {
    constructor(protopath, host, port) {
        var packageDefinition = protoLoader.loadSync(
            protopath,
            {keepCase: true,
             longs: String,
             enums: String,
             defaults: true,
             oneofs: true
            });
        var proto = grpc.loadPackageDefinition(packageDefinition).portfolio;
        this.host = host;
        this.port = port;
        this.serviceMap = this.__loadServiceMap(proto);
    }

    getServiceMap() {
        return this.serviceMap;
    }
    __loadServiceMap(proto) {
        var serviceMap = {}
        for (var typeKey in proto) {
            if("service" in proto[typeKey]) {
                serviceMap[typeKey] = new proto[typeKey](this.host + ":" + this.port,
                grpc.credentials.createInsecure());
            }
        }

        return serviceMap;
    }
}

module.exports = GrpcClient;