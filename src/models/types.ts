/* eslint-disable camelcase */

// Type for arguments provided for the list commands
export type ListArgs = {
  listType: string,
  listWord: string
}

// Type for muted users
export type MutedUser = {
  uid: string,
  guildId: string,
  reason?: string,
  isActive?: boolean,
  kickTimer?: boolean,
  banCount?: number,
  createdAt?: Date,
  modifiedAt?: Date
}

// Type for muted users database data
export type MutedUserDb = {
  uid: string,
  guild_id: string,
  reason: string,
  is_active: boolean,
  kick_timer: boolean,
  ban_count: number,
  created_at: Date,
  modified_at: Date
}

// Type for banned users
export type BannedUser = {
  uid: string,
  guildId: string,
  reason: string,
  time?: bigint,
  isActive?: boolean,
  createdAt?: Date,
  modifiedAt?: Date,
}

// Type for banned users database data
export type BannedUserDb = {
  uid: string,
  guild_id: string,
  reason: string,
  time: bigint,
  is_active: boolean,
  created_at: Date,
  modified_at: Date,
}

// Type for inappropriate users database data
export type InappropriateWords = {
  word: string,
  bannable: boolean
}
