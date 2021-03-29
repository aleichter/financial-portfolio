const { WrongExpectedVersion } = require("../../model/exception/domain-exceptions");
const {v4 : uuidv4} = require('uuid')
const db = {};

const mockCreateStreamWithAppend = (stream, data, type) => {
  if(db.hasOwnProperty(stream)) {
    throw new WrongExpectedVersion(null, null);
  } else {
    db[stream] = [];
  }

  return mockAppendToStream(stream, data, type);
}

const mockAppendToStream = (stream, data, type, expectedRevision = null) => {
  return new Promise((resolve, reject) => {
    var actualRevision = 0n;
    if(db[stream] && db[stream].length > 0) {
      actualRevision = db[stream][db[stream].length - 1].event.revision;
    }

    if(expectedRevision != null && (db[stream] == null ||  actualRevision != expectedRevision)) {
      reject(new WrongExpectedVersion(expectedRevision, actualRevision));
    } 
    
    if(db[stream]) {
      var event = {
        event: {
          streamId: stream,
          id: uuidv4(),
          revision: BigInt(db[stream].length),
          type: type,
          data: data,
          metadata: undefined,
          isJson: true,
          created: Math.floor(new Date().getTime())
        }
      };
      db[stream].push(event);
      actualRevision = event.event.revision;
    } else {
      reject(new WrongExpectedVersion(expectedRevision, actualRevision));
    }
  
    resolve( {
      nextExpectedRevision: actualRevision
    });
  });
}

const mockSubscribeToAll = () => {
  var unsubscribed = false;
  var streamIndex = {};
  const on = (event, callback) => {
    var refreshId = setInterval(() => {
      if(unsubscribed) {
        clearInterval(refreshId);
      } else {
        for (let stream in db) {
          if(!streamIndex.hasOwnProperty(stream)) {
            streamIndex[stream] = 0;
          }
          var l = db[stream].length;
          for(var i = streamIndex[stream]; i < l; i++) {
            callback(db[stream][i]);
            streamIndex[stream] = i + 1;
          }
        }
      }
    },
    100
    );
  }

  const unsubscribe = () => {
    unsubscribed = true;
  }

  return {
    on: on,
    unsubscribe: unsubscribe
  }
}

const mockSubscribeToStream = (stream) => {
  var unsubscribed = false;
  var streamIndex = {};
  const on = (event, callback) => {
    var refreshId = setInterval(() => {
      if(unsubscribed) {
        clearInterval(refreshId);
      } else {
        if(db.hasOwnProperty(stream)) {
          if(!streamIndex.hasOwnProperty(stream)) {
            streamIndex[stream] = 0;
          }
          var l = db[stream].length;
          for(var i = streamIndex[stream]; i < l; i++) {
            callback(db[stream][i]);
            streamIndex[stream] = i + 1;
          }
        }
      }
    },
    100
    );
  }

  const unsubscribe = () => {
    unsubscribed = true;
  }

  return {
    on: on,
    unsubscribe: unsubscribe
  }
}

const mockReadStreamLastEvent = (stream) => {
  return  new Promise(async (resolve, reject) => {
          try {
            var events = await mockReadStream(stream);
            var lastEvent = events[events.length - 1];
            resolve([lastEvent]);
          } catch (err) {
            reject(err);
          }
        });
}

const mockReadStream = (stream) => {
  return new Promise((resolve,reject) => {
    if(db.hasOwnProperty(stream)){
      resolve(db[stream]);
    } else {
      reject(new Error(stream + " not found"));
    }
  });
}

const mockDeleteStream = (stream) => {
  return new Promise((resolve, reject) => {
    try {
      delete db[stream]
      resolve();
    } catch(err) {
      reject(err);
    }
  });
}

const mock = jest.fn().mockImplementation(() => {
  return {
    appendToStream: mockAppendToStream,
    createStreamWithAppend: mockCreateStreamWithAppend,
    subscribeToAll: mockSubscribeToAll,
    subscribeToStream: mockSubscribeToStream,
    readStream: mockReadStream,
    deleteStream: mockDeleteStream,
    readStreamLastEvent: mockReadStreamLastEvent
  };
});

module.exports = mock;