var ESDB = require('../db/esdb.js')
const config = require('config');
const { WrongExpectedVersion } = require('../model/exception/domain-exceptions');

jest.mock('../db/esdb');
if(config.hasOwnProperty("testConfig") && config.testConfig.hasOwnProperty("unmockAll") && config.testConfig.unmockAll) {
    ESDB = jest.requireActual('../db/esdb');
}

const isPromise = (promise) => {  
    return !!promise && typeof promise.then === 'function'
}

describe("Test suite for the ESDB module", () => {
    var dbclient = null;

    const cleanUpStreams = async () => {
        await dbclient.deleteStream("test_1").catch((err) => { console.log(err) });
        await dbclient.deleteStream("test_2").catch((err) => { console.log(err) });
    }

    beforeAll(async () => {
        try {
            dbclient = new ESDB("esdb://localhost:2113?tls=false");
            await cleanUpStreams();
        } catch(err) {
            console.log(err);
        }
    });
    
    afterEach(async () => {
        await cleanUpStreams();
    });

    test("Test case for appendToStream", async () => {
        let stream = "test_1";
        let data = {
            id: "test1",
            message: "Test Message"
        };
        let type = "TestEvent"

        await dbclient.createStreamWithAppend(stream, data, type)

        let data2 = {
            id: "test2",
            message: "Test Message 2"
        };

        await dbclient.appendToStream(stream, data2, type)

        let events = await dbclient.readStream(stream);
        expect(events.length).toBe(2);
    });

    test("Test case for appendToStream WrongExpectedVersion", async () => {
        let stream = "test_1";
        let data = {
            id: "test1",
            message: "Test Message"
        };
        let type = "TestEvent"

        var r = await dbclient.createStreamWithAppend(stream, data, type)

        let data2 = {
            id: "test2",
            message: "Test Message 2"
        };

        return expect(dbclient.appendToStream(stream, data2, type, BigInt(r.nextExpectedRevision) + 1n))
            .rejects.toThrow(WrongExpectedVersion);
    });

    test("Test case for readStreamLastEvent", async () => {
        let stream = "test_1";
        let data = {
            id: "test1",
            message: "Test Message"
        };
        let type = "TestEvent"

        await dbclient.createStreamWithAppend(stream, data, type)

        let data2 = {
            id: "test2",
            message: "Test Message 2"
        };

        await dbclient.appendToStream(stream, data2, type)

        let events = await dbclient.readStreamLastEvent(stream);
        expect(events.length).toBe(1);
        expect(events[0].event.data.id).toEqual("test2");
    });

    test("Test case for subscribeToAll", async () => {
        const appendEvents = async (stream) => {
            let data = {
                id: "test1",
                message: "Test Message"
            };
            let type = "TestEvent"
    
            await dbclient.createStreamWithAppend(stream, data, type)
    
            let data2 = {
                id: "test2",
                message: "Test Message 2"
            };
    
            await dbclient.appendToStream(stream, data2, type)
        }

        const subscribe = async () => {
            return new Promise((resolve, reject) => {
                var x = 0;
                var s = dbclient.subscribeToAll();
                s.on("data", (event) => {
                    x = x + 1;
                    if(x == 4) {
                        s.unsubscribe();
                        resolve(true);
                    }
                })
            });
        }

        let p = subscribe();
        await appendEvents("test_1");
        await appendEvents("test_2");
        return p.then((r) => {
            expect(r).toEqual(true)
        });
    });

    test("Test case for subscribeToStream", async () => {
        const appendEvents = async (stream) => {
            let data = {
                id: "test1",
                message: "Test Message"
            };
            let type = "TestEvent"
    
            await dbclient.createStreamWithAppend(stream, data, type)
    
            let data2 = {
                id: "test2",
                message: "Test Message 2"
            };
    
            await dbclient.appendToStream(stream, data2, type)
        }

        const subscribe = async (stream) => {
            return new Promise((resolve, reject) => {
                var x = 0;
                var s = dbclient.subscribeToStream(stream);
                s.on("data", (event) => {
                    x = x + 1;
                    if(x == 2) {
                        s.unsubscribe();
                        resolve(true);
                    }
                })
            });
        }

        let p = subscribe("test_1");
        await appendEvents("test_1");
        return p.then((r) => {
            expect(r).toEqual(true)
        });
    });
})