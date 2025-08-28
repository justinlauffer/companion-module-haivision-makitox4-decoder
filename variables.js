module.exports = async function (self) {
	const variables = []

	// General device variables
	variables.push(
		// Connection
		{
			variableId: 'connection_status',
			name: 'Connection Status',
		},
		{
			variableId: 'device_ip',
			name: 'Device IP Address',
		},

		// System Presets
		{
			variableId: 'preset_active',
			name: 'Active Preset',
		},
		{
			variableId: 'preset_autosave',
			name: 'Preset Autosave',
		},
		{
			variableId: 'preset_modified',
			name: 'Preset Modified',
		},
		{
			variableId: 'preset_count',
			name: 'Preset Count',
		},

		// Preview Service
		{
			variableId: 'preview_enabled',
			name: 'Preview Service Enabled',
		},

		// Stream Management
		{
			variableId: 'stream_count',
			name: 'Total Stream Count',
		},

		// Device identification
		{
			variableId: 'device_type',
			name: 'Device Type',
		},
		{
			variableId: 'device_serial',
			name: 'Serial Number',
		},
		{
			variableId: 'device_part_number',
			name: 'Part Number',
		},

		// Firmware info
		{
			variableId: 'device_version',
			name: 'Firmware Version',
		},
		{
			variableId: 'device_firmware_date',
			name: 'Firmware Date',
		},
		{
			variableId: 'device_firmware_options',
			name: 'Firmware Options',
		},
		{
			variableId: 'device_boot_version',
			name: 'Boot Version',
		},

		// Hardware info
		{
			variableId: 'device_hw_compatibility',
			name: 'Hardware Compatibility',
		},
		{
			variableId: 'device_hw_revision',
			name: 'Hardware Revision',
		},
		{
			variableId: 'device_cpld_revision',
			name: 'CPLD Revision',
		},

		// Status info
		{
			variableId: 'device_status',
			name: 'Card Status',
		},
		{
			variableId: 'device_uptime',
			name: 'System Uptime',
		},
		{
			variableId: 'device_uptime_seconds',
			name: 'Uptime (seconds)',
		},
		{
			variableId: 'device_httpd_uptime',
			name: 'HTTP Server Uptime',
		},
		{
			variableId: 'device_temperature',
			name: 'Temperature',
		}
	)

	// Add variables for all 4 decoders (0-3 to match API indices)
	for (let i = 0; i < 4; i++) {
		variables.push(
			// Basic decoder info
			{
				variableId: `decoder${i}_id`,
				name: `Decoder ${i} ID`,
			},
			{
				variableId: `decoder${i}_state`,
				name: `Decoder ${i} State`,
			},
			{
				variableId: `decoder${i}_state_code`,
				name: `Decoder ${i} State Code`,
			},
			{
				variableId: `decoder${i}_trouble_code`,
				name: `Decoder ${i} Trouble Code`,
			},
			{
				variableId: `decoder${i}_uptime`,
				name: `Decoder ${i} Uptime`,
			},

			// Stream info
			{
				variableId: `decoder${i}_stream_state`,
				name: `Decoder ${i} Stream State`,
			},
			{
				variableId: `decoder${i}_stream_state_code`,
				name: `Decoder ${i} Stream State Code`,
			},
			{
				variableId: `decoder${i}_stream_id`,
				name: `Decoder ${i} Stream ID`,
			},
			{
				variableId: `decoder${i}_stream_has_srt_to_udp`,
				name: `Decoder ${i} Has SRT to UDP`,
			},
			{
				variableId: `decoder${i}_decoder_started`,
				name: `Decoder ${i} Has Been Started`,
			},

			// Video input info
			{
				variableId: `decoder${i}_preprocessor_state`,
				name: `Decoder ${i} Preprocessor State`,
			},
			{
				variableId: `decoder${i}_vframer_packets`,
				name: `Decoder ${i} VFramer Input Packets`,
			},
			{
				variableId: `decoder${i}_video_input_resolution`,
				name: `Decoder ${i} Video Input Resolution`,
			},
			{
				variableId: `decoder${i}_video_input_framerate`,
				name: `Decoder ${i} Video Input Framerate`,
			},
			{
				variableId: `decoder${i}_video_algorithm`,
				name: `Decoder ${i} Video Algorithm`,
			},
			{
				variableId: `decoder${i}_video_profile`,
				name: `Decoder ${i} Video Profile`,
			},
			{
				variableId: `decoder${i}_video_level`,
				name: `Decoder ${i} Video Level`,
			},
			{
				variableId: `decoder${i}_video_framing`,
				name: `Decoder ${i} Video Framing`,
			},
			{
				variableId: `decoder${i}_video_slices`,
				name: `Decoder ${i} Video Slices Per Frame`,
			},

			// Video timing/sync
			{
				variableId: `decoder${i}_video_latency`,
				name: `Decoder ${i} Video Latency`,
			},
			{
				variableId: `decoder${i}_stc_to_pcr_lead`,
				name: `Decoder ${i} STC to PCR Lead Time`,
			},
			{
				variableId: `decoder${i}_video_stc_lead`,
				name: `Decoder ${i} Video STC Lead Time`,
			},
			{
				variableId: `decoder${i}_video_stc_details`,
				name: `Decoder ${i} Video STC Lead Details`,
			},

			// Video decoder/output
			{
				variableId: `decoder${i}_video_decoder_state`,
				name: `Decoder ${i} Video Decoder State`,
			},
			{
				variableId: `decoder${i}_video_output_format`,
				name: `Decoder ${i} Video Output Format`,
			},
			{
				variableId: `decoder${i}_video_display_format`,
				name: `Decoder ${i} Video Display Format`,
			},
			{
				variableId: `decoder${i}_video_display_resolution`,
				name: `Decoder ${i} Video Display Resolution`,
			},
			{
				variableId: `decoder${i}_video_framerate`,
				name: `Decoder ${i} Video Framerate`,
			},
			{
				variableId: `decoder${i}_load_percentage`,
				name: `Decoder ${i} Load Percentage`,
			},
			{
				variableId: `decoder${i}_still_image`,
				name: `Decoder ${i} Still Image`,
			},

			// Video frame stats
			{
				variableId: `decoder${i}_displayed_frames`,
				name: `Decoder ${i} Displayed Frames`,
			},
			{
				variableId: `decoder${i}_skipped_frames`,
				name: `Decoder ${i} Skipped Frames`,
			},
			{
				variableId: `decoder${i}_replayed_frames`,
				name: `Decoder ${i} Replayed Frames`,
			},
			{
				variableId: `decoder${i}_corrupted_frames`,
				name: `Decoder ${i} Corrupted Frames`,
			},
			{
				variableId: `decoder${i}_oversubscribed_frames`,
				name: `Decoder ${i} Oversubscribed Frames`,
			},

			// Buffering
			{
				variableId: `decoder${i}_buffer_mode`,
				name: `Decoder ${i} Buffer Mode`,
			},
			{
				variableId: `decoder${i}_buffer_state`,
				name: `Decoder ${i} Buffer State`,
			},
			{
				variableId: `decoder${i}_buffer_adjustments`,
				name: `Decoder ${i} Buffer Adjustments`,
			},

			// Audio general
			{
				variableId: `decoder${i}_audio_state`,
				name: `Decoder ${i} Audio State`,
			},
			{
				variableId: `decoder${i}_audio_pairs_count`,
				name: `Decoder ${i} Audio Pairs Count`,
			},
			{
				variableId: `decoder${i}_audio_sample_rate`,
				name: `Decoder ${i} Audio Sample Rate`,
			},
			{
				variableId: `decoder${i}_audio_played_frames`,
				name: `Decoder ${i} Audio Played Frames`,
			},
			{
				variableId: `decoder${i}_audio_skipped_frames`,
				name: `Decoder ${i} Audio Skipped Frames`,
			},

			// First audio pair details
			{
				variableId: `decoder${i}_audio_avsync`,
				name: `Decoder ${i} A/V Sync (ms)`,
			},
			{
				variableId: `decoder${i}_audio_bitrate`,
				name: `Decoder ${i} Audio Bitrate`,
			},
			{
				variableId: `decoder${i}_audio_compression`,
				name: `Decoder ${i} Audio Compression`,
			},
			{
				variableId: `decoder${i}_audio_db_left`,
				name: `Decoder ${i} Audio dB Left`,
			},
			{
				variableId: `decoder${i}_audio_db_left_max`,
				name: `Decoder ${i} Audio dB Left Max`,
			},
			{
				variableId: `decoder${i}_audio_db_right`,
				name: `Decoder ${i} Audio dB Right`,
			},
			{
				variableId: `decoder${i}_audio_db_right_max`,
				name: `Decoder ${i} Audio dB Right Max`,
			},
			{
				variableId: `decoder${i}_audio_discontinuities`,
				name: `Decoder ${i} Audio Discontinuities`,
			},
			{
				variableId: `decoder${i}_audio_input_layout`,
				name: `Decoder ${i} Audio Input Layout`,
			},
			{
				variableId: `decoder${i}_audio_output_layout`,
				name: `Decoder ${i} Audio Output Layout`,
			},
			{
				variableId: `decoder${i}_audio_language`,
				name: `Decoder ${i} Audio Language`,
			},
			{
				variableId: `decoder${i}_audio_sample_in`,
				name: `Decoder ${i} Audio Sample Rate In`,
			},
			{
				variableId: `decoder${i}_audio_sample_out`,
				name: `Decoder ${i} Audio Sample Rate Out`,
			},

			// Delay ranges
			{
				variableId: `decoder${i}_delay_min`,
				name: `Decoder ${i} Delay Min (ms)`,
			},
			{
				variableId: `decoder${i}_delay_max`,
				name: `Decoder ${i} Delay Max (ms)`,
			},

			// Multisync
			{
				variableId: `decoder${i}_multisync_status`,
				name: `Decoder ${i} Multisync Status`,
			},
			{
				variableId: `decoder${i}_multisync_delay_actual`,
				name: `Decoder ${i} Multisync Delay Actual`,
			},
			{
				variableId: `decoder${i}_multisync_delay_range`,
				name: `Decoder ${i} Multisync Delay Range`,
			},
			{
				variableId: `decoder${i}_multisync_delay_set`,
				name: `Decoder ${i} Multisync Delay Set`,
			},
			{
				variableId: `decoder${i}_multisync_system_time`,
				name: `Decoder ${i} Multisync System Time`,
			},
			{
				variableId: `decoder${i}_multisync_timecode`,
				name: `Decoder ${i} Multisync Timecode`,
			},
			{
				variableId: `decoder${i}_multisync_time_diff`,
				name: `Decoder ${i} Multisync Time Diff`,
			},
			{
				variableId: `decoder${i}_multisync_tc_packets`,
				name: `Decoder ${i} Multisync TC Packets`,
			},
			{
				variableId: `decoder${i}_multisync_transmission`,
				name: `Decoder ${i} Multisync Transmission Time`,
			},

			// Metadata - KLV
			{
				variableId: `decoder${i}_has_klv`,
				name: `Decoder ${i} Has KLV`,
			},
			{
				variableId: `decoder${i}_klv_payload_bytes`,
				name: `Decoder ${i} KLV Payload Bytes`,
			},
			{
				variableId: `decoder${i}_klv_received`,
				name: `Decoder ${i} KLV Received Packets`,
			},
			{
				variableId: `decoder${i}_klv_output`,
				name: `Decoder ${i} KLV Output Packets`,
			},
			{
				variableId: `decoder${i}_klv_latency`,
				name: `Decoder ${i} KLV Latency`,
			},

			// Metadata - Closed Caption
			{
				variableId: `decoder${i}_has_cc`,
				name: `Decoder ${i} Has Closed Caption`,
			},
			{
				variableId: `decoder${i}_cc_payload_bytes`,
				name: `Decoder ${i} CC Payload Bytes`,
			},
			{
				variableId: `decoder${i}_cc_received`,
				name: `Decoder ${i} CC Received Packets`,
			},
			{
				variableId: `decoder${i}_cc_output`,
				name: `Decoder ${i} CC Output Packets`,
			},
			{
				variableId: `decoder${i}_cc_latency`,
				name: `Decoder ${i} CC Latency`,
			},

			// Metadata - Timecode
			{
				variableId: `decoder${i}_has_timecode`,
				name: `Decoder ${i} Has Timecode`,
			},
			{
				variableId: `decoder${i}_tc_payload_bytes`,
				name: `Decoder ${i} TC Payload Bytes`,
			},
			{
				variableId: `decoder${i}_tc_received`,
				name: `Decoder ${i} TC Received Packets`,
			},
			{
				variableId: `decoder${i}_tc_output`,
				name: `Decoder ${i} TC Output Packets`,
			},
			{
				variableId: `decoder${i}_tc_latency`,
				name: `Decoder ${i} TC Latency`,
			},
			{
				variableId: `decoder${i}_tc_value`,
				name: `Decoder ${i} Timecode Value`,
			},

			// Metadata - AFD
			{
				variableId: `decoder${i}_has_afd`,
				name: `Decoder ${i} Has AFD`,
			},
			{
				variableId: `decoder${i}_afd_payload_bytes`,
				name: `Decoder ${i} AFD Payload Bytes`,
			},
			{
				variableId: `decoder${i}_afd_received`,
				name: `Decoder ${i} AFD Received Packets`,
			},
			{
				variableId: `decoder${i}_afd_output`,
				name: `Decoder ${i} AFD Output Packets`,
			},
			{
				variableId: `decoder${i}_afd_latency`,
				name: `Decoder ${i} AFD Latency`,
			},

			// Clock tracking
			{
				variableId: `decoder${i}_clock_mode`,
				name: `Decoder ${i} Clock Tracking Mode`,
			},
			{
				variableId: `decoder${i}_clock_status`,
				name: `Decoder ${i} Clock Status`,
			},
			{
				variableId: `decoder${i}_clock_resync_count`,
				name: `Decoder ${i} Clock Resync Count`,
			},
			{
				variableId: `decoder${i}_clock_current_stc`,
				name: `Decoder ${i} Clock Current STC`,
			},
			{
				variableId: `decoder${i}_clock_stc_avg`,
				name: `Decoder ${i} Clock STC Average`,
			},

			// HDR info
			{
				variableId: `decoder${i}_hdr_type_in`,
				name: `Decoder ${i} HDR Type In`,
			},
			{
				variableId: `decoder${i}_hdr_type`,
				name: `Decoder ${i} HDR Type`,
			},
			{
				variableId: `decoder${i}_hdr_primaries`,
				name: `Decoder ${i} HDR Colour Primaries`,
			},
			{
				variableId: `decoder${i}_hdr_transfer`,
				name: `Decoder ${i} HDR Transfer Characteristics`,
			},
			{
				variableId: `decoder${i}_hdr_matrix`,
				name: `Decoder ${i} HDR Matrix Coefficients`,
			},

			// Other stats
			{
				variableId: `decoder${i}_last_reset`,
				name: `Decoder ${i} Last Reset`,
			},

			// Simplified status for display
			{
				variableId: `decoder${i}_signal`,
				name: `Decoder ${i} Signal Status`,
			},

			// Configuration from /apis/decoders/:id endpoint
			{
				variableId: `decoder${i}_config_id`,
				name: `Decoder ${i} Config ID`,
			},
			{
				variableId: `decoder${i}_config_name`,
				name: `Decoder ${i} Config Name`,
			},
			{
				variableId: `decoder${i}_config_downmix`,
				name: `Decoder ${i} Downmix Surround`,
			},
			{
				variableId: `decoder${i}_config_buffering_enabled`,
				name: `Decoder ${i} Buffering Enabled`,
			},
			{
				variableId: `decoder${i}_config_buffering_mode`,
				name: `Decoder ${i} Buffering Mode`,
			},
			{
				variableId: `decoder${i}_config_buffering_delay`,
				name: `Decoder ${i} Buffering Delay (ms)`,
			},
			{
				variableId: `decoder${i}_config_multisync_delay`,
				name: `Decoder ${i} Multisync Buffering Delay (ms)`,
			},
			{
				variableId: `decoder${i}_config_stream_id`,
				name: `Decoder ${i} Assigned Stream ID`,
			},
			{
				variableId: `decoder${i}_config_alt_stream_id`,
				name: `Decoder ${i} Alt Stream ID`,
			},
			{
				variableId: `decoder${i}_config_still_image`,
				name: `Decoder ${i} Still Image Mode`,
			},
			{
				variableId: `decoder${i}_config_still_image_delay`,
				name: `Decoder ${i} Still Image Delay (s)`,
			},
			{
				variableId: `decoder${i}_config_still_image_file`,
				name: `Decoder ${i} Still Image Filename`,
			},
			{
				variableId: `decoder${i}_config_hdr_mode`,
				name: `Decoder ${i} HDR Mode`,
			},
			{
				variableId: `decoder${i}_config_num_outputs`,
				name: `Decoder ${i} Number of Outputs`,
			},
			{
				variableId: `decoder${i}_config_enabled_outputs`,
				name: `Decoder ${i} Enabled Output Count`,
			},
			{
				variableId: `decoder${i}_config_output_framerate`,
				name: `Decoder ${i} Output Framerate`,
			},
			{
				variableId: `decoder${i}_config_quad_mode`,
				name: `Decoder ${i} Quad Mode`,
			},
			{
				variableId: `decoder${i}_config_output1`,
				name: `Decoder ${i} Output 1 State`,
			},
			{
				variableId: `decoder${i}_config_output2`,
				name: `Decoder ${i} Output 2 State`,
			},
			{
				variableId: `decoder${i}_config_output3`,
				name: `Decoder ${i} Output 3 State`,
			},
			{
				variableId: `decoder${i}_config_output4`,
				name: `Decoder ${i} Output 4 State`,
			},

			// Preview/Thumbnail settings
			{
				variableId: `decoder${i}_preview_interval`,
				name: `Decoder ${i} Preview Interval (min)`,
			},
			{
				variableId: `decoder${i}_preview_width`,
				name: `Decoder ${i} Preview Width`,
			},
			{
				variableId: `decoder${i}_preview_height`,
				name: `Decoder ${i} Preview Height`,
			},
			{
				variableId: `decoder${i}_preview_enabled`,
				name: `Decoder ${i} Preview Enabled`,
			},
			{
				variableId: `decoder${i}_thumbnail_url`,
				name: `Decoder ${i} Thumbnail URL`,
			},

			// Stream name variable
			{
				variableId: `decoder${i}_stream_name`,
				name: `Decoder ${i} Stream Name`,
			},

			// Additional stream details when assigned
			{
				variableId: `decoder${i}_stream_protocol`,
				name: `Decoder ${i} Stream Protocol`,
			},
			{
				variableId: `decoder${i}_stream_address`,
				name: `Decoder ${i} Stream Address`,
			},
			{
				variableId: `decoder${i}_stream_port`,
				name: `Decoder ${i} Stream Port`,
			},
			{
				variableId: `decoder${i}_stream_bitrate`,
				name: `Decoder ${i} Stream Bitrate`,
			},
			{
				variableId: `decoder${i}_stream_source_address`,
				name: `Decoder ${i} Stream Source Address`,
			},
			{
				variableId: `decoder${i}_stream_uptime`,
				name: `Decoder ${i} Stream Uptime`,
			},
			{
				variableId: `decoder${i}_stream_connection_state`,
				name: `Decoder ${i} Stream Connection State`,
			},
			{
				variableId: `decoder${i}_stream_received_packets`,
				name: `Decoder ${i} Stream Received Packets`,
			},
			{
				variableId: `decoder${i}_stream_received_bytes`,
				name: `Decoder ${i} Stream Received Bytes`,
			},
			{
				variableId: `decoder${i}_stream_summary`,
				name: `Decoder ${i} Stream Summary`,
			}
		)
	}

	self.setVariableDefinitions(variables)

	// Set initial values
	self.setVariableValues({
		// Connection
		connection_status: 'Disconnected',
		device_ip: self.config.host || 'Not configured',

		// System Presets
		preset_active: 'None',
		preset_autosave: 'Unknown',
		preset_modified: 'Unknown',
		preset_count: 0,

		// Preview Service
		preview_enabled: 'Unknown',

		// Stream Management
		stream_count: 0,

		// Device identification
		device_type: 'Unknown',
		device_serial: 'Unknown',
		device_part_number: 'Unknown',

		// Firmware info
		device_version: 'Unknown',
		device_firmware_date: 'Unknown',
		device_firmware_options: 'None',
		device_boot_version: 'Unknown',

		// Hardware info
		device_hw_compatibility: 'Unknown',
		device_hw_revision: 'Unknown',
		device_cpld_revision: 'Unknown',

		// Status info
		device_status: 'Unknown',
		device_uptime: '0 days 00:00:00',
		device_uptime_seconds: 0,
		device_httpd_uptime: '0',
		device_temperature: 'Unknown',
	})

	// Initialize all decoder variables
	for (let i = 0; i < 4; i++) {
		self.setVariableValues({
			// Initialize all decoder variables with defaults
			[`decoder${i}_id`]: i,
			[`decoder${i}_state`]: 'Unknown',
			[`decoder${i}_state_code`]: -999,
			[`decoder${i}_trouble_code`]: 0,
			[`decoder${i}_uptime`]: '00:00:00',
			[`decoder${i}_stream_state`]: 'Unknown',
			[`decoder${i}_stream_state_code`]: -999,
			[`decoder${i}_stream_id`]: 'N/A',
			[`decoder${i}_stream_has_srt_to_udp`]: 'No',
			[`decoder${i}_decoder_started`]: 'No',
			[`decoder${i}_preprocessor_state`]: 'Unknown',
			[`decoder${i}_vframer_packets`]: 0,
			[`decoder${i}_video_input_resolution`]: 'Unknown',
			[`decoder${i}_video_input_framerate`]: '0',
			[`decoder${i}_video_algorithm`]: 'Unknown',
			[`decoder${i}_video_profile`]: 'Unknown',
			[`decoder${i}_video_level`]: 'Unknown',
			[`decoder${i}_video_framing`]: 'Unknown',
			[`decoder${i}_video_slices`]: '0',
			[`decoder${i}_video_latency`]: '0',
			[`decoder${i}_stc_to_pcr_lead`]: '0',
			[`decoder${i}_video_stc_lead`]: '0',
			[`decoder${i}_video_stc_details`]: 'N/A',
			[`decoder${i}_video_decoder_state`]: 'Unknown',
			[`decoder${i}_video_output_format`]: 'Unknown',
			[`decoder${i}_video_display_format`]: 'Unknown',
			[`decoder${i}_video_display_resolution`]: 'Unknown',
			[`decoder${i}_video_framerate`]: '0',
			[`decoder${i}_load_percentage`]: 0,
			[`decoder${i}_still_image`]: 'None',
			[`decoder${i}_displayed_frames`]: '0',
			[`decoder${i}_skipped_frames`]: '0',
			[`decoder${i}_replayed_frames`]: '0',
			[`decoder${i}_corrupted_frames`]: '0',
			[`decoder${i}_oversubscribed_frames`]: '0',
			[`decoder${i}_buffer_mode`]: 'Unknown',
			[`decoder${i}_buffer_state`]: 'Unknown',
			[`decoder${i}_buffer_adjustments`]: '0',
			[`decoder${i}_audio_state`]: 'Unknown',
			[`decoder${i}_audio_pairs_count`]: 0,
			[`decoder${i}_audio_sample_rate`]: '0',
			[`decoder${i}_audio_played_frames`]: '0',
			[`decoder${i}_audio_skipped_frames`]: '0',
			[`decoder${i}_audio_avsync`]: 0,
			[`decoder${i}_audio_bitrate`]: 0,
			[`decoder${i}_audio_compression`]: 'Unknown',
			[`decoder${i}_audio_db_left`]: '-∞',
			[`decoder${i}_audio_db_left_max`]: '-∞',
			[`decoder${i}_audio_db_right`]: '-∞',
			[`decoder${i}_audio_db_right_max`]: '-∞',
			[`decoder${i}_audio_discontinuities`]: 0,
			[`decoder${i}_audio_input_layout`]: 'Unknown',
			[`decoder${i}_audio_output_layout`]: 'Unknown',
			[`decoder${i}_audio_language`]: 'Unknown',
			[`decoder${i}_audio_sample_in`]: 0,
			[`decoder${i}_audio_sample_out`]: 0,
			[`decoder${i}_delay_min`]: 0,
			[`decoder${i}_delay_max`]: 0,
			[`decoder${i}_multisync_status`]: 'Unknown',
			[`decoder${i}_multisync_delay_actual`]: 'N/A',
			[`decoder${i}_multisync_delay_range`]: 'N/A',
			[`decoder${i}_multisync_delay_set`]: 'N/A',
			[`decoder${i}_multisync_system_time`]: 'N/A',
			[`decoder${i}_multisync_timecode`]: 'N/A',
			[`decoder${i}_multisync_time_diff`]: 'N/A',
			[`decoder${i}_multisync_tc_packets`]: '0',
			[`decoder${i}_multisync_transmission`]: 'N/A',
			[`decoder${i}_has_klv`]: 'No',
			[`decoder${i}_klv_payload_bytes`]: '0',
			[`decoder${i}_klv_received`]: '0',
			[`decoder${i}_klv_output`]: '0',
			[`decoder${i}_klv_latency`]: '0',
			[`decoder${i}_has_cc`]: 'No',
			[`decoder${i}_cc_payload_bytes`]: '0',
			[`decoder${i}_cc_received`]: '0',
			[`decoder${i}_cc_output`]: '0',
			[`decoder${i}_cc_latency`]: '0',
			[`decoder${i}_has_timecode`]: 'No',
			[`decoder${i}_tc_payload_bytes`]: '0',
			[`decoder${i}_tc_received`]: '0',
			[`decoder${i}_tc_output`]: '0',
			[`decoder${i}_tc_latency`]: '0',
			[`decoder${i}_tc_value`]: 'N/A',
			[`decoder${i}_has_afd`]: 'No',
			[`decoder${i}_afd_payload_bytes`]: '0',
			[`decoder${i}_afd_received`]: '0',
			[`decoder${i}_afd_output`]: '0',
			[`decoder${i}_afd_latency`]: '0',
			[`decoder${i}_clock_mode`]: 'Unknown',
			[`decoder${i}_clock_status`]: 'Unknown',
			[`decoder${i}_clock_resync_count`]: 0,
			[`decoder${i}_clock_current_stc`]: 'Unknown',
			[`decoder${i}_clock_stc_avg`]: 'Unknown',
			[`decoder${i}_hdr_type_in`]: 'SDR',
			[`decoder${i}_hdr_type`]: 'SDR',
			[`decoder${i}_hdr_primaries`]: 'Unknown',
			[`decoder${i}_hdr_transfer`]: 'Unknown',
			[`decoder${i}_hdr_matrix`]: 'Unknown',
			[`decoder${i}_last_reset`]: 'Never',
			[`decoder${i}_signal`]: 'No Signal',

			// Configuration defaults
			[`decoder${i}_config_id`]: i,
			[`decoder${i}_config_name`]: `Decoder ${i}`,
			[`decoder${i}_config_downmix`]: 'Disabled',
			[`decoder${i}_config_buffering_enabled`]: 'Enabled',
			[`decoder${i}_config_buffering_mode`]: 'Automatic',
			[`decoder${i}_config_buffering_delay`]: 0,
			[`decoder${i}_config_multisync_delay`]: 0,
			[`decoder${i}_config_stream_id`]: 'None',
			[`decoder${i}_config_alt_stream_id`]: 'None',
			[`decoder${i}_config_still_image`]: 'None',
			[`decoder${i}_config_still_image_delay`]: 1,
			[`decoder${i}_config_still_image_file`]: 'None',
			[`decoder${i}_config_hdr_mode`]: 'Auto',
			[`decoder${i}_config_num_outputs`]: 0,
			[`decoder${i}_config_enabled_outputs`]: 0,
			[`decoder${i}_config_output_framerate`]: 'Automatic',
			[`decoder${i}_config_quad_mode`]: 'Disabled',
			[`decoder${i}_config_output1`]: 'Disabled',
			[`decoder${i}_config_output2`]: 'Disabled',
			[`decoder${i}_config_output3`]: 'Disabled',
			[`decoder${i}_config_output4`]: 'Disabled',

			// Preview defaults
			[`decoder${i}_preview_interval`]: 5,
			[`decoder${i}_preview_width`]: 352,
			[`decoder${i}_preview_height`]: 198,
			[`decoder${i}_preview_enabled`]: 'Unknown',
			[`decoder${i}_thumbnail_url`]: '',
			[`decoder${i}_stream_name`]: 'None',

			// Stream details defaults
			[`decoder${i}_stream_protocol`]: 'None',
			[`decoder${i}_stream_address`]: 'N/A',
			[`decoder${i}_stream_port`]: 'N/A',
			[`decoder${i}_stream_bitrate`]: '0 kbps',
			[`decoder${i}_stream_source_address`]: 'Unknown',
			[`decoder${i}_stream_uptime`]: '0s',
			[`decoder${i}_stream_connection_state`]: 'Not Connected',
			[`decoder${i}_stream_received_packets`]: '0',
			[`decoder${i}_stream_received_bytes`]: '0',
			[`decoder${i}_stream_summary`]: 'No stream',
		})
	}
}