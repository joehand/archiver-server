# Archiver-Server

Serve keys found in a [hypercore-archiver](https://github.com/mafintosh/hypercore-archiver) with `discovery-swarm`.

## Usage

Serve archives in a hypercore-archiver with discovery-swarm.

```js
var Archiver = require('hypercore-archiver')
var server = require('archiver-server')

var archives = Archiver({dir: process.cwd()})
server(archives)

// Any archives added will be available over discovery-swarm network
archives.add(key)
```

## API

### server(archiver, [opts])

Start serving archives. Will list existing keys to serve and serve new keys when added.

```js
opts = {
  utp: true,
  tcp: true,
  port: 3282
}
```

### HTTP

Requires hypercore archive ^2.3.0

## TODO:

* Serve over http with hyperdrive-http

## License

MIT
