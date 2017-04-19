#!/usr/bin/env node

var minimist = require('minimist')
var Archiver = require('hypercore-archiver')
var archiverServer = require('.')

var argv = minimist(process.argv.slice(2), {
  alias: {
    port: 'p'
  },
  default: {
    port: 3282,
    archiveDir: 'dats'
  }
})

var archiver = Archiver(argv.archiveDir)
var datServer = archiverServer(archiver, argv)

datServer.on('listening', function () {
  console.log('Listening for connections on the Dat Network')
})
