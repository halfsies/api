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

const anty = 10
const houseMul = 0.8

const __SPLIT__ = 1
const __STEAL__ = 2

let house = null
User.findOne({nickname: 'house'}, (err, obj) => house = obj)

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

      User.findOne({nickname: nickname}, (err, obj) => {
        if(obj) {
          socket.emit('didLogin', obj)
        } else {  // If not found, then create user
          let user = new User({nickname: nickname, balance: 5000})
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

    socket.on('didSplit', (match) => {
      log(`${socket.nickname} did split`)

      User.findOne({nickname: socket.nickname}, (err, obj) => {
        Match.findByIdAndUpdate(
          match._id,
          {$push: {split: obj}},
          {safe: true, upsert: true, new: true},
          (err, obj) => computeMatch(obj)
        )
      })
    })

    socket.on('didSteal', (match) => {
      log(`${socket.nickname} did steal`)

      User.findOne({nickname: socket.nickname}, (err, obj) => {
        Match.findByIdAndUpdate(
          match._id,
          {$push: {steal: obj}},
          {safe: true, upsert: true, new: true},
          (err, obj) => computeMatch(obj)
        )
      })
    })

    socket.on('disconnect', () => log('user disconnected'))
  })

  mm.on('match', function(result) { // Found match
    log(`did match fuckbois ${result.a.nickname} & ${result.b.nickname}`)

    const room = new Date().getTime()
    result.a.join(room)
    result.b.join(room)

    User.findOne({nickname: result.a.nickname}, (err, a) => {
      User.findOne({nickname: result.b.nickname}, (err, b) => {
        let pot = 0

        a.balance -= anty
        pot += anty
        a.save()

        b.balance -= anty
        pot += anty
        b.save()

        house.balance -= (anty * houseMul)
        pot += (anty * houseMul)
        house.save()

        let match = new Match({opponents: [a, b], room: room, anty: anty, pot: pot, split: [], steal: []})
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
  let steals = match.steal.length
  let actions = splits + steals
  if(actions < 2) return false

  let matchVersus = match.opponents[0].nickname + ' vs ' + match.opponents[1].nickname

  if(splits == 2) { // Both split the pot
    log(`${matchVersus} will split`)
    let earnings = match.pot/2
    User.findOne({nickname: match.opponents[0].nickname}, (err, user) => {
      user.balance += earnings
      user.save()
    })
    User.findOne({nickname: match.opponents[1].nickname}, (err, user) => {
      user.balance += earnings
      user.save()
    })

  } else if(steals == 2) { // Both steal so pot goes to house
    log(`${matchVersus} both stole`)

    house.balance += match.pot
    house.save()
  } else { // Chumped sucker

    let earnings = match.anty + (match.anty * houseMul)

    User.findOne({nickname: match.opponents[0].nickname}, (err, user) => {
      if(match.steal[0].nickname == user.nickname) {
        log(`${user.nickname} is top fuckboi`)
        user.balance += earnings
        user.save()
      }
    })
    User.findOne({nickname: match.opponents[1].nickname}, (err, user) => {
      if(match.steal[0].nickname == user.nickname) {
        log(`${user.nickname} is top fuckboi`)
        user.balance += earnings
        user.save()
      }
    })

    house.balance += match.anty
    house.save()
  }
}

function concludeMatch(match) {
  
}
