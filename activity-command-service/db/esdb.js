const esdb = require('@eventstore/db-client')

class ESDB {
    constructor(connection) {
        this.connection = connection
        this.client = esdb.EventStoreDBClient.connectionString(connection);
    }

    append(stream, data, type) {
        var event = {
            type: type,
            data: data
        }
        var jsonEvent = esdb.jsonEvent(event);
        this.client.appendToStream(stream, jsonEvent);
    }
}

module.exports = ESDB;