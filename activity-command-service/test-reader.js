const esdb = require('@eventstore/db-client')
const client = esdb.EventStoreDBClient.connectionString("esdb://localhost:2113?tls=false");


function main() {
    var subscription = client
        .subscribeToAll({ fromPosition: esdb.END })
        .on("data", function (resolvedEvent) {
            console.log(
                `Received event ${resolvedEvent.event.revision}@${resolvedEvent.event.streamId}`
            );
        });
    
  //client.deleteStream("some-stream");
}

main()