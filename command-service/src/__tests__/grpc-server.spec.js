const GrpcClient = require('../api/grpc-client');
const GrpcServer = require('../api/grpc-server');

const grpcConfig = {
    bindAddress : "0.0.0.0",
    port : "3001",
    proto : "./__tests__/protos/testprotos.proto"
}

const records = [];
//TODO:  Figure out how to mock GrpcServer and GrpcClient
const serverSetup = () => {
            
    var host = grpcConfig.bindAddress;
    var port = grpcConfig.port;
    var protopath =  grpcConfig.proto;


    var TestCommand1 = (payload) => {
        records.push(payload);
        return {data: [{ key : "id", value : 201 }]};
    }

    var TestCommand2 = (payload) => {
        return new Promise((resolve, reject) => {
            records.push(payload);
            resolve({data: [{ key: "id", value: 301 }]});
        });
    }
    var TestCommand3 = (payload) => {
        return new Promise((resolve, reject) => {
            reject("Exception Thrown");
        });
    }

    var TestCommand4 = (payload) => {
        //return {data: null}
        throw "Test Exception"
    }

    var routeMap = { 
      "/unit.TestService1/TestCommand" : TestCommand1,
      "/unit.TestService2/TestCommand" : TestCommand2,
      "/unit.TestService3/TestCommand" : TestCommand3,
      "/unit.TestService4/TestCommand" : TestCommand4,
    }
    api = new GrpcServer(protopath, host, port, routeMap);
  
    return api;
}

const stopServer = () => {
    return api.stop();
}

describe("Test grpc server with promise and non-promise callbacks", () => {

    test("Test exception server bind", async() => {
        //Try binding to the same address and port as what is defined in beforeAll
        //This reject the Promise returned in api.start()
        var api = await serverSetup();
        await api.start();
        var api2 = new GrpcServer(grpcConfig.proto, grpcConfig.bindAddress, grpcConfig.port, {});
        await expect(api2.start()).rejects.toThrow("No address added out of total 1 resolved")
        await api2.stop();
        return api.stop();
    });

    test("Test the grpc server non-promise callbacks", async () => {
        var api = await serverSetup();
        await api.start();
        var client = new GrpcClient(grpcConfig.proto, grpcConfig.bindAddress, grpcConfig.port, "TestService1");
        var r = await client.execute("TestCommand", {
            id: "100"
        });
        expect(records[0].id).toEqual("100");
        expect(r.data[0].value).toEqual("201");
        return api.stop();
    });

    test("Test the grpc server resolved promise callbacks", async () => {
        var api = await serverSetup();
        await api.start();
        var client = new GrpcClient(grpcConfig.proto, grpcConfig.bindAddress, grpcConfig.port, "TestService2");
        var r = await client.execute("TestCommand", {
            id: "100",
            message: "This is the message"
        });
        expect(records[0].id).toEqual("100");
        expect(r.data[0].value).toEqual("301");
        return api.stop();
    });

    test("Test the grpc server exception callback", async () => {
        var api = await serverSetup();
        await api.start();
        var client = new GrpcClient(grpcConfig.proto, grpcConfig.bindAddress, grpcConfig.port, "TestService4");
        await expect(client.execute("TestCommand", {
                id: "100"
            })).rejects.toThrow("13 INTERNAL: Test Exception");
        return api.stop();
    });

    test("Test the grpc server rejected promise callbacks", async () => {
        var api = await serverSetup();
        await api.start();
        var client = new GrpcClient(grpcConfig.proto, grpcConfig.bindAddress, grpcConfig.port, "TestService3");
        await expect(client.execute("TestCommand", {
                id: "100",
                message: "This is the message"
            })).rejects.toThrow("13 INTERNAL: Exception Thrown");
        return api.stop();
    });
    
    test("Test the grpc server with route", async () => {
        var host = grpcConfig.bindAddress;
        var port = grpcConfig.port;
        var protopath =  grpcConfig.proto;
        var api = new GrpcServer(protopath, host, port);
        await api.start();
        var response = {data: [{ key : "message", value : "message 1" }]};
        api.route("unit", "TestService1", "TestCommand", (payload) => {
            return response;
        });

        var client = new GrpcClient(grpcConfig.proto, grpcConfig.bindAddress, grpcConfig.port, "TestService1");
        var executeResponse = await client.execute("TestCommand", {
                id: "100",
                message: "This is the message"
            });

        expect(executeResponse).toEqual(response);
        return api.stop();
    });
  });
