const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const config = require('config'); 
const logger = require("../logging/portfolio-logger");
const __routeMap = {}


const isPromise = (promise) => {  
    return !!promise && typeof promise.then === 'function'
}
const wrapper = (call, callback) => {
    try {
        logger.debug("Request data: " + JSON.stringify(call.request));
        logger.debug("Handler: " + call.call.handler.path);
        const hrstart = process.hrtime();
        var result = __routeMap[call.call.handler.path](call.request);
        if(isPromise(result)) {
            result.then((data) => {
                const hrend = process.hrtime(hrstart);
                logger.debug('Execution time (hr): %ds %dms', hrend[0], hrend[1] / 1000000)
                logger.debug("Response data: " + JSON.stringify(data));
                callback(null, data)
            }).catch((err) => {
                logger.error(err);
                callback({code: grpc.status.INTERNAL, message: err})
            });
        } else {
            const hrend = process.hrtime(hrstart);
            logger.debug('Execution time (hr): %ds %dms', hrend[0], hrend[1] / 1000000)
            logger.debug("Response data: " + JSON.stringify(result));
            callback(null, result);
        }
    }
    catch(err) {
        logger.error(err);
        callback({code: grpc.status.INTERNAL, message: err});
    }
  }

class GrpcServer{
    constructor(protopath, host, port, routeMap = null) {
        this.bindAddress = host;
        this.port = port;

        var PROTO_PATH = protopath;
        var packageDefinition = protoLoader.loadSync(
            PROTO_PATH,
            {keepCase: true,
             longs: String,
             enums: String,
             defaults: true,
             oneofs: true
            });
        
        var packageDef = grpc.loadPackageDefinition(packageDefinition)
        this.proto = packageDef[Object.keys(packageDef)[0]]
        this.serviceImplMap = this.__getServiceImplMap(this.proto);
        if(routeMap != null) {
            this.__loadRouteMap(routeMap);
        }
    }

    __loadRouteMap(routeMap) {
        for(var key in routeMap) {
            __routeMap[key] = routeMap[key]
        }
    }

    __getServiceImplMap(proto) {
        var serviceImplMap = {}
        for (var typeKey in proto) {
            if("service" in proto[typeKey]) {
                serviceImplMap[typeKey] = { 
                    service: proto[typeKey].service,
                    implMap: {}
                };

                for (var serviceKey in proto[typeKey].service) {
                    serviceImplMap[typeKey].implMap[proto[typeKey].service[serviceKey]['originalName']] = wrapper;
                }
            }
        }

        return serviceImplMap;
    }

    route(packageName, service, rpc, callback) {
        __routeMap["/" + packageName + "." + service + "/" + rpc ] = callback;
    }

    async start() {
        this.server = new grpc.Server();
        for( var key in this.serviceImplMap ) {
            this.server.addService(this.serviceImplMap[key].service, this.serviceImplMap[key].implMap);
        }
        return new Promise((resolve, reject) => {
            this.server.bindAsync(this.bindAddress + ':' + this.port, grpc.ServerCredentials.createInsecure(), (err, port) => {
                if(!err) {
                    this.server.start();
                    logger.info("gRPC Server listening at " + this.bindAddress + ":" + this.port + " ...");
                    resolve();
                } else {
                    reject(err);
                }
            });
        });
    }

    stop() {
        return new Promise((resolve, reject) => {
            this.server.tryShutdown((err) => {
                resolve();
            });
        });
    }
}

module.exports = GrpcServer;