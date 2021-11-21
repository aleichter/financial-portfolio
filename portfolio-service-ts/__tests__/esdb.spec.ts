/* eslint-disable no-console */
/* eslint-disable no-undef */
import appConfig from '../config/appConfig';

let ESDB = require('../src/db/esdb.js');
const { WrongExpectedVersion } = require('../src/model/exception/domain-exceptions');

jest.mock('../src/db/esdb');
if (appConfig.testConfig.unmockAll) {
  ESDB = jest.requireActual('../src/db/esdb');
}

describe('Test suite for the ESDB module', () => {
  let dbClient = null;

  const cleanUpStreams = async () => {
    await dbClient.deleteStream('test_1').catch((err) => { console.log(err); });
    await dbClient.deleteStream('test_2').catch((err) => { console.log(err); });
  };

  beforeAll(async () => {
    try {
      dbClient = new ESDB('esdb://localhost:2113?tls=false');
      await cleanUpStreams();
    } catch (err) {
      console.log(err);
    }
  });

  afterEach(async () => {
    await cleanUpStreams();
  });

  test('Test case for appendToStream', async () => {
    const stream = 'test_1';
    const data = {
      id: 'test1',
      message: 'Test Message',
    };
    const type = 'TestEvent';

    await dbClient.createStreamWithAppend(stream, data, type);

    const data2 = {
      id: 'test2',
      message: 'Test Message 2',
    };

    await dbClient.appendToStream(stream, data2, type);

    const events = await dbClient.readStream(stream);
    expect(events.length).toBe(2);
  });

  test('Test case for appendToStream WrongExpectedVersion', async () => {
    const stream = 'test_1';
    const data = {
      id: 'test1',
      message: 'Test Message',
    };
    const type = 'TestEvent';

    const r = await dbClient.createStreamWithAppend(stream, data, type);

    const data2 = {
      id: 'test2',
      message: 'Test Message 2',
    };

    return expect(dbClient.appendToStream(stream, data2, type, BigInt(r.nextExpectedRevision) + 1n))
      .rejects.toThrow(WrongExpectedVersion);
  });

  test('Test case for readStreamLastEvent', async () => {
    const stream = 'test_1';
    const data = {
      id: 'test1',
      message: 'Test Message',
    };
    const type = 'TestEvent';

    await dbClient.createStreamWithAppend(stream, data, type);

    const data2 = {
      id: 'test2',
      message: 'Test Message 2',
    };

    await dbClient.appendToStream(stream, data2, type);

    const events = await dbClient.readStreamLastEvent(stream);
    expect(events.length).toBe(1);
    expect(events[0].event.data.id).toEqual('test2');
  });

  test('Test case for subscribeToAll', async () => {
    const appendEvents = async (stream) => {
      const data = {
        id: 'test1',
        message: 'Test Message',
      };
      const type = 'TestEvent';

      await dbClient.createStreamWithAppend(stream, data, type);

      const data2 = {
        id: 'test2',
        message: 'Test Message 2',
      };

      await dbClient.appendToStream(stream, data2, type);
    };

    const subscribe = async () => new Promise((resolve) => {
      let x = 0;
      const s = dbClient.subscribeToAll();
      s.on('data', () => {
        x += 1;
        if (x === 4) {
          s.unsubscribe();
          resolve(true);
        }
      });
    });

    const p = subscribe();
    await appendEvents('test_1');
    await appendEvents('test_2');
    return p.then((r) => {
      expect(r).toEqual(true);
    });
  });

  test('Test case for subscribeToStream', async () => {
    const appendEvents = async (stream) => {
      const data = {
        id: 'test1',
        message: 'Test Message',
      };
      const type = 'TestEvent';

      await dbClient.createStreamWithAppend(stream, data, type);

      const data2 = {
        id: 'test2',
        message: 'Test Message 2',
      };

      await dbClient.appendToStream(stream, data2, type);
    };

    const subscribe = async (stream) => new Promise((resolve) => {
      let x = 0;
      const s = dbClient.subscribeToStream(stream);
      s.on('data', () => {
        x += 1;
        if (x === 2) {
          s.unsubscribe();
          resolve(true);
        }
      });
    });

    const p = subscribe('test_1');
    await appendEvents('test_1');
    return p.then((r) => {
      expect(r).toEqual(true);
    });
  });
});
