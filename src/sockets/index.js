/**
 * The contents of this file is free and unencumbered software released into the
 * public domain. For more information, please refer to <http://unlicense.org/>
 *
 * @author Maxmillion McLaughlin <npm@maxmclau.com>
 */

'use strict'

import debug from 'debug'
import socketio from 'socket.io'
import mongoose from 'mongoose'
import assert from 'assert'
import Matchmaker from 'matchmaker'

import models from './../models'

let log = debug('api-halfsies-co')

let User = mongoose.model('User')
let Match = mongoose.model('Match')

const __SPLIT__ = 1
const __STEAL__ = 2

let mm = new Matchmaker;
mm.prefs.checkinterval = 500;
mm.prefs.maxiters = 1;
mm.policy = (a,b) => 100

export default (app) => {
  let io = socketio.listen(app)

  io.on('connection', (socket) => {
    log('new socket connection')

    socket.on('loginUser', (nickname) => {
      socket.nickname = nickname
      log(`login from ${nickname}`)

      let user = null

      User.findOne({name: nickname}, (err, obj) => {
        if(obj) {
          socket.emit('didLogin', obj)
        } else {  // If not found, then create user
          let user = new User({name: nickname, balance: 5000})
          user.save()

          socket.emit('didLogin', user)
        }
      })
    })

    socket.on('findMatch', () => {
      let clients = io.sockets.clients();

      log(`searching for ${socket.nickname}`)
      mm.push(socket)
    })

    socket.on('split', (match) => {
      log(`${socket.nickname} did split`)

      Match.findByIdAndUpdate(
        match._id,
        {$push: {split: socket.nickname}},
        {safe: true, upsert: true, new: true},
        (err, obj) => computeMatch(obj)
      )
    })

    socket.on('steal', (match) => {
      log(`${socket.nickname} did steal`)

      Match.findByIdAndUpdate(
        match._id,
        {$push: {steal: socket.nickname}},
        {safe: true, upsert: true, new: true},
        (err, obj) => computeMatch(obj)
      )
    })

    socket.on('disconnect', () => log('user disconnected'))
  })

  mm.on('match', function(result) {
    log(`did match fuckbois ${result.a.nickname} & ${result.b.nickname}`)

    const room = new Date().getTime()
    result.a.join(room)
    result.b.join(room)

    User.findOne({name: result.a.nickname}, (err, a) => {
      User.findOne({name: result.b.nickname}, (err, b) => {
        let match = new Match({opponents: [a, b], room: room, pot: 0, split: [], steal: []})
        match.save()

        io.in(room).emit('foundMatch', match)
      })
    })
  })

  mm.start()

  return io
}

function computeMatch(match) {
  // If two actions have been taken, then lets compute
  let splits = match.split.length
  let steals = match.split.length
  let actions = splits + steals
  if(actions < 2) return false

  if(splits == 2) { // Both split the pot

  } else if(steals == 2) { // Pot goes to house

  } else { // Chumped cuker

  }
}
