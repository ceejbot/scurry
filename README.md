scurry
======

A truly ridiculous idea. 

Server:

`node index.js --id=node-master -p 3333 -g 4114 -s -d ./db | ./node_modules/.bin/bunyan -o short`

Client:

`node index.js --id=node-two -p 3333 -g 4114 -h [server-ip] -d ./db| ./node_modules/.bin/bunyan -o short`
