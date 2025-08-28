const { InstanceBase, Regex, runEntrypoint, InstanceStatus } = require('@companion-module/base')
const UpgradeScripts = require('./upgrades')
const UpdateActions = require('./actions')
const UpdateFeedbacks = require('./feedbacks')
const UpdateVariableDefinitions = require('./variables')
const UpdatePresets = require('./presets')
const http = require('http')
const https = require('https')
const Jimp = require('jimp')

class MakitoX4DecoderInstance extends InstanceBase {
	constructor(internal) {
		super(internal)

		// Initialize thumbnail storage
		this.decoderThumbnails = {}

		// Initialize device choices for dropdowns
		this.decoderChoices = []
	}

	async init(config) {
		this.config = config

		this.updateStatus(InstanceStatus.Connecting)

		this.updateActions()
		this.updateFeedbacks()
		this.updateVariableDefinitions()
		this.updatePresets()

		this.initConnection()
	}

	async destroy() {
		this.log('debug', 'destroy')

		if (this.pollTimer) {
			clearInterval(this.pollTimer)
			delete this.pollTimer
		}
	}

	async configUpdated(config) {
		this.config = config

		this.updateStatus(InstanceStatus.Connecting)
		this.initConnection()
	}

	getConfigFields() {
		return [
			{
				type: 'static-text',
				id: 'info',
				width: 12,
				label: 'Information',
				value: 'This module will control Haivision Makito X4 Decoder devices via their REST API.',
			},
			{
				type: 'textinput',
				id: 'host',
				label: 'Device IP',
				width: 8,
				regex: Regex.IP,
			},
			{
				type: 'textinput',
				id: 'port',
				label: 'Port',
				width: 4,
				default: '443',
				regex: Regex.PORT,
			},
			{
				type: 'textinput',
				id: 'username',
				label: 'Username',
				width: 6,
				default: 'admin',
			},
			{
				type: 'textinput',
				id: 'password',
				label: 'Password',
				width: 6,
				default: '',
			},
			{
				type: 'checkbox',
				id: 'polling',
				label: 'Enable Polling',
				width: 6,
				default: true,
			},
			{
				type: 'number',
				id: 'pollInterval',
				label: 'Poll Interval (seconds)',
				width: 6,
				min: 1,
				max: 60,
				default: 5,
				isVisible: (configValues) => configValues.polling === true,
			},
		]
	}

	updateActions() {
		UpdateActions(this)
	}

	updateFeedbacks() {
		UpdateFeedbacks(this)
	}

	updateVariableDefinitions() {
		UpdateVariableDefinitions(this)
	}

	updatePresets() {
		UpdatePresets(this)
	}

	async initConnection() {
		if (!this.config.host) {
			this.updateStatus(InstanceStatus.BadConfig, 'No host configured')
			return
		}

		this.useHttps = this.config.port === '443'
		this.baseURL = `${this.useHttps ? 'https' : 'http'}://${this.config.host}:${this.config.port}`
		this.authenticated = false
		this.cookies = {}

		// Authenticate first if credentials are provided
		if (this.config.username && this.config.password) {
			const authSuccess = await this.authenticate()
			if (!authSuccess) {
				this.updateStatus(InstanceStatus.ConnectionFailure, 'Authentication failed')
				return
			}
		}

		// Now get device info
		await this.getDeviceInfo()

		// Build device choices for dropdowns
		await this.buildDeviceChoices()

		// Get initial stream list for dropdown population
		await this.getStreamList()

		// Get initial preset list
		await this.getPresetList()

		// Get initial preview settings
		await this.getPreviewSettings()

		if (this.config.polling) {
			this.startPolling()
		}
	}

	async authenticate() {
		try {
			// Cookie-based authentication via /apis/authentication
			this.log('debug', 'Attempting authentication via /apis/authentication')

			const authResponse = await this.makeRequest('/apis/authentication', 'POST', {
				username: this.config.username,
				password: this.config.password
			}, true) // skipAuth flag to avoid auth loop

			// The SessionID cookie should be automatically captured by makeRequest
			if (this.cookies['SessionID']) {
				this.log('info', 'Authentication successful - SessionID cookie received')
				this.authenticated = true
				return true
			} else {
				this.log('warn', 'Authentication response received but no SessionID cookie')
				return false
			}
		} catch (error) {
			this.log('error', `Authentication failed: ${error.message}`)
			return false
		}
	}

	startPolling() {
		if (this.pollTimer) {
			clearInterval(this.pollTimer)
		}

		this.pollTimer = setInterval(() => {
			this.getDeviceStatus()
		}, this.config.pollInterval * 1000)
	}

