const {v4 : uuidv4} = require('uuid')
const db = {};

const mockAppendToStream = (stream, data, type, expectedRevision) => {
  var event = {
    event: {
      streamId: stream,
      id: uuidv4(),
      revision: 0n,
      type: type,
      data: data,
      metadata: undefined,
      isJson: true,
      created: Math.floor(new Date().getTime())
    }
  };

  if(db[stream]) {
    event.event.revision = db[stream][db[stream].length - 1].event.revision + 1n;
    db[stream].push(event);
  } else {
    db[stream] = [event];
  }
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
    subscribeToAll: mockSubscribeToAll,
    subscribeToStream: mockSubscribeToStream,
    readStream: mockReadStream,
    deleteStream: mockDeleteStream
  };
});

module.exports = mock;