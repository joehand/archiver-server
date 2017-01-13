var Swarm = require('discovery-swarm')
var swarmDefaults = require('datland-swarm-defaults')
var hyperdriveHttp = require('hyperdrive-http')
var lru = require('lru')
var hyperdrive = require('hyperdrive')
var debug = require('debug')('archiver-server')

module.exports = function (archiver, opts) {
  opts = opts || {}
  opts.swarm = opts.swarm || true
  opts.http = opts.http || true

  // Dat Swarm options
  opts.datPort = opts.datPort || false
  opts.tcp = opts.tcp || true
  opts.utp = opts.utp || true

  return {
    swarm: opts.swarm ? createSwarm(archiver, opts) : null,
    httpRequest: opts.http ? hyperdriveHttp(getArchive(archiver, opts)) : null
  }
}

function getArchive (archiver, opts) {
  var drive = hyperdrive(archiver.db)
  var cache = lru(opts.cacheSize || 100)
  cache.on('evict', function (item) {
    // TODO ?
  })

  return function (dat, cb) {
    if (!dat.key) return cb('please provide key') // TODO: fix bug?
    debug('Archive HTTP request', JSON.stringify(dat))

    var archive = cache.get(archiver.discoveryKey(new Buffer(dat.key, 'hex')).toString('hex'))
    if (archive) return cb(null, archive)
    debug('Getting archive:', dat.key)

    archiver.get(dat.key, function (err, feed, contentFeed) {
      debug('got archive', err)
      if (err || !feed) return cb('not found')
      if (!contentFeed) return cb('TODO: hypercore feed, not archive')
      debug('got archive')

      archive = drive.createArchive(dat.key, {
        metadata: feed,
        content: contentFeed
      })

      cache.set(archive.discoveryKey.toString('hex'), archive)
      cb(null, archive)
    })
  }
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
    if (opts.datPort) swarm.listen(opts.datPort)
    else swarm.listen()
  }

  archiver.changes(function (err, feed) {
    if (err) throw err
    swarm.join(feed.discoveryKey)
    debug('Changes feed available at: ' + feed.key.toString('hex'))
  })

  archiver.list().on('data', function (key) {
    // random timeout so it doesn't flood DHT
    timeouts.push(setTimeout(function () {
      serveArchive(key)
    }, Math.floor(Math.random() * 30 * 1000)))
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
