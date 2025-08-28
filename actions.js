module.exports = function (self) {
	// Get decoder choices for this decoder module
	const getDecoderChoices = () => {
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
		choices: getDecoderChoices(),
	}

	self.setActionDefinitions({
		decoder_start: {
			name: 'Decoder Start',
			options: [deviceNumberOption],
			callback: async (action) => {
				await self.startDecoder(action.options.deviceNumber)
			},
		},
		decoder_stop: {
			name: 'Decoder Stop',
			options: [deviceNumberOption],
			callback: async (action) => {
				await self.stopDecoder(action.options.deviceNumber)
			},
		},
		decoder_toggle: {
			name: 'Decoder Toggle Start/Stop',
			options: [deviceNumberOption],
			callback: async (action) => {
				const deviceNum = action.options.deviceNumber
				// Check current decoder state
				if (self.decodersStatus && self.decodersStatus[deviceNum]) {
					const stats = self.decodersStatus[deviceNum].stats || self.decodersStatus[deviceNum]
					// State 0 = Stopped, 1 = Started (No Signal), 2 = Active, -1 = Error
					// If decoder is running (state 1 or 2), stop it. Otherwise start it.
					if (stats.state === 1 || stats.state === 2) {
						await self.stopDecoder(deviceNum)
					} else {
						await self.startDecoder(deviceNum)
					}
				} else {
					// If we don't have status, default to starting
					await self.startDecoder(deviceNum)
				}
			},
		},
		decoder_restart: {
			name: 'Decoder Restart',
			options: [deviceNumberOption],
			callback: async (action) => {
				const deviceNum = action.options.deviceNumber
				await self.stopDecoder(deviceNum)
				setTimeout(async () => {
					await self.startDecoder(deviceNum)
				}, 2000)
			},
		},
		select_decoder_source: {
			name: 'Select Decoder Source',
			options: [
				{
					type: 'dropdown',
					label: 'Source Type',
					id: 'sourceType',
					default: 'network',
					choices: [
						{ id: 'network', label: 'Network Stream' },
						{ id: 'srt', label: 'SRT Stream' },
						{ id: 'rtsp', label: 'RTSP Stream' },
					],
				},
				{
					type: 'textinput',
					label: 'Source URL/Address',
					id: 'source',
					default: '',
				},
			],
			callback: async (action) => {
				try {
					const deviceNum = self.config.deviceNumber || '1'
					await self.makeRequest(`/apis/decoders/${deviceNum}/source`, 'PUT', {
						type: action.options.sourceType,
						source: action.options.source
					})
					self.log('info', `Decoder source set to ${action.options.sourceType}: ${action.options.source}`)
				} catch (error) {
					self.log('error', `Failed to set decoder source: ${error.message}`)
				}
			},
		},
		configure_decoder_preview: {
			name: 'Configure Decoder Preview',
			options: [
				deviceNumberOption,
				{
					type: 'number',
					label: 'Interval (minutes)',
					id: 'interval',
					default: 5,
					min: 1,
					max: 60,
				},
				{
					type: 'number',
					label: 'Width (pixels)',
					id: 'width',
					default: 352,
					min: 160,
					max: 1920,
				},
				{
					type: 'number',
					label: 'Height (pixels)',
					id: 'height',
					default: 198,
					min: 90,
					max: 1080,
				},
			],
			callback: async (action) => {
				try {
					const deviceNum = parseInt(action.options.deviceNumber)

					// Get current settings
					const currentSettings = await self.makeRequest('/apis/services/preview')

					// Update the specific decoder settings
					if (currentSettings.decoders && currentSettings.decoders[deviceNum]) {
						currentSettings.decoders[deviceNum] = {
							interval: action.options.interval,
							enabled: true,
							width: action.options.width,
							height: action.options.height
						}

						await self.makeRequest('/apis/services/preview', 'PUT', currentSettings)
						const displayNum = deviceNum + 1
						self.log('info', `Decoder ${displayNum} preview configured: ${action.options.width}x${action.options.height} @ ${action.options.interval}min`)
					}
				} catch (error) {
					self.log('error', `Failed to configure decoder preview: ${error.message}`)
				}
			},
		},
		assign_stream_to_decoder: {
			name: 'Assign Stream to Decoder',
			options: [
				deviceNumberOption,
				{
					type: 'dropdown',
					label: 'Stream',
					id: 'streamId',
					default: '-1',
					choices: self.streamChoices || [{ id: '-1', label: 'No Stream' }],
				},
			],
			callback: async (action) => {
				try {
					const deviceNum = action.options.deviceNumber
					const streamId = parseInt(action.options.streamId)

					// Get current decoder config
					const currentConfig = await self.makeRequest(`/apis/decoders/${deviceNum}`)
					if (!currentConfig || !currentConfig.info) {
						self.log('error', 'Could not get current decoder configuration')
						return
					}

					// Update stream assignment
					const decoderData = {
						...currentConfig.info,
						streamId: streamId
					}

					await self.makeRequest(`/apis/decoders/${deviceNum}`, 'PUT', decoderData)
					const displayNum = parseInt(deviceNum) + 1

					// Get stream name for logging
					const streamName = streamId === -1 ? 'No Stream' :
						(self.streamMap && self.streamMap[streamId]) ? self.streamMap[streamId] : `Stream ${streamId}`
					self.log('info', `${streamName} assigned to Decoder ${displayNum}`)

					// Refresh status
					setTimeout(() => {
						self.getDeviceStatus()
						self.getStreamList()
					}, 1000)
				} catch (error) {
					self.log('error', `Failed to assign stream to decoder: ${error.message}`)
				}
			},
		},
		unassign_stream_from_decoder: {
			name: 'Unassign Stream from Decoder',
			options: [
				deviceNumberOption,
			],
			callback: async (action) => {
				try {
					const deviceNum = action.options.deviceNumber

					// Get current decoder config
					const currentConfig = await self.makeRequest(`/apis/decoders/${deviceNum}`)
					if (!currentConfig || !currentConfig.info) {
						self.log('error', 'Could not get current decoder configuration')
						return
					}

					// Remove stream assignment
					const decoderData = {
						...currentConfig.info,
						streamId: -1
					}

					await self.makeRequest(`/apis/decoders/${deviceNum}`, 'PUT', decoderData)
					const displayNum = parseInt(deviceNum) + 1
					self.log('info', `Stream unassigned from Decoder ${displayNum}`)

					// Refresh status
					setTimeout(() => {
						self.getDeviceStatus()
						self.getStreamList()
					}, 1000)
				} catch (error) {
					self.log('error', `Failed to unassign stream from decoder: ${error.message}`)
				}
			},
		},
		fetch_decoder_thumbnail: {
			name: 'Fetch Decoder Thumbnail (Test)',
			options: [
				deviceNumberOption,
			],
			callback: async (action) => {
				try {
					const deviceNum = parseInt(action.options.deviceNumber)
					self.log('info', `Manually fetching thumbnail for decoder ${deviceNum}`)
					await self.getThumbnail('decoder', deviceNum)

					// Check if thumbnail was stored
					if (self.decoderThumbnails && self.decoderThumbnails[deviceNum]) {
						self.log('info', `Thumbnail successfully fetched and stored for decoder ${deviceNum}`)
						self.log('info', `Thumbnail data starts with: ${self.decoderThumbnails[deviceNum].substring(0, 50)}`)

						// Force feedback update
						self.checkFeedbacks('decoder_thumbnail')
						self.log('info', `Forced feedback update for decoder_thumbnail`)
					} else {
						self.log('warn', `Thumbnail fetch completed but no data stored for decoder ${deviceNum}`)
						self.log('debug', `decoderThumbnails object: ${JSON.stringify(Object.keys(self.decoderThumbnails || {}))}`)
					}
				} catch (error) {
					self.log('error', `Failed to fetch decoder thumbnail: ${error.message}`)
				}
			},
		},
		save_system_preset: {
			name: 'Save System Preset',
			options: [
				{
					type: 'textinput',
					label: 'Preset Name (with .cfg extension)',
					id: 'name',
					default: 'preset1.cfg',
				},
				{
					type: 'checkbox',
					label: 'Set as Startup Preset',
					id: 'startup',
					default: false,
				},
			],
			callback: async (action) => {
				try {
					// Ensure .cfg extension
					let presetName = action.options.name
					if (!presetName.endsWith('.cfg')) {
						presetName += '.cfg'
					}
					await self.makeRequest(`/apis/presets/${presetName}`, 'PUT', {
						startup: action.options.startup
					})
					self.log('info', `System preset saved: ${presetName}`)
				} catch (error) {
					self.log('error', `Failed to save system preset: ${error.message}`)
				}
			},
		},
		load_system_preset: {
			name: 'Load System Preset',
			options: [
				{
					type: 'textinput',
					label: 'Preset Name (with .cfg extension)',
					id: 'name',
					default: 'preset1.cfg',
				},
			],
			callback: async (action) => {
				try {
					// Ensure .cfg extension
					let presetName = action.options.name
					if (!presetName.endsWith('.cfg')) {
						presetName += '.cfg'
					}
					await self.makeRequest(`/apis/presets/${presetName}/load`, 'PUT')
					self.log('info', `System preset loaded: ${presetName}`)
					// Refresh status after loading preset
					setTimeout(() => self.getDeviceStatus(), 2000)
				} catch (error) {
					self.log('error', `Failed to load system preset: ${error.message}`)
				}
			},
		},
		delete_system_preset: {
			name: 'Delete System Preset',
			options: [
				{
					type: 'textinput',
					label: 'Preset Name (with .cfg extension)',
					id: 'name',
					default: 'preset1.cfg',
				},
				{
					type: 'checkbox',
					label: 'Confirm Delete',
					id: 'confirm',
					default: false,
				},
			],
			callback: async (action) => {
				if (!action.options.confirm) {
					self.log('warn', 'Preset deletion not confirmed')
					return
				}
				try {
					// Ensure .cfg extension
					let presetName = action.options.name
					if (!presetName.endsWith('.cfg')) {
						presetName += '.cfg'
					}
					await self.makeRequest(`/apis/presets/${presetName}`, 'DELETE')
					self.log('info', `System preset deleted: ${presetName}`)
				} catch (error) {
					self.log('error', `Failed to delete system preset: ${error.message}`)
				}
			},
		},
		rename_system_preset: {
			name: 'Rename System Preset',
			options: [
				{
					type: 'textinput',
					label: 'Current Name (with .cfg extension)',
					id: 'currentName',
					default: 'preset1.cfg',
				},
				{
					type: 'textinput',
					label: 'New Name (with .cfg extension)',
					id: 'newName',
					default: 'preset2.cfg',
				},
				{
					type: 'checkbox',
					label: 'Overwrite if exists',
					id: 'overwrite',
					default: false,
				},
			],
			callback: async (action) => {
				try {
					// Ensure .cfg extension
					let currentName = action.options.currentName
					if (!currentName.endsWith('.cfg')) {
						currentName += '.cfg'
					}
					let newName = action.options.newName
					if (!newName.endsWith('.cfg')) {
						newName += '.cfg'
					}
					await self.makeRequest(`/apis/presets/${currentName}/rename`, 'PUT', {
						name: newName,
						overwriteIfAlreadyExists: action.options.overwrite
					})
					self.log('info', `System preset renamed from ${currentName} to ${newName}`)
				} catch (error) {
					self.log('error', `Failed to rename system preset: ${error.message}`)
				}
			},
		},
		duplicate_system_preset: {
			name: 'Duplicate System Preset',
			options: [
				{
					type: 'textinput',
					label: 'Preset Name (with .cfg extension)',
					id: 'name',
					default: 'preset1.cfg',
				},
			],
			callback: async (action) => {
				try {
					// Ensure .cfg extension
					let presetName = action.options.name
					if (!presetName.endsWith('.cfg')) {
						presetName += '.cfg'
					}
					await self.makeRequest(`/apis/presets/${presetName}/duplicate`, 'PUT')
					self.log('info', `System preset duplicated: ${presetName}`)
				} catch (error) {
					self.log('error', `Failed to duplicate system preset: ${error.message}`)
				}
			},
		},
		set_startup_preset: {
			name: 'Set Startup Preset',
			options: [
				{
					type: 'textinput',
					label: 'Preset Name (with .cfg extension)',
					id: 'name',
					default: 'preset1.cfg',
				},
			],
			callback: async (action) => {
				try {
					// Ensure .cfg extension
					let presetName = action.options.name
					if (!presetName.endsWith('.cfg')) {
						presetName += '.cfg'
					}
					await self.makeRequest(`/apis/presets/${presetName}/startup`, 'PUT')
					self.log('info', `Startup preset set to: ${presetName}`)
				} catch (error) {
					self.log('error', `Failed to set startup preset: ${error.message}`)
				}
			},
		},
		set_preset_autosave: {
			name: 'Set Preset Autosave',
			options: [
				{
					type: 'checkbox',
					label: 'Enable Autosave',
					id: 'autosave',
					default: true,
				},
			],
			callback: async (action) => {
				try {
					await self.makeRequest('/apis/presets', 'PUT', {
						autosave: action.options.autosave
					})
					self.log('info', `Preset autosave ${action.options.autosave ? 'enabled' : 'disabled'}`)
				} catch (error) {
					self.log('error', `Failed to set preset autosave: ${error.message}`)
				}
			},
		},
		enable_preview_service: {
			name: 'Enable Preview Service',
			options: [
				{
					type: 'checkbox',
					label: 'Enable Preview',
					id: 'enabled',
					default: true,
				},
			],
			callback: async (action) => {
				try {
					// Get current settings first
					const currentSettings = await self.makeRequest('/apis/services/preview')

					// Update only the enabled flag
					const updatedSettings = {
						...currentSettings,
						enabled: action.options.enabled
					}

					await self.makeRequest('/apis/services/preview', 'PUT', updatedSettings)
					self.log('info', `Preview service ${action.options.enabled ? 'enabled' : 'disabled'}`)
				} catch (error) {
					self.log('error', `Failed to set preview service: ${error.message}`)
				}
			},
		},
		create_stream: {
			name: 'Create Stream',
			options: [
				{
					type: 'textinput',
					label: 'Stream Name',
					id: 'name',
					default: 'New Stream',
				},
				{
					type: 'dropdown',
					label: 'Encapsulation',
					id: 'encapsulation',
					default: '2',
					choices: [
						{ id: '2', label: 'TS over UDP' },
						{ id: '3', label: 'TS over RTP' },
						{ id: '34', label: 'TS over SRT' },
						{ id: '64', label: 'RTSP' },
					],
				},
				{
					type: 'textinput',
					label: 'Address (IP/hostname or "Any")',
					id: 'address',
					default: 'Any',
				},
				{
					type: 'number',
					label: 'Port',
					id: 'port',
					default: 5004,
					min: 1,
					max: 65535,
				},
				{
					type: 'dropdown',
					label: 'SRT Mode (for SRT only)',
					id: 'srtMode',
					default: '1',
					choices: [
						{ id: '0', label: 'Caller' },
						{ id: '1', label: 'Listener' },
						{ id: '2', label: 'Rendezvous' },
					],
				},
				{
					type: 'number',
					label: 'SRT Latency (ms)',
					id: 'latency',
					default: 120,
					min: 20,
					max: 8000,
				},
			],
			callback: async (action) => {
				try {
					const streamData = {
						name: action.options.name,
						encapsulation: parseInt(action.options.encapsulation),
						address: action.options.address,
						port: action.options.port,
					}

					// Add SRT-specific options if SRT encapsulation
					if (action.options.encapsulation === '34') {
						streamData.srtMode = parseInt(action.options.srtMode)
						streamData.latency = action.options.latency
					}

					await self.makeRequest('/apis/streams', 'POST', streamData)
					self.log('info', `Stream created: ${action.options.name}`)
					// Refresh stream list
					setTimeout(() => self.getStreamList(), 1000)
				} catch (error) {
					self.log('error', `Failed to create stream: ${error.message}`)
				}
			},
		},
		delete_stream: {
			name: 'Delete Stream',
			options: [
				{
					type: 'dropdown',
					label: 'Stream',
					id: 'streamId',
					default: '-1',
					choices: self.streamChoices || [{ id: '-1', label: 'No Stream' }],
				},
				{
					type: 'checkbox',
					label: 'Confirm Delete',
					id: 'confirm',
					default: false,
				},
			],
			callback: async (action) => {
				if (!action.options.confirm) {
					self.log('warn', 'Stream deletion not confirmed')
					return
				}
				if (action.options.streamId === '-1') {
					self.log('warn', 'No stream selected for deletion')
					return
				}
				try {
					const streamName = (self.streamMap && self.streamMap[action.options.streamId]) || `Stream ${action.options.streamId}`
					await self.makeRequest(`/apis/streams/${action.options.streamId}`, 'DELETE')
					self.log('info', `Stream "${streamName}" deleted`)
					// Refresh stream list
					setTimeout(() => self.getStreamList(), 1000)
				} catch (error) {
					self.log('error', `Failed to delete stream: ${error.message}`)
				}
			},
		},
		edit_stream: {
			name: 'Edit Stream',
			options: [
				{
					type: 'dropdown',
					label: 'Stream to Edit',
					id: 'streamId',
					default: '-1',
					choices: self.streamChoices || [{ id: '-1', label: 'No Stream' }],
				},
				{
					type: 'textinput',
					label: 'New Stream Name (leave empty to keep current)',
					id: 'name',
					default: '',
				},
				{
					type: 'textinput',
					label: 'New Address (leave empty to keep current)',
					id: 'address',
					default: '',
				},
				{
					type: 'textinput',
					label: 'New Port (leave empty to keep current)',
					id: 'port',
					default: '',
				},
			],
			callback: async (action) => {
				if (action.options.streamId === '-1') {
					self.log('warn', 'No stream selected for editing')
					return
				}
				try {
					// Get current stream config first
					const currentStream = await self.makeRequest(`/apis/streams/${action.options.streamId}`)
					if (!currentStream || !currentStream.data) {
						self.log('error', 'Could not get current stream configuration')
						return
					}

					const streamData = {
						...currentStream.data.info,
					}

					// Update only provided fields
					if (action.options.name) streamData.name = action.options.name
					if (action.options.address) streamData.address = action.options.address
					if (action.options.port) streamData.port = parseInt(action.options.port)

					const streamName = (self.streamMap && self.streamMap[action.options.streamId]) || `Stream ${action.options.streamId}`
					await self.makeRequest(`/apis/streams/${action.options.streamId}`, 'PUT', streamData)
					self.log('info', `Stream "${streamName}" updated`)
					// Refresh stream list
					setTimeout(() => self.getStreamList(), 1000)
				} catch (error) {
					self.log('error', `Failed to edit stream: ${error.message}`)
				}
			},
		},
		reboot_device: {
			name: 'Reboot Device',
			options: [
				{
					type: 'checkbox',
					label: 'Confirm Reboot',
					id: 'confirm',
					default: false,
				},
			],
			callback: async (action) => {
				if (action.options.confirm) {
					try {
						const response = await self.makeRequest('/apis/reboot', 'POST')
						if (response && response.upgrade === 1) {
							self.log('info', 'Device reboot initiated (upgrade pending - extended reboot time expected)')
							self.updateStatus('warning', 'Device rebooting with upgrade...')
						} else {
							self.log('info', 'Device reboot initiated')
							self.updateStatus('warning', 'Device rebooting...')
						}
					} catch (error) {
						self.log('error', `Failed to reboot device: ${error.message}`)
					}
				} else {
					self.log('warn', 'Reboot not confirmed')
				}
			},
		},
		custom_api_call: {
			name: 'Custom API Call',
			options: [
				{
					type: 'textinput',
					label: 'API Endpoint',
					id: 'endpoint',
					default: '',
				},
				{
					type: 'dropdown',
					label: 'Method',
					id: 'method',
					default: 'GET',
					choices: [
						{ id: 'GET', label: 'GET' },
						{ id: 'POST', label: 'POST' },
						{ id: 'PUT', label: 'PUT' },
						{ id: 'DELETE', label: 'DELETE' },
					],
				},
				{
					type: 'textinput',
					label: 'Body (JSON)',
					id: 'body',
					default: '{}',
				},
			],
			callback: async (action) => {
				try {
					let body = null
					if (action.options.method !== 'GET' && action.options.body) {
						body = JSON.parse(action.options.body)
					}
					const result = await self.makeRequest(action.options.endpoint, action.options.method, body)
					self.log('info', `Custom API call successful: ${JSON.stringify(result)}`)
				} catch (error) {
					self.log('error', `Custom API call failed: ${error.message}`)
				}
			},
		},
	})
}