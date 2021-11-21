import { loadPackageDefinition, credentials } from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';

export default class GrpcClient {
    service:any;

    constructor(protopath:string, host:string, port:string, serviceName:string) {
      const packageDefinition = protoLoader.loadSync(
        protopath,
        {
          keepCase: true,
          longs: String,
          enums: String,
          defaults: true,
          oneofs: true,
        },
      );

      const packageDef = loadPackageDefinition(packageDefinition);
      const proto = packageDef[Object.keys(packageDef)[0]];

      this.service = new proto[serviceName](`${host}:${port}`,
        credentials.createInsecure());
    }

    execute(methodName:string, payload:any) {
      return new Promise((resolve, reject) => {
        this.service[methodName](payload, (err:any, response:any) => {
          if (!err) {
            resolve(response);
          } else {
            reject(err);
          }
        });
      });
    }
}
