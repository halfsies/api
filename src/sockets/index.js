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
import matchmaker from 'matchmaker'

import models from './../models'

let log = debug('api-halfsies-co')

let User = mongoose.model('User')
//let user = new User({name: 'bigpapi', rank: 0, balance: 5000})
//user.save()

export default (app) => {
  let io = socketio.listen(app)

  io.on('connection', (socket) => {
    log('new socket connection')

    socket.on('loginUser', (nickname) => {
      socket.nickname = nickname
      log(`login from ${socket.nickname}`)
      socket.emit('didLogin', nickname)
    })

    socket.on('findMatch', () => {
      log(`searching for ${socket.nickname}`)
    })


    /*socket.on('login', (data) => {
      let userModel = mongoose.model('User')
      userModel.getUserByUsername(data.username, (err, obj) => {
        assert.equal(err, null)

        if(obj) { // User found in database
          log(object)
        } else { // New user
          log(`creating user ${data.username}`)
          user = new userModel({name: data.username, rank: 0, balance: 5000})

          user.save(function (err, userObj) {
            if (err) {
              console.log(err);
            } else {
              console.log('saved successfully:', userObj);
            }
          })
        }
      })
      log(data.username)
    })*/
    socket.on('disconnect', () => log('user disconnected'))
  })

  return io
}
