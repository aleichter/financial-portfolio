const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

class GrpcClient {
    constructor(protopath, host, port, serviceName) {
        var packageDefinition = protoLoader.loadSync(
            protopath,
            {keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true
            });

        var packageDef = grpc.loadPackageDefinition(packageDefinition);
        var proto = packageDef[Object.keys(packageDef)[0]]

        this.service = new proto[serviceName](host + ":" + port,
        grpc.credentials.createInsecure());
    }

    execute(methodName, payload) {
        return new Promise((resolve, reject) => {
            this.service[methodName](payload, function(err, response) {
                if(!err) {
                    resolve(response)
                } else {
                    reject(err)
                }
            });
        });
    }
}

module.exports = GrpcClient;