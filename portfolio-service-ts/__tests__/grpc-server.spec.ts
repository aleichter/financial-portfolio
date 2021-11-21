/* eslint-disable no-undef */
import GrpcServer from '../src/api/grpc-server';

const GrpcClient = require('../src/api/grpc-client');

const grpcConfig = {
  bindAddress: '0.0.0.0',
  port: '3001',
  proto: './__tests__/protos/testprotos.proto',
};

const records:Array<any> = [];
const serverSetup = () => {
  const host = grpcConfig.bindAddress;
  const { port } = grpcConfig;
  const protopath = grpcConfig.proto;

  const TestCommand1 = (payload:any) => {
    records.push(payload);
    return { data: [{ key: 'id', value: 201 }] };
  };

  const TestCommand2 = (payload:any) => new Promise((resolve) => {
    records.push(payload);
    resolve({ data: [{ key: 'id', value: 301 }] });
  });
  const TestCommand3 = (payload:any) => new Promise((resolve, reject) => {
    reject(new Error(`Exception Thrown with payload ${JSON.stringify(payload)}`));
  });

  const TestCommand4 = (payload:any) => {
    throw new Error(`Test Exception with payload ${JSON.stringify(payload)}`);
  };

  const routeMap = {
    '/unit.TestService1/TestCommand': TestCommand1,
    '/unit.TestService2/TestCommand': TestCommand2,
    '/unit.TestService3/TestCommand': TestCommand3,
    '/unit.TestService4/TestCommand': TestCommand4,
  };
  const api = new GrpcServer(protopath, host, port, routeMap);

  return api;
};

describe('Test grpc server with promise and non-promise callbacks', () => {
  test('Test exception server bind', async () => {
    // Try binding to the same address and port as what is defined in beforeAll
    // This reject the Promise returned in api.start()
    const api = await serverSetup();
    await api.start();
    const api2 = new GrpcServer(grpcConfig.proto, grpcConfig.bindAddress, grpcConfig.port, {});
    await expect(api2.start()).rejects.toThrow('No address added out of total 1 resolved');
    await api2.stop();
    return api.stop();
  });

  test('Test the grpc server non-promise callbacks', async () => {
    const api = await serverSetup();
    await api.start();
    const client = new GrpcClient(grpcConfig.proto, grpcConfig.bindAddress, grpcConfig.port, 'TestService1');
    const r = await client.execute('TestCommand', {
      id: '100',
    });
    expect(records[0].id).toEqual('100');
    expect(r.data[0].value).toEqual('201');
    return api.stop();
  });

  test('Test the grpc server resolved promise callbacks', async () => {
    const api = await serverSetup();
    await api.start();
    const client = new GrpcClient(grpcConfig.proto, grpcConfig.bindAddress, grpcConfig.port, 'TestService2');
    const r = await client.execute('TestCommand', {
      id: '100',
      message: 'This is the message',
    });
    expect(records[0].id).toEqual('100');
    expect(r.data[0].value).toEqual('301');
    return api.stop();
  });

  test('Test the grpc server exception callback', async () => {
    const api = await serverSetup();
    await api.start();
    const client = new GrpcClient(grpcConfig.proto, grpcConfig.bindAddress, grpcConfig.port, 'TestService4');
    await expect(client.execute('TestCommand', {
      id: '100',
    })).rejects.toThrow('13 INTERNAL: Test Exception');
    return api.stop();
  });

  test('Test the grpc server rejected promise callbacks', async () => {
    const api = await serverSetup();
    await api.start();
    const client = new GrpcClient(grpcConfig.proto, grpcConfig.bindAddress, grpcConfig.port, 'TestService3');
    await expect(client.execute('TestCommand', {
      id: '100',
      message: 'This is the message',
    })).rejects.toThrow('13 INTERNAL: Exception Thrown');
    return api.stop();
  });

  test('Test the grpc server with route', async () => {
    const host = grpcConfig.bindAddress;
    const { port } = grpcConfig;
    const protopath = grpcConfig.proto;
    const api = new GrpcServer(protopath, host, port);
    await api.start();
    const response = { data: [{ key: 'message', value: 'message 1' }] };
    api.route('unit', 'TestService1', 'TestCommand', () => response);

    const client = new GrpcClient(grpcConfig.proto, grpcConfig.bindAddress, grpcConfig.port, 'TestService1');
    const executeResponse = await client.execute('TestCommand', {
      id: '100',
      message: 'This is the message',
    });

    expect(executeResponse).toEqual(response);
    return api.stop();
  });
});
