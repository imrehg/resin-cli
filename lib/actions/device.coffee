_ = require('lodash-contrib')
async = require('async')
resin = require('resin-sdk')
ui = require('../ui')
log = require('../log/log')
errors = require('../errors/errors')
permissions = require('../permissions/permissions')

exports.list = permissions.user (params, options) ->
	resin.models.device.getAllByApplication options.application, errors.handleCallback (devices) ->
		log.out ui.widgets.table.horizontal devices, [
			'ID'
			'Name'
			'Device Display Name'
			'Is Online'
			'Application Name'
			'Status'
			'Last Seen'
		]

exports.info = permissions.user (params) ->
	resin.models.device.get params.id, errors.handleCallback (device) ->
		log.out ui.widgets.table.vertical device, [
			'ID'
			'Name'
			'Device Display Name'
			'Is Online'
			'IP Address'
			'Application Name'
			'Status'
			'Last Seen'
			'UUID'
			'Commit'
			'Supervisor Version'
			'Is Web Accessible'
			'Note'
		]

exports.remove = permissions.user (params, options) ->
	ui.patterns.remove 'device', options.yes, (callback) ->
		resin.models.device.remove(params.id, callback)
	, errors.handle

exports.identify = permissions.user (params) ->
	resin.models.device.identify(params.uuid, _.unary(errors.handle))

exports.rename = permissions.user (params) ->
	async.waterfall [

		(callback) ->
			if not _.isEmpty(params.name)
				return callback(null, params.name)
			ui.widgets.ask('How do you want to name this device?', callback)

		(name, callback) ->
			resin.models.device.rename(params.id, name, callback)

	], (error) ->
		errors.handle(error) if error?

exports.supported = permissions.user ->
	devices = resin.models.device.getSupportedDeviceTypes()
	_.each(devices, _.unary(log.out))
