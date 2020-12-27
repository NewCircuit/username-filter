// Type for arguments provided for the list commands
export type ListArgs = {
  listType: string,
  word: string,
  index: number
}

// Type for muted users database data
export type MutedUserDb = {
  uid: string,
  guildId: string,
  reason: string,
  isActive: boolean,
  kickTimer: boolean,
  banCount: number,
  createdAt: Date,
  modifiedAt: Date
}

// Type for banned users database data
export type BannedUserDb = {
  uid: string,
  guildId: string,
  reason: string,
  time: bigint,
  isActive: boolean,
  createdAt: Date,
  modifiedAt: Date,
}
