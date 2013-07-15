scurry
======

A leveldb-backed consistent hash ring, for your toy caching needs. Seriously unfinished; do not put data in this. No really, don't.

[![NPM](http://nodei.co/npm/scurry.png)](http://nodei.co/npm/scurry/)

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
```

Get it back out: `http GET 10.0.0.5:3336/vodkas/2`

(Human-friendly shell commands courtesy of [httpie](https://github.com/jkbr/httpie).)

## Garnish with a twist of orange peel

### TTLs

Send this header: `X-Scurry-TTL: [seconds]` to specify a time-to-live for your cached data. (This feature is not working yet. Need to figure out how to make the sublevel plugin work with the ttl plugin.)

### Conditional requests

Scurry sends an ETag header and a last-modified timestamp.

## TODO

- The RESTful server is an improving mess. 
- Implement key streaming from multiple nodes. See notes in endpoints.handleGetBucket().
- Reconnect on errors.
- Error handling.
- Better logging.
- Light-cycle is rickety; bullet-proof it.
- Stretch goal: replication? 
