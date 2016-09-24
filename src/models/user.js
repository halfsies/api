/**
 * The contents of this file is free and unencumbered software released into the
 * public domain. For more information, please refer to <http://unlicense.org/>
 *
 * @author Maxmillion McLaughlin <npm@maxmclau.com>
 */

'use strict'

import mongoose from 'mongoose'

let schema = mongoose.Schema({
  name: String,
  rank: Number,
  balance: Number
})

let model = module.exports = mongoose.model('User', schema)

export default model
