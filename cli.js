var minimist = require('minimist')
var http = require('http')
var Archiver = require('hypercore-archiver')
var archiverServer = require('.')

var argv = minimist(process.argv.slice(2), {
  alias: {
    httpPort: 'p'
  },
  default: {
    httpPort: process.env.PORT || 8080,
    datPort: 3282,
    archiveDir: 'dats',
    swarm: true,
    http: true
  },
  boolean: ['swarm', 'http']
})

var archiver = Archiver(argv.archiveDir)
var datServer = archiverServer(archiver, argv)

if (argv.http) {
  var server = http.createServer()
  server.on('request', datServer.httpRequest)
  server.listen(argv.httpPort, function () {
    console.log('Server is listening on port ' + argv.httpPort)
  })
}

if (argv.swarm) {
  datServer.swarm.on('listening', function () {
    console.log('Listening for connections on the Dat Network')
  })
}
