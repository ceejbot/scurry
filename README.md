scurry
======

A leveldb-backed consistent hash ring, for your toy caching needs. Seriously unfinished; do not put data in this. No really, don't.

## Mix in a cocktail shaker

Rod Vagg's [levelup](https://github.com/rvagg/node-levelup) leveldb bindings for node + [sublevel](https://github.com/dominictarr/level-sublevel) to create buckets.

Dominic Tarr's [crtd](https://github.com/dominictarr/crdt), which uses his [scuttlebutt implementation](https://github.com/dominictarr/scuttlebutt) to keep a document in sync.

[light-cycle](https://github.com/ceejbot/light-cycle), the lightweight consistent hash ring I wrote recently.

[restify](http://mcavage.me/node-restify/) to provide a simple RESTful api to data in the buckets.

## Shake with ice

Run a server:

`node index.js --id=node-one -s -p 3333 -g 4114 -d ./db | ./node_modules/.bin/bunyan -o short`

Run a client or five:

```shell
node index.js --id=node-two -p 3334 -g 4114 -h 10.0.0.5 -d ./db2 | ./node_modules/.bin/bunyan -o short
node index.js --id=node-three -p 3335 -g 4114 -h 10.0.0.5 -d ./db3 | ./node_modules/.bin/bunyan -o short`
node index.js --id=node-four -p 3336 -g 4114 -h 10.0.0.5 -d ./db4 | ./node_modules/.bin/bunyan -o short
```

Replace `10.0.0.5` with the IP address of your server.

## Strain into a chilled glass

Then stuff some data in: 

```shell
http -f PUT 10.0.0.5:3334/vodkas/1 name="Sobieski" rating=5
http -f PUT 10.0.0.5:3335/vodkas/2 name="Tito's Handmade" rating=5
```

Get it back out: `http GET 10.0.0.5:3336/vodkas/2`
