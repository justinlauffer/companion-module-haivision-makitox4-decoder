const { combineRgb } = require('@companion-module/base')

module.exports = function (self) {
	const presets = []

	// Decoder control presets
	presets.push({
		type: 'button',
		category: 'Decoder Control',
		name: 'Start Decoder',
		style: {
			text: 'DEC\\nSTART',
			size: '18',
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(0, 100, 0),
		},
		steps: [
			{
				down: [
					{
						actionId: 'decoder_start',
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'decoder_status',
				options: {
					status: 'running',
				},
				style: {
					bgcolor: combineRgb(0, 255, 0),
					color: combineRgb(0, 0, 0),
				},
			},
		],
	})

	presets.push({
		type: 'button',
		category: 'Decoder Control',
		name: 'Stop Decoder',
		style: {
			text: 'DEC\\nSTOP',
			size: '18',
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(100, 0, 0),
		},
		steps: [
			{
				down: [
					{
						actionId: 'decoder_stop',
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'decoder_status',
				options: {
					status: 'stopped',
				},
				style: {
					bgcolor: combineRgb(255, 0, 0),
					color: combineRgb(255, 255, 255),
				},
			},
		],
	})

	presets.push({
		type: 'button',
		category: 'Decoder Control',
		name: 'Toggle Decoder',
		style: {
			text: 'DEC\\nTOGGLE',
			size: '18',
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(50, 50, 50),
		},
		steps: [
			{
				down: [
					{
						actionId: 'decoder_toggle',
						options: {
							deviceNumber: '0',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'decoder_state_color',
				options: {
					deviceNumber: '0',
				},
			},
		],
	})

	presets.push({
		type: 'button',
		category: 'Decoder Control',
		name: 'Restart Decoder',
		style: {
			text: 'DEC\\nRESTART',
			size: '14',
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(100, 100, 0),
		},
		steps: [
			{
				down: [
					{
						actionId: 'decoder_restart',
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	})

	presets.push({
		type: 'button',
		category: 'Decoder Status',
		name: 'Signal Present',
		style: {
			text: 'SIGNAL\\n$(makitox4:decoder_signal)',
			size: '14',
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(50, 50, 50),
		},
		steps: [],
		feedbacks: [
			{
				feedbackId: 'decoder_signal_present',
				style: {
					bgcolor: combineRgb(0, 255, 0),
					color: combineRgb(0, 0, 0),
				},
			},
		],
	})

	// Add decoder thumbnail preset
	for (let i = 0; i < 4; i++) {
		presets.push({
			type: 'button',
			category: 'Decoder Thumbnails',
			name: `Decoder ${i + 1} Thumbnail`,
			style: {
				text: `DEC ${i + 1}\\n$(makitox4:decoder${i + 1}_state)`,
				size: '14',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 0, 0),
				show_topbar: false,
			},
			steps: [
				{
					down: [
						{
							actionId: 'decoder_toggle',
							options: {
								deviceNumber: String(i),
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'decoder_thumbnail',
					options: {
						deviceNumber: String(i),
					},
				},
				{
					feedbackId: 'decoder_state_color',
					options: {
						deviceNumber: String(i),
					},
				},
			],
		})
	}

	// Common system presets
	presets.push({
		type: 'button',
		category: 'System',
		name: 'Connection Status',
		style: {
			text: 'CONN\\n$(makitox4:connection_status)',
			size: '14',
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(50, 50, 50),
		},
		steps: [],
		feedbacks: [
			{
				feedbackId: 'connection_status',
				style: {
					bgcolor: combineRgb(0, 255, 0),
					color: combineRgb(0, 0, 0),
				},
			},
		],
	})

	presets.push({
		type: 'button',
		category: 'System',
		name: 'Device Info',
		style: {
			text: '$(makitox4:device_name)\\n$(makitox4:device_model)',
			size: '7',
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [],
		feedbacks: [],
	})

	presets.push({
		type: 'button',
		category: 'Status',
		name: 'Decoder Status',
		style: {
			text: 'DEC: $(makitox4:decoder_state)\\n$(makitox4:decoder_resolution)@$(makitox4:decoder_framerate)fps',
			size: '7',
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [],
		feedbacks: [
			{
				feedbackId: 'decoder_status',
				options: {
					status: 'running',
				},
				style: {
					bgcolor: combineRgb(0, 100, 0),
				},
			},
			{
				feedbackId: 'decoder_status',
				options: {
					status: 'error',
				},
				style: {
					bgcolor: combineRgb(200, 0, 0),
				},
			},
		],
	})

	presets.push({
		type: 'button',
		category: 'Status',
		name: 'Latency Monitor',
		style: {
			text: 'LATENCY\\n$(makitox4:decoder_latency) ms',
			size: '14',
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [],
		feedbacks: [],
	})

	self.setPresetDefinitions(presets)
}