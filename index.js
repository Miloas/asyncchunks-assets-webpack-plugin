'use strict'

var createQueuedWriter = require('./lib/output/createQueuedWriter')
var createOutputWriter = require('./lib/output/createOutputWriter')


class PreloadAsyncChunksplugin {

  constructor(options) {
    this.options = options
    this.writer = createQueuedWriter(createOutputWriter(options))
  }

  apply(compiler) {
    const options = this.options
    const self = this
    let extractedChunks = []

    compiler.plugin('after-emit', function (compilation, callback) {
      let asyncChunksSource = null
      try {
        asyncChunksSource = compilation
          .chunks.filter(chunk => !chunk.isInitial())
          .map(chunk => chunk.files)
      } catch (e) {
        asyncChunksSource = compilation.chunks
          .map(chunk => chunk.files)
      }
      const publicPath = compilation.outputOptions.publicPath || '';
      extractedChunks = ([].concat.apply([], asyncChunksSource))
        .filter(entry => {
          return options.fileBlacklist.every(regex => regex.test(entry) === false);
        })
        .map(entry => {
          return publicPath + entry
        })
      self.writer({
        preloadAsyncChunks: extractedChunks
      }, function (err) {
        if (err) {
          compilation.errors.push(err)
        }
        callback()
      })
    })
  }
}

module.exports = PreloadAsyncChunksplugin