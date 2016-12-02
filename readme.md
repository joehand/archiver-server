# Archiver-Server

Serve Dat Archives stored in a [hypercore-archiver](https://github.com/mafintosh/hypercore-archiver).

Archives can be served over HTTP and the Dat Network (via `discovery-swarm`).

## Usage

### Serve on Dat Network

Serve archives in a hypercore-archiver with discovery-swarm.

```js
var Archiver = require('hypercore-archiver')
var archiverServer = require('archiver-server')

var archives = Archiver('archives', {swarm: true})
var datServer = archiverServer(archives)

datServer.swarm.on('listening', function () {
  console.log('Listening for connections on the Dat Network')
})

// (Later) Any archives added will be available over discovery-swarm network
archives.add(key)
```

### Serve Over HTTP

```js
var http = require('http')
var Archiver = require('hypercore-archiver')
var archiverServer = require('archiver-server')

var archiver = Archiver('archives')
var datServer = archiverServer(archiver, {http: true})

// Bring your own HTTP server and handle requests
var server = http.createServer()
server.on('request', datServer.httpRequest)
server.listen(argv.httpPort, function () {
    console.log('Server is listening on port ' + port)
})

// (Later) Any archives added will be available over HTTP
archives.add(key)
```

### CLI

Archiver-server provides a basic CLI utility. There is currently no interface to add/remove archives to the hypercore-archiver, so it may be difficult to add use the CLI except for testing on preexisting archiver directories.

Run `npm start` to run the CLI in debug mode.

Options:

* `--httpPort 8080`: Port for HTTP server
* `--datPort 3282`: Port for Dat Network
* `--archiveDir dats`: Directory for `hypercore-archiver` storage
* `--swarm` (boolean): Serve archives on the Dat Network
* `--http` (boolean): Serve archives over HTTP

## API

### var server = archiverServer(archiver, [opts])

Create a server for a `hypercore-archiver`. Use `http` and `swarm` to specify which server types to use.

Options include:

```js
opts = {
  http: true, // Return onrequest function to serve over HTTP
  swarm: true, // Serve over Dat Network
  utp: true, // Passed to Discovery-Swarm
  tcp: true, // Passed to Discovery-Swarm
  datPort: 3282 // Passed to Discovery-Swarm
}
```

#### `server.swarm`

`discovery-swarm` for your archives. Automatically connects.

#### `server.httpRequest`

Bring your own HTTP server. Use `server.httpRequest` for your http server's request function.

HTTP requires hypercore-archiver `^2.3.0`.

## License

MIT
