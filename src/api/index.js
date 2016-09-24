/**
 * The contents of this file is free and unencumbered software released into the
 * public domain. For more information, please refer to <http://unlicense.org/>
 *
 * @author Maxmillion McLaughlin <npm@maxmclau.com>
 */

'use strict'

import { Router } from 'express'
import debug from 'debug'
import matchMaker from 'matchmaker'

export default () => {
	let router = Router()

	router.use((req, res, next) => {
		log(`${req.method} @ api ${req.path}`)
		next()
	})

  router.route('user/:id/match')
    .post

  return router
}
