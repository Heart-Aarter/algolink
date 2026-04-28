import type { OjPlatform, SubmissionStatus } from '@/types/algolink'

export interface OjProfile {
  platform: OjPlatform
  handle: string
  rating: number
  maxRating: number
  rank?: string
  maxRank?: string
  avatar?: string
  contribution?: number
  friendOfCount?: number
  registeredAt?: string
  lastOnlineAt?: string
}

export interface OjSubmission {
  id: string
  platform: OjPlatform
  problemId: string
  problemTitle: string
  difficulty: string
  tags: string[]
  verdict: SubmissionStatus
  language: string
  submittedAt: string
  runtime: string
}

export interface OjRatingChange {
  id: string
  platform: OjPlatform
  contestId: number
  contestName: string
  rank: number
  oldRating: number
  newRating: number
  ratingUpdatedAt: string
}
