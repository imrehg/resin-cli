_ = require('lodash')
_.str = require('underscore.string')
async = require('async')
fs = require('fs')
resin = require('resin-sdk')
helpers = require('../helpers/helpers')
ui = require('../ui')
log = require('../log/log')
permissions = require('../permissions/permissions')
errors = require('../errors/errors')

exports.list = permissions.user ->
	resin.models.key.getAll errors.handleCallback (keys) ->
		log.out ui.widgets.table.horizontal keys, [ 'ID', 'Title' ]

exports.info = permissions.user (params) ->
	resin.models.key.get params.id, errors.handleCallback (key) ->
		key.public_key = '\n' + _.str.chop(key.public_key, resin.settings.get('sshKeyWidth')).join('\n')
		log.out(ui.widgets.table.vertical(key, [ 'ID', 'Title', 'Public Key' ]))

exports.remove = permissions.user (params, options) ->
	ui.patterns.remove 'key', options.yes, (callback) ->
		resin.models.key.remove(params.id, callback)
	, errors.handle

exports.add = permissions.user (params) ->
	async.waterfall [

		(callback) ->
			if params.path?
				fs.readFile(params.path, encoding: 'utf8', callback)
			else
				helpers.readStdin(callback)

		(key, callback) ->
			key = key.trim()
			resin.models.key.create(params.name, key, callback)

	], errors.handle
