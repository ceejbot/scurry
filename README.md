scurry
======

[![Greenkeeper badge](https://badges.greenkeeper.io/ceejbot/scurry.svg)](https://greenkeeper.io/)

A leveldb-backed consistent hash ring, for your caching needs. I can see the day when you might want to put data in this & feel reasonably sort of confident you might get it back out again. If this scares you, it's supposed to.

[![on npm](http://img.shields.io/npm/v/scurry.svg?style=flat)](https://www.npmjs.org/package/scurry)   [![Tests](http://img.shields.io/travis/ceejbot/scurry.svg?style=flat)](http://travis-ci.org/ceejbot/scurry)  [![Coverage Status](http://img.shields.io/coveralls/ceejbot/scurry.svg?style=flat)](https://coveralls.io/r/ceejbot/scurry)    [![Dependencies](http://img.shields.io/david/ceejbot/scurry.svg?style=flat)](https://david-dm.org/ceejbot/scurry)


## One part each

Rod Vagg's [levelup](https://github.com/rvagg/node-levelup) leveldb bindings for node + [sublevel](https://github.com/dominictarr/level-sublevel) to create buckets.

Dominic Tarr's [crtd](https://github.com/dominictarr/crdt), which uses his [scuttlebutt implementation](https://github.com/dominictarr/scuttlebutt) to keep a document in sync.

[light-cycle](https://github.com/ceejbot/light-cycle), a lightweight consistent hash ring structure that can be mixed into most anything.

[restify](http://mcavage.me/node-restify/) to provide a simple RESTful api to data in the buckets.

## Shake with ice

Run a server:

`node index.js --id=node-one -m -p 3333 -g 4114 -d ./db | ./node_modules/.bin/bunyan -o short`

Run a client or five:

```shell
node index.js --id=node-two -p 3334 -g 4114 -s 10.0.0.5 -d ./db2 | ./node_modules/.bin/bunyan -o short
node index.js --id=node-three -p 3335 -g 4114 -s 10.0.0.5 -d ./db3 | ./node_modules/.bin/bunyan -o short
node index.js --id=node-four -p 3336 -g 4114 -s 10.0.0.5 -d ./db4 | ./node_modules/.bin/bunyan -o short
```

Replace `10.0.0.5` with the IP address of your server.

## Strain into a chilled glass

Then stuff some data in:

```shell
http PUT 10.0.0.5:3334/vodkas/1 name="Sobieski" rating=5
http PUT 10.0.0.5:3335/vodkas/2 name="Tito's Handmade" rating=5
http PUT 10.0.0.5:3335/vodkas/3 name="Bimber" rating=4
```

Get it back out: `http GET 10.0.0.5:3336/vodkas/2 | json`

(Human-friendly shell commands courtesy of [httpie](https://github.com/jkbr/httpie)).

## Garnish with a twist of orange peel

API endpoints exposed:

- `GET /:bucket`: stream sorted keys for a bucket (works!)
- `POST /:bucket`: add an item to the cache; id is generated for you & returned
- `PUT /:bucket/:id`: add/update an item in the cache; 204 response
- `GET /:bucket/:id`: get an item from the cache
- `HEAD /:bucket/:id`: headers for an item
- `DEL /:bucket/:id`: remove an item

### TTLs

Send this header to specify a time-to-live for your cached data: `X-Scurry-TTL: [seconds]`

### Conditional requests

Scurry sends an ETag header and a last-modified timestamp.

### Storage format

As of version 0.0.4, the data stored in the LevelDB nodes is json structured as follows:

```javascript
{
	version:        1,                       // storage version
    ts:             Date.now(),              // timestamp of last set()
    payload:        value,                   // base64-encoded string if buffer, JSON string if not
    etag:           crc.digest('hex'),       // md5 hex digest of payload
    base64:         valueIsB64String,        // true if the payload had to be base64 encoded
    'content-type': metadata['content-type'] // content-type if passed in
};

```

## TODO

Upcoming releases:

- Release 0.0.4 will probably make streaming keys work, maybe. Done!
- Release 0.0.5 will finalize the storage format. Probably done!
- Release 0.0.6 will contemplate eviction. Not yet!

General goals:

- Implement key streaming from multiple nodes. See notes in endpoints.handleGetBucket().
- The RESTful server needs error handling.
- Reconnect on errors.
- Error handling.
- Better logging. Configurable, for one thing.
- Back ends should be pluggable; the API is very small.
- Stretch goal: replication?

## License

MIT.
