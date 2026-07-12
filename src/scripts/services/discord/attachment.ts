import { Collection } from "/scripts/lib/utils.ts";

import { Snowflake } from "/scripts/services/discord/snowflake.ts";

const AttachmentFlags = {
	IsClip: 1n << 0n,
	IsThumbnail: 1n << 1n,
	IsRemix: 1n << 2n,
	IsSpoiler: 1n << 3n,
	ContainsExplicitMedia: 1n << 4n,
	IsAnimated: 1n << 5n,
	ContainsGoreContent: 1n << 6n,
	ContainsSelfHarmContent: 1n << 7n
} as const;
export type AttachmentFlags = typeof AttachmentFlags[keyof typeof AttachmentFlags];

export class Attachment {
	id: Snowflake;
	filename: string;
	title?: string;
	uploaded_filename?: string;
	description?: string;
	content_type?: string;
	size: number;
	url: string;
	proxy_url: string;
	height?: number;
	width?: number;
	content_scan_version?: number;
	placeholder_version?: number;
	placeholder?: string;
	ephemeral?: boolean;
	duration_secs?: number;
	waveform?: string;
	flags?: AttachmentFlags;
	is_clip?: boolean;
	is_thumbnail?: boolean;
	is_remix?: boolean;
	is_spoiler?: boolean;
	clip_created_at?: Date;
	clip_participants?: Snowflake[];
	application?: Snowflake;

	constructor(data: any) {
		this.id = data.id;
		this.filename = data.filename;
		if (data.title) this.title = data.title;
		if (data.uploaded_filename) this.uploaded_filename = data.uploaded_filename;
		if (data.description) this.description = data.description;
		if (data.content_type) this.content_type = data.content_type;
		this.size = data.size;
		this.url = data.url;
		this.proxy_url = data.proxy_url;
		if (data.height) this.height = data.height;
		if (data.width) this.width = data.width;
		if (data.content_scan_version) this.content_scan_version = data.content_scan_version;
		if (data.placeholder_version) this.placeholder_version = data.placeholder_version;
		if (data.placeholder) this.placeholder = data.placeholder;
		if (data.ephemeral) this.ephemeral = data.ephemeral;
		if (data.duration_secs) this.duration_secs = data.duration_secs;
		if (data.waveform) this.waveform = data.waveform;
		if (data.flags) this.flags = data.flags;
		if (data.is_clip) this.is_clip = data.is_clip;
		if (data.is_thumbnail) this.is_thumbnail = data.is_thumbnail;
		if (data.is_remix) this.is_remix = data.is_remix;
		if (data.is_spoiler) this.is_spoiler = data.is_spoiler;
		if (data.clip_created_at) this.clip_created_at = new Date(data.clip_created_at);
		this.clip_participants = data.clip_participant_ids;
		this.application = data.application_id;
	};
};

export class AttachmentCollection extends Collection<Attachment> {
	constructor(attachments?: any[]) {
		super();

		if (attachments) for (const data of attachments) this.set(data.id, new Attachment(data));
	};
};