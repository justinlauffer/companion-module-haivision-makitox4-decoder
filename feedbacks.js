const { combineRgb } = require('@companion-module/base')

module.exports = async function (self) {
	// Use decoder choices for device selection
	const getDeviceChoices = () => {
		return self.decoderChoices && self.decoderChoices.length > 0
			? self.decoderChoices
			: [
				{ id: '0', label: 'Decoder 1' },
				{ id: '1', label: 'Decoder 2' },
				{ id: '2', label: 'Decoder 3' },
				{ id: '3', label: 'Decoder 4' },
			]
	}

	const deviceNumberOption = {
		type: 'dropdown',
		label: 'Decoder',
		id: 'deviceNumber',
		default: '0',
		choices: getDeviceChoices(),
	}

	self.setFeedbackDefinitions({
		decoder_status: {
			type: 'boolean',
			name: 'Decoder Status',
			description: 'Change button color based on decoder status',
			defaultStyle: {
				bgcolor: combineRgb(0, 255, 0),
				color: combineRgb(0, 0, 0),
			},
			options: [
				deviceNumberOption,
				{
					type: 'dropdown',
					label: 'Status',
					id: 'status',
					default: '2',
					choices: [
						{ id: '0', label: 'Stopped' },
						{ id: '1', label: 'Started (No Signal)' },
						{ id: '2', label: 'Active (Receiving)' },
						{ id: '-1', label: 'Error' },
					],
				},
			],
			callback: (feedback) => {
				const deviceNum = feedback.options.deviceNumber
				if (self.decodersStatus && self.decodersStatus[deviceNum]) {
					const stats = self.decodersStatus[deviceNum].stats || self.decodersStatus[deviceNum]
					return stats.state == feedback.options.status
				}
				return false
			},
		},
		decoder_state_color: {
			type: 'advanced',
			name: 'Decoder State Color',
			description: 'Change button color based on decoder state',
			options: [
				deviceNumberOption,
			],
			callback: (feedback) => {
				const deviceNum = feedback.options.deviceNumber
				if (self.decodersStatus && self.decodersStatus[deviceNum]) {
					const stats = self.decodersStatus[deviceNum].stats || self.decodersStatus[deviceNum]

					// Return different colors based on state
					switch (stats.state) {
						case 0: // Stopped
							return {
								bgcolor: combineRgb(128, 128, 128),
								color: combineRgb(255, 255, 255),
							}
						case 1: // Started (No Signal)
							return {
								bgcolor: combineRgb(255, 255, 0),
								color: combineRgb(0, 0, 0),
							}
						case 2: // Active
							return {
								bgcolor: combineRgb(0, 255, 0),
								color: combineRgb(0, 0, 0),
							}
						case -1: // Error
							return {
								bgcolor: combineRgb(255, 0, 0),
								color: combineRgb(255, 255, 255),
							}
						default:
							return {}
					}
				}
				return {}
			},
		},
		connection_status: {
			type: 'boolean',
			name: 'Connection Status',
			description: 'Change button color based on connection status',
			defaultStyle: {
				bgcolor: combineRgb(0, 255, 0),
				color: combineRgb(0, 0, 0),
			},
			options: [],
			callback: () => {
				// Check if we have device info which means we're connected
				return self.deviceInfo && self.deviceInfo.cardStatus === 'OK'
			},
		},
		decoder_signal_present: {
			type: 'boolean',
			name: 'Decoder Signal Present',
			description: 'Change button color based on decoder signal presence',
			defaultStyle: {
				bgcolor: combineRgb(0, 255, 0),
				color: combineRgb(0, 0, 0),
			},
			options: [
				deviceNumberOption,
			],
			callback: (feedback) => {
				const deviceNum = feedback.options.deviceNumber
				if (self.decodersStatus && self.decodersStatus[deviceNum]) {
					const stats = self.decodersStatus[deviceNum].stats || self.decodersStatus[deviceNum]
					// State 2 means Active (receiving stream)
					return stats.state === 2
				}
				return false
			},
		},
		decoder_has_error: {
			type: 'boolean',
			name: 'Decoder Has Error',
			description: 'Change button color if decoder has an error',
			defaultStyle: {
				bgcolor: combineRgb(255, 0, 0),
				color: combineRgb(255, 255, 255),
			},
			options: [
				deviceNumberOption,
			],
			callback: (feedback) => {
				const deviceNum = feedback.options.deviceNumber
				if (self.decodersStatus && self.decodersStatus[deviceNum]) {
					const stats = self.decodersStatus[deviceNum].stats || self.decodersStatus[deviceNum]
					// State -1 means error
					return stats.state === -1
				}
				return false
			},
		},
		decoder_thumbnail: {
			type: 'advanced',
			name: 'Decoder Thumbnail',
			description: 'Display decoder thumbnail as button background',
			options: [
				deviceNumberOption,
			],
			callback: (feedback) => {
				const deviceNum = parseInt(feedback.options.deviceNumber)
				self.log('debug', `Decoder thumbnail feedback called for device ${deviceNum}`)
				self.log('debug', `decoderThumbnails exists: ${!!self.decoderThumbnails}`)
				self.log('debug', `decoderThumbnails[${deviceNum}] exists: ${!!(self.decoderThumbnails && self.decoderThumbnails[deviceNum])}`)

				if (self.decoderThumbnails && self.decoderThumbnails[deviceNum]) {
					const thumbnail = self.decoderThumbnails[deviceNum]
					self.log('info', `Returning decoder thumbnail for device ${deviceNum}, size: ${thumbnail.length}`)
					self.log('debug', `First 100 chars of thumbnail: ${thumbnail.substring(0, 100)}`)

					// Return the base64 data URI
					return { png64: thumbnail }
				}
				self.log('debug', `No decoder thumbnail available for device ${deviceNum}`)
				return {}
			},
		},
	})
}