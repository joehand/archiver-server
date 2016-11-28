var path = require('path')
var Swarm = require('discovery-swarm')
var swarmDefaults = require('datland-swarm-defaults')
var hyperdriveHttp = require('hyperdrive-http')
var lru = require('lru')

module.exports = function (archiver, opts) {
  if (!opts) opts = {}
  return {
    swarm: createSwarm(archiver, opts),
    httpRequest: hyperdriveHttp(getArchive(archiver, opts))
  }
}

function getArchive (archiver, opts) {
  var cache = lru(opts.cacheSize || 100)
  cache.on('evict', function (item) {
    // TODO ?
  })

  return function (dat, cb) {
    if (!dat.key) return cb('please provide key') // TODO: fix bug?
    console.log('request', dat)
    var archive = cache.get(archiver.discoveryKey(new Buffer(dat.key, 'hex')).toString('hex'))
    if (archive) {
      console.log('found archive in cache!')
      return cb(null, archive)
    }
    archiver.get(dat.key, function (err, archive) {
      if (err || !archive) return cb('not found')
      cache.set(archive.discoveryKey.toString('hex'), archive)
      cb(null, archive)
    })
  }
}

function createSwarm (archiver, opts) {
  if (!archiver) throw new Error('hypercore archiver required')
  if (!opts) opts = {}

  var swarm = Swarm(swarmDefaults({
    utp: opts.utp || true,
    tcp: opts.tcp || true,
    hash: false,
    stream: function () {
      return archiver.replicate()
    }
  }))
  swarm.once('error', function () {
    swarm.listen(0)
  })
  swarm.listen(opts.port || 3282)

  archiver.list().on('data', serveArchive)
  archiver.on('add', serveArchive)
  archiver.on('remove', function (key) {
    swarm.leave(archiver.discoveryKey(key))
  })

  return swarm

  function serveArchive (key) {
    // random timeout so it doesn't flood DHT
    setTimeout(function () {
      swarm.join(archiver.discoveryKey(key))
    }, Math.floor(Math.random() * 30 * 1000))
  }
}
