var Swarm = require('discovery-swarm')
var swarmDefaults = require('dat-swarm-defaults')
var xtend = require('xtend')
var debug = require('debug')('archiver-server')

module.exports = function (archiver, opts) {
  opts = xtend({
    port: 3282,
    tcp: true,
    utp: true
  }, opts)

  return createSwarm(archiver, opts)
}

function createSwarm (archiver, opts) {
  if (!archiver) throw new Error('hypercore archiver required')
  if (!opts) opts = {}

  var timeouts = []
  var swarmOpts = swarmDefaults({
    utp: opts.utp,
    tcp: opts.tcp,
    dht: opts.dht,
    dns: opts.dns,
    hash: false,
    stream: function () {
      return archiver.replicate() // TODO: can you do {upload, download} here?
    }
  })
  var swarm = Swarm(swarmOpts)
  swarm.once('error', function () {
    if (!opts.dontShare) swarm.listen(0)
  })
  swarm.once('close', function () {
    timeouts.forEach(function (timeout) {
      clearTimeout(timeout)
    })
  })
  if (!opts.dontShare) {
    if (opts.datPort) swarm.listen(opts.port)
    else swarm.listen()
  }

  archiver.changes(function (err, feed) {
    if (err) throw err
    swarm.join(feed.discoveryKey)
    debug('Changes feed available at: ' + feed.key.toString('hex'))
  })

  archiver.list().on('data', function (key) {
    if (!opts.dht) serveArchive(key)
    else {
      // random timeout so it doesn't flood DHT
      timeouts.push(setTimeout(function () {
        serveArchive(key)
      }, Math.floor(Math.random() * 30 * 1000)))
    }
  })
  archiver.on('add', serveArchive)
  archiver.on('remove', function (key) {
    swarm.leave(archiver.discoveryKey(key))
  })

  return swarm

  function serveArchive (key) {
    debug(`Serving Archive ${key.toString('hex')} on Dat`)
    swarm.join(archiver.discoveryKey(key), {dontShare: opts.dontShare})
  }
}
