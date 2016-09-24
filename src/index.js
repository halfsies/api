/**
 * The contents of this file is free and unencumbered software released into the
 * public domain. For more information, please refer to <http://unlicense.org/>
 *
 * @author Maxmillion McLaughlin <npm@maxmclau.com>
 */

'use strict'

import debug from 'debug'
import yaml from 'yamljs'
import express from 'express'
import bodyParser from 'body-parser'
import expressHealthCheck from 'express-healthcheck'
import expressStatusMonitor from 'express-status-monitor'
import http from 'http'
import mongoose from 'mongoose'

import api from './api'
import sockets from './sockets'

let log = debug('api-halfsies-co')

let app = express()

let server = http.Server(app)
let io = sockets(server)

mongoose.connect('mongodb://localhost:27017/halfsies')

let apiVersion = yaml.load(`${__dirname}/./../app.yaml`).api_version

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.use('/', express.static(`${__dirname}/./public`))

app.use('/_ah', expressStatusMonitor())
app.use('/_ah/health', expressHealthCheck())

app.use(`/${apiVersion}`, api())

let apiListener = app.listen(process.env.PORT || 8080, () => {
  log(`did start api server on port ${apiListener.address().port}`)
})

let socketListener = server.listen(8888, () => {
  log(`did start socket server on port ${socketListener.address().port}`)
})

export default app
