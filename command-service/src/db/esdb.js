const { START } = require('@eventstore/db-client');
const esdb = require('@eventstore/db-client')

class ESDB {

    constructor(connection) {
        this.connection = connection
        this.client = esdb.EventStoreDBClient.connectionString(connection)
    }

    createStreamWithAppend(stream, data, type) {
        return this.appendToStream(stream, data, type, { expectedRevision: esdb.NO_STREAM });
    }

    appendToStream(stream, data, type, writeOptions = { expectedRevision: esdb.STREAM_EXISTS }) {
        var event = {
            type: type,
            data: data
        }
        var jsonEvent = esdb.jsonEvent(event);
        return this.client.appendToStream(stream, jsonEvent, writeOptions);
    }

    subscribeToAll() {
        return this.client.subscribeToAll({ fromPosition: esdb.END });
    }

    subscribeToStream(stream) {
        return this.client.subscribeToStream(stream, {fromRevision: esdb.START});
    }

    readStream(stream) {
        return this.client.readStream(stream, {
                    direction: esdb.FORWARDS,
                    fromRevision: esdb.START,
                    maxCount: 200,
                });
    }

    readStreamLastEvent(stream) {
        return this.client.readStream(stream, {
            direction: esdb.BACKWARDS,
            fromRevision: esdb.END,
            maxCount: 1
        })
    }

    deleteStream(stream) {
        return this.client.deleteStream(stream);
    }
}

module.exports = ESDB;