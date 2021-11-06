const esdb = require('@eventstore/db-client');

describe('EventStore projection test', () => {
  test('test', async () => {
    const client = esdb.EventStoreDBClient.connectionString('esdb://localhost:2113?tls=false');
    const readEvents = await client.readStream('$et-PORTFOLIO_CREATED', {
      direction: esdb.FORWARDS,
      fromRevision: 0,
      maxCount: 200,
    });
    readEvents.forEach((e) => {
      console.log(Buffer.from(e.event.data).toString());
    });
  });
});
