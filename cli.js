var minimist = require('minimist')
var http = require('http')
var Archiver = require('hypercore-archiver')
var archiverServer = require('.')

var argv = minimist(process.argv.slice(2), {
  alias: {port: 'p'},
  default: {
    port: process.env.PORT || 8080,
    archives: 'dats'
  }
})

var archiver = Archiver(argv.archives)
var datServer = archiverServer(archiver)

var server = http.createServer()
server.on('request', datServer.httpRequest)
server.listen(argv.port, function () {
  console.log('Server is listening on port ' + argv.port)
})
datServer.swarm.on('listening', function () {
  console.log('Listening for connections to Dat Swarm')
})

datServer.swarm.on('connection', function () {
  console.log('new connection on dat')
})
