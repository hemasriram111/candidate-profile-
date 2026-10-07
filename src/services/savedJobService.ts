import apiClient from './apiClient'
import type { Job } from '../types/job.types'

export type SavedJob = Job & { savedAt: string }

export const savedJobService = {
  async listSavedJobs() {
    const response = await apiClient.get<{ items: SavedJob[]; total: number }>('/candidate/saved-jobs')
    return response.data
  },

  async saveJob(jobId: string) {
    const response = await apiClient.post<SavedJob>(`/candidate/saved-jobs/${jobId}`)
    return response.data
  },

  async removeSavedJob(jobId: string) {
    await apiClient.delete(`/candidate/saved-jobs/${jobId}`)
  },
}
