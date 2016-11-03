var Swarm = require('discovery-swarm')
var swarmDefaults = require('datland-swarm-defaults')

module.exports = function (archiver, opts) {
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
