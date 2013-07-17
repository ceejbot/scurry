scurry
======

A leveldb-backed consistent hash ring, for your caching needs. I can see the day when you might want to put data in this & feel reasonably sort of confident you might get it back out again. If this scares you, it's supposed to.

[![NPM](https://nodei.co/npm/scurry.png)](https://nodei.co/npm/scurry/)

[![Build Status](https://secure.travis-ci.org/ceejbot/scurry.png)](http://travis-ci.org/ceejbot/scurry)
[![Dependencies](https://david-dm.org/ceejbot/scurry.png)](https://david-dm.org/ceejbot/scurry)
[![Coverage Status](https://coveralls.io/repos/ceejbot/scurry/badge.png)](https://coveralls.io/r/ceejbot/scurry)

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
http -f PUT 10.0.0.5:3334/vodkas/1 name="Sobieski" rating=5
http -f PUT 10.0.0.5:3335/vodkas/2 name="Tito's Handmade" rating=5
http -f PUT 10.0.0.5:3335/vodkas/3 name="Tito's Handmade" rating=5
```

Get it back out: `http GET 10.0.0.5:3336/vodkas/2`

(Human-friendly shell commands courtesy of [httpie](https://github.com/jkbr/httpie).)

## Garnish with a twist of orange peel

API endpoints exposed:

- `GET /:bucket`: stream sorted keys for a bucket (not yet working)
- `POST /:bucket`: add an item to the cache; id is generated for you & returned
- `PUT /:bucket/:id`: add/update an item in the cache; 204 response
- `GET /:bucket/:id`: get an item from the cache
- `HEAD /:bucket/:id`: headers for an item
- `DEL /:bucket/:id`: remove an item

### TTLs

Send this header to specify a time-to-live for your cached data: `X-Scurry-TTL: [seconds]`

### Conditional requests

Scurry sends an ETag header and a last-modified timestamp.

## TODO

- The goal of release 0.0.3 is testability & a lot of tests.
- Release 0.0.4 will probably make streaming keys work, maybe.
- The RESTful server is an improving mess. 
- Implement key streaming from multiple nodes. See notes in endpoints.handleGetBucket().
- Reconnect on errors.
- Error handling.
- Better logging. Configurable, for one thing.
- Light-cycle is rickety; bullet-proof it.
- Stretch goal: replication? 
- Back ends should be pluggable; the API is very small.
- Consider integrating with @rvagg's level-cache module as a back end. (Would need to do the etag/last-mod calc at a higher level.)


