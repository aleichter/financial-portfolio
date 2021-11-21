/* eslint-disable class-methods-use-this */
import {
  GrpcObject, loadPackageDefinition, Server, ServerCredentials, status,
} from '@grpc/grpc-js';
import { PackageDefinition } from '@grpc/grpc-js/build/src/make-client';
import { loadSync } from '@grpc/proto-loader';
import logger from '../logging/portfolio-logger';

interface Path {
    path:string
}

interface Handler {
    handler:Path
}

interface Call {
    request:any
    call:Handler
}

function isPromise(promise:Promise<any>):boolean {
  return !!promise && typeof promise.then === 'function';
}

// TODO:  give callback a specific type to enforce signature instead of any
const routeMap:Map<string, any> = new Map();

function wrapper(call:Call, callback:any) {
  try {
    logger.debug(`Request data: ${JSON.stringify(call.request)}`);
    logger.debug(`Handler: ${call.call.handler.path}`);
    const hrstart = process.hrtime();
    const result = routeMap.get(call.call.handler.path)(call.request);
    if (isPromise(result)) {
      result.then((data:any) => {
        const hrend = process.hrtime(hrstart);
        logger.debug('Execution time (hr): %ds %dms', hrend[0], hrend[1] / 1000000);
        logger.debug(`Response data: ${JSON.stringify(data)}`);
        callback(null, data);
      }).catch((err:any) => {
        logger.error(err);
        callback({ code: status.INTERNAL, message: err });
      });
    } else {
      const hrend = process.hrtime(hrstart);
      logger.debug('Execution time (hr): %ds %dms', hrend[0], hrend[1] / 1000000);
      logger.debug(`Response data: ${JSON.stringify(result)}`);
      callback(null, result);
    }
  } catch (err) {
    logger.error(err);
    callback({ code: status.INTERNAL, message: err });
  }
}

function getServiceImplMap(proto:GrpcObject) {
  const serviceImplMap:any = {};

  Object.keys(proto).forEach((typeKey) => {
    if ('service' in proto[typeKey]) {
      const item:any = proto[typeKey];
      serviceImplMap[typeKey] = {
        service: item.service,
        implMap: {},
      };

      Object.keys(item.service).forEach((serviceKey) => {
        const p:any = proto[typeKey];
        const key:any = p.service[serviceKey].originalName;
        serviceImplMap[typeKey].implMap[key] = wrapper;
      });
    }
  });

  return serviceImplMap;
}

export default class GrpcServer {
    bindAddress:string

    port:string

    proto:GrpcObject

    serviceImplMap:any

    server:Server | undefined

    loadRouteMap(rm:Map<string, any>) {
      rm.forEach((key:string) => {
        routeMap.set(key, rm.get(key));
      });
    }

    constructor(protoPath:string, host:string, port:string, localRouteMap = null) {
      this.bindAddress = host;
      this.port = port;
      const PROTO_PATH = protoPath;
      const packageDefinition:PackageDefinition = loadSync(
        PROTO_PATH,
        {
          keepCase: true,
          longs: String,
          enums: String,
          defaults: true,
          oneofs: true,
        },
      );

      const packageDef:GrpcObject = loadPackageDefinition(packageDefinition);
      // TODO: change to check the return of packageDef to guarantee type

      this.proto = packageDef[Object.keys(packageDef)[0]] as GrpcObject;
      this.serviceImplMap = getServiceImplMap(this.proto);
      if (localRouteMap != null) {
        this.loadRouteMap(localRouteMap);
      }
    }

    route(packageName:string, service:string, rpc:string, callback:any) {
      routeMap.set(`/${packageName}.${service}/${rpc}`, callback);
    }

    async start() {
      this.server = new Server();
      Object.keys(this.serviceImplMap).forEach((key) => {
        if (this.server !== undefined) {
          this.server.addService(
            this.serviceImplMap[key].service, this.serviceImplMap[key].implMap,
          );
        }
      });

      return new Promise<void>((resolve, reject) => {
        if (this.server !== undefined) {
          this.server.bindAsync(`${this.bindAddress}:${this.port}`, ServerCredentials.createInsecure(), (err) => {
            if (!err && this.server !== undefined) {
              this.server.start();
              logger.info(`gRPC Server listening at ${this.bindAddress}:${this.port} ...`);
              resolve();
            } else {
              reject(err);
            }
          });
        }
      });
    }

    stop() {
      return new Promise<void>((resolve) => {
        if (this.server !== undefined) {
          this.server.tryShutdown(() => {
            resolve();
          });
        }
      });
    }
}