	async makeRequestBinary(endpoint) {
		return new Promise((resolve, reject) => {
			const client = this.useHttps ? https : http

			// Ensure endpoint starts with / and add /apis if not present
			let apiPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
			if (!apiPath.startsWith('/apis/') && !apiPath.startsWith('/apis')) {
				apiPath = `/apis${apiPath}`
			}

			const options = {
				hostname: this.config.host,
				port: this.config.port,
				path: apiPath,
				method: 'GET',
				headers: {
					'Accept': 'image/jpeg, image/png, */*',
					'User-Agent': 'Companion/3.0'
				},
				rejectUnauthorized: false, // Allow self-signed certificates
				timeout: 5000
			}

			// Cookie-based authentication - always send cookies if we have them
			if (this.cookies && Object.keys(this.cookies).length > 0) {
				options.headers['Cookie'] = Object.entries(this.cookies)
					.map(([key, value]) => `${key}=${value}`)
					.join('; ')
				this.log('debug', `Binary request with cookies to ${apiPath}`)
			}

			this.log('debug', `Making binary request to: ${options.hostname}:${options.port}${apiPath}`)

			const req = client.request(options, (res) => {
				const chunks = []

				this.log('debug', `Binary response status: ${res.statusCode}, headers: ${JSON.stringify(res.headers)}`)

				res.on('data', (chunk) => {
					chunks.push(chunk)
				})

				res.on('end', () => {
					if (res.statusCode === 200) {
						const buffer = Buffer.concat(chunks)
						this.log('debug', `Binary data received: ${buffer.length} bytes`)
						resolve(buffer)
					} else {
						this.log('error', `Binary request failed: HTTP ${res.statusCode}: ${res.statusMessage}`)
						reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`))
					}
				})
			})

			req.on('error', (error) => {
				this.log('error', `Binary request error: ${error.message}`)
				reject(error)
			})

			req.on('timeout', () => {
				req.destroy()
				this.log('error', 'Binary request timeout')
				reject(new Error('Request timeout'))
			})

			req.end()
		})
	}

	async makeRequest(endpoint, method = 'GET', body = null, skipAuth = false) {
		return new Promise((resolve, reject) => {
			const client = this.useHttps ? https : http

			// Ensure endpoint starts with / and add /apis if not present
			let apiPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
			if (!apiPath.startsWith('/apis/') && !apiPath.startsWith('/apis')) {
				apiPath = `/apis${apiPath}`
			}

			const options = {
				hostname: this.config.host,
				port: this.config.port,
				path: apiPath,
				method: method,
				headers: {
					'Accept': 'application/json, text/plain, */*',
					'Content-Type': 'application/json',
					'User-Agent': 'Companion/3.0'
				},
				rejectUnauthorized: false, // Allow self-signed certificates
				timeout: 5000
			}

			// Cookie-based authentication - always send cookies if we have them
			if (this.cookies && Object.keys(this.cookies).length > 0) {
				options.headers['Cookie'] = Object.entries(this.cookies)
					.map(([key, value]) => `${key}=${value}`)
					.join('; ')
				this.log('debug', `Sending cookies: ${options.headers['Cookie']}`)
			}

			let postData = null
			if (body && method !== 'GET') {
				postData = JSON.stringify(body)
				options.headers['Content-Length'] = Buffer.byteLength(postData)
			}

			this.log('debug', `Making ${method} request to ${this.baseURL}${apiPath}`)

			const req = client.request(options, (res) => {
				let data = ''

				// Capture cookies from response
				if (res.headers['set-cookie']) {
					res.headers['set-cookie'].forEach(cookie => {
						const parts = cookie.split(';')[0].split('=')
						if (parts.length === 2) {
							this.cookies[parts[0]] = parts[1]
						}
					})
				}

				res.on('data', (chunk) => {
					data += chunk
				})

				res.on('end', () => {
					if (res.statusCode >= 200 && res.statusCode < 300) {
						try {
							const jsonData = data ? JSON.parse(data) : {}
							resolve(jsonData)
						} catch (e) {
							this.log('debug', `Response body: ${data}`)
							resolve({ raw: data })
						}
					} else if (res.statusCode === 401) {
						this.log('error', `Authentication failed (HTTP 401). Session may have expired.`)
						// Clear cookies on auth failure
						this.cookies = {}
						this.authenticated = false
						reject(new Error(`HTTP 401: Authentication required`))
					} else {
						this.log('error', `HTTP ${res.statusCode}: ${data}`)
						reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`))
					}
				})
			})

			req.on('error', (error) => {
				this.log('error', `Request error: ${error.message}`)
				reject(error)
			})

			req.on('timeout', () => {
				req.destroy()
				reject(new Error('Request timeout'))
			})

			if (postData) {
				req.write(postData)
			}

			req.end()
		})
	}

	async getDeviceInfo() {
		try {
			this.log('debug', 'Getting device status from /apis/status')
			const status = await this.makeRequest('/apis/status')

			if (status) {
				this.deviceInfo = status

				// Parse the /apis/status response correctly
				this.setVariableValues({
					// Device identification
					device_type: status.cardType || 'Unknown',
					device_serial: status.serialNumber || 'Unknown',
					device_part_number: status.partNumber || 'Unknown',

					// Firmware/version info
					device_version: status.firmwareVersion || 'Unknown',
					device_firmware_date: status.firmwareDate || 'Unknown',
					device_firmware_options: status.firmwareOptions || 'None',
					device_boot_version: status.bootVersion || 'Unknown',

					// Hardware info
					device_hw_compatibility: status.hardwareCompatibility || 'Unknown',
					device_hw_revision: status.hardwareRevision || 'Unknown',
					device_cpld_revision: status.cpldRevision || 'Unknown',

					// Status info
					device_status: status.cardStatus || 'Unknown',
					device_uptime: status.uptime || '0 days 00:00:00',
					device_uptime_seconds: status.uptimeSec || 0,
					device_httpd_uptime: status.httpdUptime || '0',
					device_temperature: status.temperature ? `${status.temperature}°C` : 'Unknown',

					// Connection status
					connection_status: status.cardStatus === 'OK' ? 'Connected' : 'Error',

					// Keep IP from config
					device_ip: this.config.host || 'Not configured',
				})

				this.updateStatus(InstanceStatus.Ok)
				this.log('info', `Connected to ${status.cardType || 'Makito X4 Decoder'} (S/N: ${status.serialNumber || 'Unknown'})`)
			}
		} catch (error) {
			this.updateStatus(InstanceStatus.ConnectionFailure, error.message)
			this.setVariableValues({
				connection_status: 'Disconnected',
			})
			this.log('error', `Failed to connect: ${error.message}. Check IP, port, and credentials.`)
		}
	}

	async getDeviceStatus() {
		try {
			// Get system status first
			const statusData = await this.makeRequest('/apis/status')

			if (statusData) {
				// Update system status variables
				this.deviceInfo = statusData
				this.setVariableValues({
					device_status: statusData.cardStatus || 'Unknown',
					device_uptime: statusData.uptime || '0 days 00:00:00',
					device_uptime_seconds: statusData.uptimeSec || 0,
					device_httpd_uptime: statusData.httpdUptime || '0',
					device_temperature: statusData.temperature ? `${statusData.temperature}°C` : 'Unknown',
					connection_status: statusData.cardStatus === 'OK' ? 'Connected' : 'Error',
				})

				// Get stats and config for all 4 decoders (0-3)
				for (let i = 0; i < 4; i++) {
					try {
						// Get decoder stats
						const decoderStats = await this.makeRequest(`/apis/decoders/${i}/stats`)
						if (!this.decodersStatus) this.decodersStatus = {}
						this.decodersStatus[i] = decoderStats
						this.processDecoderStatus(decoderStats, i)
						this.log('debug', `Got decoder ${i} stats`)

						// Get decoder configuration
						const decoderConfig = await this.makeRequest(`/apis/decoders/${i}`)
						if (!this.decodersConfig) this.decodersConfig = {}
						this.decodersConfig[i] = decoderConfig
						this.processDecoderConfig(decoderConfig, i)
						this.log('debug', `Got decoder ${i} config`)

						// Fetch thumbnails periodically (every 3rd poll for testing, normally 10th)
						if (this.presetListCounter && this.presetListCounter % 3 === 0) {
							// Only fetch thumbnail if decoder is active
							const stats = decoderStats?.stats || decoderStats
							this.log('debug', `Decoder ${i} thumbnail check - Counter: ${this.presetListCounter}, State: ${stats?.state}`)
							if (stats && stats.state === 2) {
								this.log('info', `Decoder ${i} is active (state 2), fetching thumbnail`)
								this.getThumbnail('decoder', i)
							} else if (stats && (stats.state === 1 || stats.state === 0)) {
								// For testing, also try to fetch thumbnail even if decoder is stopped/no signal
								this.log('info', `Decoder ${i} state ${stats.state}, attempting thumbnail fetch for testing`)
								this.getThumbnail('decoder', i)
							} else {
								this.log('debug', `Decoder ${i} not active (state ${stats?.state}), skipping thumbnail`)
							}
						}
					} catch (error) {
						this.log('debug', `Decoder ${i} failed: ${error.message}`)
					}
				}
			}

			// Get preset list periodically (less frequently)
			if (!this.presetListCounter) {
				this.presetListCounter = 0
				this.log('debug', 'Initialized presetListCounter to 0')
			}
			this.presetListCounter++
			this.log('debug', `Poll counter: ${this.presetListCounter}`)

			if (this.presetListCounter % 5 === 0) { // Every 5th poll
				this.getPresetList()
			}

			// Get stream list periodically
			if (this.presetListCounter % 3 === 0) { // Every 3rd poll
				this.getStreamList()
			}

			// Get preview settings for decoders (less frequently)
			if (this.presetListCounter % 10 === 0) { // Every 10th poll
				this.getPreviewSettings()
			}

			// Rebuild device choices periodically to catch name changes
			if (this.presetListCounter % 20 === 0) { // Every 20th poll
				this.buildDeviceChoices()
			}

			this.checkFeedbacks()
		} catch (error) {
			this.log('debug', `Status poll failed: ${error.message}`)
		}
	}

	processDecoderStatus(response, deviceNum) {
		// /apis/decoders/:id/stats returns { stats: {...} }
		const stats = response.stats || response

		// Map decoder state numbers to readable strings
		let stateText = 'Unknown'
		if (stats.state !== undefined) {
			switch (stats.state) {
				case 0:
					stateText = 'Stopped'
					break
				case 1:
					stateText = 'Started (No Signal)'
					break
				case 2:
					stateText = 'Active'
					break
				case -1:
					// Map trouble codes to readable text
					let troubleText = 'Not Decoding'
					if (stats.troubleCode) {
						switch (stats.troubleCode) {
							case -1:
								troubleText = 'Unsupported Stream'
								break
							case -2:
								troubleText = 'Unlicensed'
								break
							case -3:
								troubleText = 'Oversubscribed'
								break
							case -4:
								troubleText = 'No Memory'
								break
							default:
								troubleText = `Error (${stats.troubleCode})`
						}
					}
					stateText = troubleText
					break
				default:
					stateText = `Unknown (${stats.state})`
			}
		}

		// Map stream state to readable string
		let streamStateText = 'Unknown'
		if (stats.streamState !== undefined) {
			switch (stats.streamState) {
				case 0: streamStateText = 'Unknown'; break
				case 1: streamStateText = 'Stopped'; break
				case 2: streamStateText = 'Listening'; break
				case 3: streamStateText = 'Active'; break
				case 4: streamStateText = 'Resolving'; break
				case 5: streamStateText = 'Connecting'; break
				case 6: streamStateText = 'Scrambled'; break
				case 7: streamStateText = 'Securing'; break
				case -1: streamStateText = 'Invalid'; break
				case -2: streamStateText = 'Failed'; break
				case -3: streamStateText = 'Unlicensed'; break
				default: streamStateText = `Code ${stats.streamState}`
			}
		}

		// Map multisync status
		let multisyncStatusText = 'Unknown'
		if (stats.multisyncStatusCode !== undefined) {
			switch (stats.multisyncStatusCode) {
				case 0: multisyncStatusText = 'Unset'; break
				case 1: multisyncStatusText = 'Working'; break
				case 2: multisyncStatusText = 'NTP Not Set'; break
				case 3: multisyncStatusText = 'Timecode Not Present'; break
				case 4: multisyncStatusText = 'Timecode Invalid'; break
				case 5: multisyncStatusText = 'Outside Range'; break
				default: multisyncStatusText = stats.multisyncStatus || 'Unknown'
			}
		}

		// Extract first audio pair if available
		const firstAudioPair = stats.audioPairs && stats.audioPairs[0] ? stats.audioPairs[0] : {}

		// Set ALL variables from the API documentation
		const varPrefix = `decoder${deviceNum}_`
		const variables = {}

		// Basic decoder info
		variables[`${varPrefix}id`] = stats.id !== undefined ? stats.id : deviceNum
		variables[`${varPrefix}state`] = stateText
		variables[`${varPrefix}state_code`] = stats.state !== undefined ? stats.state : -999
		variables[`${varPrefix}trouble_code`] = stats.troubleCode || 0
		variables[`${varPrefix}uptime`] = stats.uptime || '00:00:00'

		// Stream info
		variables[`${varPrefix}stream_state`] = streamStateText
		variables[`${varPrefix}stream_state_code`] = stats.streamState !== undefined ? stats.streamState : -999
		variables[`${varPrefix}stream_id`] = stats.streamId !== undefined ? stats.streamId : 'N/A'
		variables[`${varPrefix}stream_has_srt_to_udp`] = stats.streamHasSrtToUdp ? 'Yes' : 'No'
		variables[`${varPrefix}decoder_started`] = stats.decoderHasBeenStarted ? 'Yes' : 'No'

		// Video input info
		variables[`${varPrefix}preprocessor_state`] = stats.preprocessorState || 'Unknown'
		variables[`${varPrefix}vframer_packets`] = stats.vframerNumInputPackets || 0
		variables[`${varPrefix}video_input_resolution`] = stats.videoInputResolution || 'Unknown'
		variables[`${varPrefix}video_input_framerate`] = stats.videoInputFrameRate || '0'
		variables[`${varPrefix}video_algorithm`] = stats.videoAlgorithm || 'Unknown'
		variables[`${varPrefix}video_profile`] = stats.videoProfile || 'Unknown'
		variables[`${varPrefix}video_level`] = stats.videoLevel || 'Unknown'
		variables[`${varPrefix}video_framing`] = stats.videoFraming || 'Unknown'
		variables[`${varPrefix}video_slices`] = stats.videoSlicesPerFrame || '0'

		// Video timing/sync
		variables[`${varPrefix}video_latency`] = stats.videoLatency || '0'
		variables[`${varPrefix}stc_to_pcr_lead`] = stats.stcToPcrLeadTime || '0'
		variables[`${varPrefix}video_stc_lead`] = stats.videoStcLeadTime || '0'
		variables[`${varPrefix}video_stc_details`] = stats.videoStcLeadTimeDetails || 'N/A'

		// Video decoder/output
		variables[`${varPrefix}video_decoder_state`] = stats.videoDecoderState || 'Unknown'
		variables[`${varPrefix}video_output_format`] = stats.videoOutputFormat || 'Unknown'
		variables[`${varPrefix}video_display_format`] = stats.videoDisplayFormat || 'Unknown'
		variables[`${varPrefix}video_display_resolution`] = stats.videoDisplayResolution || 'Unknown'
		variables[`${varPrefix}video_framerate`] = stats.videoFrameRate || '0'
		variables[`${varPrefix}load_percentage`] = stats.loadPercentage || 0
		variables[`${varPrefix}still_image`] = stats.stillImage || 'None'

		// Video frame stats
		variables[`${varPrefix}displayed_frames`] = stats.displayedOutputFrames || '0'
		variables[`${varPrefix}skipped_frames`] = stats.skippedOutputFrames || '0'
		variables[`${varPrefix}replayed_frames`] = stats.replayedOutputFrames || '0'
		variables[`${varPrefix}corrupted_frames`] = stats.corruptedFrames || '0'
		variables[`${varPrefix}oversubscribed_frames`] = stats.oversubscribedFrames || '0'

		// Buffering
		variables[`${varPrefix}buffer_mode`] = stats.bufferingMode || 'Unknown'
		variables[`${varPrefix}buffer_state`] = stats.bufferingState || 'Unknown'
		variables[`${varPrefix}buffer_adjustments`] = stats.bufferingAdjustments || '0'

		// Audio general
		variables[`${varPrefix}audio_state`] = stats.audioState || 'Unknown'
		variables[`${varPrefix}audio_pairs_count`] = stats.audioPairsAmount || 0
		variables[`${varPrefix}audio_sample_rate`] = stats.audioSampleRate || '0'
		variables[`${varPrefix}audio_played_frames`] = stats.audioPlayedFrames || '0'
		variables[`${varPrefix}audio_skipped_frames`] = stats.audioSkippedFrames || '0'

		// First audio pair details
		variables[`${varPrefix}audio_avsync`] = firstAudioPair.avSyncMs || 0
		variables[`${varPrefix}audio_bitrate`] = firstAudioPair.bitrateInKbps || 0
		variables[`${varPrefix}audio_compression`] = firstAudioPair.compression || 'Unknown'
		variables[`${varPrefix}audio_db_left`] = firstAudioPair.dbLeft || '-∞'
		variables[`${varPrefix}audio_db_left_max`] = firstAudioPair.dbLeftMax || '-∞'
		variables[`${varPrefix}audio_db_right`] = firstAudioPair.dbRight || '-∞'
		variables[`${varPrefix}audio_db_right_max`] = firstAudioPair.dbRightMax || '-∞'
		variables[`${varPrefix}audio_discontinuities`] = firstAudioPair.discontinuities || 0
		variables[`${varPrefix}audio_input_layout`] = firstAudioPair.inputLayout || 'Unknown'
		variables[`${varPrefix}audio_output_layout`] = firstAudioPair.outputLayout || 'Unknown'
		variables[`${varPrefix}audio_language`] = firstAudioPair.language || 'Unknown'
		variables[`${varPrefix}audio_sample_in`] = firstAudioPair.sampeRateIn || 0
		variables[`${varPrefix}audio_sample_out`] = firstAudioPair.sampeRateOut || 0

		// Delay ranges
		variables[`${varPrefix}delay_min`] = stats.delayRangeMinMs || 0
		variables[`${varPrefix}delay_max`] = stats.delayRangeMaxMs || 0

		// Multisync
		variables[`${varPrefix}multisync_status`] = multisyncStatusText
		variables[`${varPrefix}multisync_delay_actual`] = stats.multisyncDelayActual || 'N/A'
		variables[`${varPrefix}multisync_delay_range`] = stats.multisyncDelayRange || 'N/A'
		variables[`${varPrefix}multisync_delay_set`] = stats.multisyncDelaySet || 'N/A'
		variables[`${varPrefix}multisync_system_time`] = stats.multisyncSystemTime || 'N/A'
		variables[`${varPrefix}multisync_timecode`] = stats.multisyncTimecode || 'N/A'
		variables[`${varPrefix}multisync_time_diff`] = stats.multisyncTimeDiff || 'N/A'
		variables[`${varPrefix}multisync_tc_packets`] = stats.multisyncTimecodePackets || '0'
		variables[`${varPrefix}multisync_transmission`] = stats.multisyncTransmissionTime || 'N/A'

		// Metadata - KLV
		variables[`${varPrefix}has_klv`] = stats.klv ? 'Yes' : 'No'
		variables[`${varPrefix}klv_payload_bytes`] = stats.klvPayloadBytes || '0'
		variables[`${varPrefix}klv_received`] = stats.klvReceivedPackets || '0'
		variables[`${varPrefix}klv_output`] = stats.klvOutputPackets || '0'
		variables[`${varPrefix}klv_latency`] = stats.klvLatency || '0'

		// Metadata - Closed Caption
		variables[`${varPrefix}has_cc`] = stats.closedCaption ? 'Yes' : 'No'
		variables[`${varPrefix}cc_payload_bytes`] = stats.ccPayloadBytes || '0'
		variables[`${varPrefix}cc_received`] = stats.ccReceivedPackets || '0'
		variables[`${varPrefix}cc_output`] = stats.ccOutputPackets || '0'
		variables[`${varPrefix}cc_latency`] = stats.ccLatency || '0'

		// Metadata - Timecode
		variables[`${varPrefix}has_timecode`] = stats.timeCode ? 'Yes' : 'No'
		variables[`${varPrefix}tc_payload_bytes`] = stats.tcPayloadBytes || '0'
		variables[`${varPrefix}tc_received`] = stats.tcReceivedPackets || '0'
		variables[`${varPrefix}tc_output`] = stats.tcOutputPackets || '0'
		variables[`${varPrefix}tc_latency`] = stats.tcLatency || '0'
		variables[`${varPrefix}tc_value`] = stats.tcTimecodeValue || 'N/A'

		// Metadata - AFD
		variables[`${varPrefix}has_afd`] = stats.afd ? 'Yes' : 'No'
		variables[`${varPrefix}afd_payload_bytes`] = stats.afdcPayloadBytes || '0'
		variables[`${varPrefix}afd_received`] = stats.afdReceivedPackets || '0'
		variables[`${varPrefix}afd_output`] = stats.afdOutputPackets || '0'
		variables[`${varPrefix}afd_latency`] = stats.afdLatency || '0'

		// Clock tracking
		variables[`${varPrefix}clock_mode`] = stats.clockTrackingMode || 'Unknown'
		variables[`${varPrefix}clock_status`] = stats.clockStatus || 'Unknown'
		variables[`${varPrefix}clock_resync_count`] = stats.clockReSyncCount || 0
		variables[`${varPrefix}clock_current_stc`] = stats.clockCurrentStc || 'Unknown'
		variables[`${varPrefix}clock_stc_avg`] = stats.clockStcAvg || 'Unknown'

		// HDR info
		variables[`${varPrefix}hdr_type_in`] = stats.hdrTypeIn || 'SDR'
		variables[`${varPrefix}hdr_type`] = stats.hdrType || 'SDR'
		variables[`${varPrefix}hdr_primaries`] = stats.hdrColourPrimaries || 'Unknown'
		variables[`${varPrefix}hdr_transfer`] = stats.hdrTransferCharacteristics || 'Unknown'
		variables[`${varPrefix}hdr_matrix`] = stats.hdrMatrixCoefficients || 'Unknown'

		// Other stats
		variables[`${varPrefix}last_reset`] = stats.lastReset || 'Never'

		// Simplified status for display
		variables[`${varPrefix}signal`] = stats.state === 2 ? 'Good' :
			stats.state === 1 ? 'No Signal' :
				stats.state === -1 ? 'Error' : 'Offline'

		this.setVariableValues(variables)

		this.log('debug', `Decoder ${deviceNum} status updated: state=${stateText}, stream=${streamStateText}`)
	}

	async processDecoderConfig(response, deviceNum) {
		// /apis/decoders/:id returns { info: {...} }
		const config = response.info || response

		if (config) {
			// Fetch stream details if a stream is assigned
			let streamDetails = null
			if (config.streamId !== undefined && config.streamId >= 0) {
				try {
					const streamResponse = await this.makeRequest(`/apis/streams/${config.streamId}`)
					if (streamResponse && streamResponse.data) {
						streamDetails = streamResponse.data
						this.log('debug', `Fetched details for stream ${config.streamId} assigned to decoder ${deviceNum}`)
					}
				} catch (error) {
					this.log('debug', `Failed to fetch stream ${config.streamId} details: ${error.message}`)
				}
			}

			const varPrefix = `decoder${deviceNum}_`
			const variables = {}

			// Configuration variables
			variables[`${varPrefix}name`] = config.name || `Decoder ${deviceNum}`
			variables[`${varPrefix}stream_assigned`] = config.streamId !== undefined && config.streamId >= 0 ? 'Yes' : 'No'
			variables[`${varPrefix}stream_id_config`] = config.streamId !== undefined ? config.streamId : -1

			// Get stream name if we have stream mapping
			if (this.streamMap && config.streamId >= 0 && this.streamMap[config.streamId]) {
				variables[`${varPrefix}stream_name`] = this.streamMap[config.streamId]
			} else {
				variables[`${varPrefix}stream_name`] = 'None'
			}

			// Set stream detail variables if we have stream information
			if (streamDetails) {
				const info = streamDetails.info || {}
				const stats = streamDetails.stats || {}

				// Map encapsulation type to protocol name
				let protocol = 'Unknown'
				switch (info.encapsulation) {
					case 2: protocol = 'TS over UDP'; break
					case 3: protocol = 'TS over RTP'; break
					case 34: protocol = 'TS over SRT'; break
					case 64: protocol = 'RTSP'; break
					default: protocol = `Type ${info.encapsulation}`
				}

				// Parse connection state for SRT
				let connectionState = 'Not Connected'
				if (stats.state === 3) {
					connectionState = 'Active'
				} else if (stats.state === 2) {
					connectionState = 'Connecting'
				} else if (stats.state === 1) {
					connectionState = 'Waiting'
				}

				// Get source address
				let sourceAddress = stats.sourceAddress || 'Unknown'
				if (info.encapsulation === 34 && stats.srt) {
					// For SRT, use the remote address
					sourceAddress = stats.srt.remoteAddress || stats.srt.peerAddress || sourceAddress
				}

				// Check decoder state to determine if we should show bitrate
				// Only show actual bitrate if decoder is started (state 1 or 2)
				let bitrateDisplay = '0 kbps'
				if (this.decodersStatus && this.decodersStatus[deviceNum]) {
					const decoderStats = this.decodersStatus[deviceNum].stats || this.decodersStatus[deviceNum]
					if (decoderStats.state > 0) {
						// Decoder is started (state 1 or 2), show actual bitrate
						bitrateDisplay = stats.bitrate || '0 kbps'
					}
				}

				variables[`${varPrefix}stream_protocol`] = protocol
				variables[`${varPrefix}stream_address`] = info.address || 'N/A'
				variables[`${varPrefix}stream_port`] = info.port || 'N/A'
				variables[`${varPrefix}stream_bitrate`] = bitrateDisplay
				variables[`${varPrefix}stream_source_address`] = sourceAddress
				variables[`${varPrefix}stream_uptime`] = stats.uptime || '0s'
				variables[`${varPrefix}stream_connection_state`] = connectionState
				variables[`${varPrefix}stream_received_packets`] = stats.receivedPackets || '0'
				variables[`${varPrefix}stream_received_bytes`] = stats.receivedBytes || '0'
				variables[`${varPrefix}stream_summary`] = stats.streamSummary || 'No data'
			} else {
				// No stream assigned, set defaults
				variables[`${varPrefix}stream_protocol`] = 'None'
				variables[`${varPrefix}stream_address`] = 'N/A'
				variables[`${varPrefix}stream_port`] = 'N/A'
				variables[`${varPrefix}stream_bitrate`] = '0 kbps'
				variables[`${varPrefix}stream_source_address`] = 'Unknown'
				variables[`${varPrefix}stream_uptime`] = '0s'
				variables[`${varPrefix}stream_connection_state`] = 'Not Connected'
				variables[`${varPrefix}stream_received_packets`] = '0'
				variables[`${varPrefix}stream_received_bytes`] = '0'
				variables[`${varPrefix}stream_summary`] = 'No stream'
			}

			this.setVariableValues(variables)

			this.log('debug', `Decoder ${deviceNum} config updated`)
		}
	}

	async startDecoder(deviceNum = '0') {
		try {
			await this.makeRequest(`/apis/decoders/${deviceNum}/start`, 'PUT')
			this.log('info', `Decoder ${deviceNum} started`)
			setTimeout(() => this.getDeviceStatus(), 1000)
		} catch (error) {
			this.log('error', `Failed to start decoder ${deviceNum}: ${error.message}`)
		}
	}

	async stopDecoder(deviceNum = '0') {
		try {
			await this.makeRequest(`/apis/decoders/${deviceNum}/stop`, 'PUT')
			this.log('info', `Decoder ${deviceNum} stopped`)
			setTimeout(() => this.getDeviceStatus(), 1000)
		} catch (error) {
			this.log('error', `Failed to stop decoder ${deviceNum}: ${error.message}`)
		}
	}

	async buildDeviceChoices() {
		try {
			// Build decoder choices by getting configuration for each decoder
			this.decoderChoices = []
			for (let i = 0; i < 4; i++) {
				try {
					const decoderConfig = await this.makeRequest(`/apis/decoders/${i}`)
					if (decoderConfig && decoderConfig.info) {
						this.decoderChoices.push({
							id: i,
							label: decoderConfig.info.name || `Decoder ${i}`
						})
					} else {
						this.decoderChoices.push({
							id: i,
							label: `Decoder ${i}`
						})
					}
				} catch (error) {
					// If decoder doesn't exist or error, still add it to list
					this.decoderChoices.push({
						id: i,
						label: `Decoder ${i}`
					})
				}
			}

			this.log('debug', `Built decoder choices: ${JSON.stringify(this.decoderChoices)}`)

			// Update actions and feedbacks with new choices
			this.updateActions()
			this.updateFeedbacks()
		} catch (error) {
			this.log('error', `Failed to build device choices: ${error.message}`)
		}
	}

	getDecoderChoices() {
		return this.decoderChoices || [
			{ id: 0, label: 'Decoder 0' },
			{ id: 1, label: 'Decoder 1' },
			{ id: 2, label: 'Decoder 2' },
			{ id: 3, label: 'Decoder 3' }
		]
	}

	async getStreamList() {
		try {
			const streams = await this.makeRequest('/apis/streams')
			if (streams && streams.data) {
				this.streamList = streams.data

				// Create a mapping of stream ID to name for easy lookup
				this.streamMap = {}
				// Build choices array for dropdown
				this.streamChoices = [{ id: '-1', label: 'No Stream' }]

				streams.data.forEach(stream => {
					if (stream.info) {
						const streamName = stream.info.name || `Stream ${stream.info.id}`
						this.streamMap[stream.info.id] = streamName

						// Add to choices array with additional info
						let label = streamName
						if (stream.info.address && stream.info.port) {
							label += ` (${stream.info.address}:${stream.info.port})`
						}
						// Add encapsulation type
						const encapTypes = {
							2: 'UDP',
							3: 'RTP',
							34: 'SRT',
							64: 'RTSP'
						}
						if (encapTypes[stream.info.encapsulation]) {
							label += ` [${encapTypes[stream.info.encapsulation]}]`
						}

						this.streamChoices.push({
							id: String(stream.info.id),
							label: label
						})
					}
				})

				// Update stream count variable
				this.setVariableValues({
					stream_count: streams.data.length
				})

				// Update decoder stream name variables based on assigned streams
				for (let i = 0; i < 4; i++) {
					if (this.decodersConfig && this.decodersConfig[i]) {
						const config = this.decodersConfig[i].info || this.decodersConfig[i]
						const streamId = config.streamId
						if (streamId >= 0 && this.streamMap[streamId]) {
							this.setVariableValues({
								[`decoder${i}_stream_name`]: this.streamMap[streamId]
							})
						} else {
							this.setVariableValues({
								[`decoder${i}_stream_name`]: 'None'
							})
						}
					}
				}

				// Update action definitions with new stream choices
				this.updateActions()

				this.log('debug', `Found ${streams.data.length} streams`)
				return streams.data
			}
			return []
		} catch (error) {
			this.log('debug', `Failed to get stream list: ${error.message}`)
			this.streamList = []
			this.streamChoices = []
			return []
		}
	}

	async getPresetList() {
		try {
			const presets = await this.makeRequest('/apis/presets')
			if (presets && presets.data) {
				this.presetList = presets.data
				this.presetInfo = {
					autosave: presets.autosave,
					active: presets.active,
					activeIsStartup: presets.activeIsStartup,
					activeWasModified: presets.activeWasModified
				}
				// Set variables for preset info
				this.setVariableValues({
					preset_active: presets.active || 'None',
					preset_autosave: presets.autosave ? 'Enabled' : 'Disabled',
					preset_modified: presets.activeWasModified ? 'Yes' : 'No',
					preset_count: presets.data ? presets.data.length : 0,
				})

				// Build preset choices for dropdown
				if (presets.data && Array.isArray(presets.data)) {
					this.presetChoices = presets.data.map(preset => ({
						id: preset,
						label: preset
					}))

					// Update actions with new preset choices
					this.updateActions()
				}

				this.log('debug', `Found ${presets.data.length} presets`)
				return presets.data
			}
			return []
		} catch (error) {
			this.log('debug', `Failed to get preset list: ${error.message}`)
			return []
		}
	}

	async getPreviewSettings() {
		try {
			const preview = await this.makeRequest('/apis/preview')
			if (preview) {
				this.previewSettings = preview

				// Update preview-related variables
				this.setVariableValues({
					preview_service: preview.service ? 'Enabled' : 'Disabled',
					preview_port: preview.port || 8080,
					preview_quality: preview.quality || 'Unknown'
				})

				this.log('debug', `Preview service: ${preview.service ? 'Enabled' : 'Disabled'} on port ${preview.port}`)
			}
		} catch (error) {
			this.log('debug', `Failed to get preview settings: ${error.message}`)
		}
	}

	async getThumbnail(type, index) {
		if (type === 'decoder') {
			try {
				const imageData = await this.makeRequestBinary(`/apis/decoders/${index}/preview`)
				if (imageData) {
					// Process the image with Jimp
					const image = await Jimp.read(imageData)
					const resized = await image.scaleToFit(72, 72).quality(70).getBufferAsync(Jimp.MIME_PNG)

					// Store the resized thumbnail as base64
					this.decoderThumbnails[index] = `data:image/png;base64,${resized.toString('base64')}`

					this.log('debug', `Decoder ${index} thumbnail updated`)
					this.checkFeedbacks(`decoder_thumbnail`)
				}
			} catch (error) {
				this.log('debug', `Failed to get decoder ${index} thumbnail: ${error.message}`)
			}
		}
	}
}

runEntrypoint(MakitoX4DecoderInstance, UpgradeScripts)