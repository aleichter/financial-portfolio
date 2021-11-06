const { START, WrongExpectedVersionError } = require('@eventstore/db-client');
const esdb = require('@eventstore/db-client')
const { WrongExpectedVersion } = require("../model/exception/domain-exceptions");

class ESDB {

    constructor(connection) {
        this.connection = connection
        this.client = esdb.EventStoreDBClient.connectionString(connection)
    }

    createStreamWithAppend(stream, data, type) {
        return this.appendToStream(stream, data, type, esdb.NO_STREAM);
    }

    appendToStream(stream, data, type, expectedRevision = null) {
        var event = {
            type: type,
            data: data
        }
        var jsonEvent = esdb.jsonEvent(event);
        var writeOptions = { expectedRevision: esdb.STREAM_EXISTS };
        if(expectedRevision != null) {
            writeOptions = { expectedRevision: expectedRevision };
        }
        return this.client.appendToStream(stream, jsonEvent, writeOptions)
            .catch((err) => {
                if(err instanceof WrongExpectedVersionError) {
                    throw new WrongExpectedVersion(err.expectedVersion, err.actualVersion);
                } else {
                    throw err;
                }
            });
    }

    subscribeToAll() {
        return this.client.subscribeToAll({ fromPosition: esdb.END });
    }

    subscribeToStream(stream) {
        return this.client.subscribeToStream(stream, {fromRevision: esdb.START});
    }

    readStream(stream, fromRevision = null) {
        if(fromRevision == null) {
            fromRevision = esdb.START;
        }
        return this.client.readStream(stream, {
                    direction: esdb.FORWARDS,
                    fromRevision: fromRevision,
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