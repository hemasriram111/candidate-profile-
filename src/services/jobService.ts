import apiClient from './apiClient'
import type { Job, JobPage } from '../types/job.types'

export const jobService = {
  async getFeaturedJobs(): Promise<Job[]> {
    const response = await apiClient.get<JobPage>('/jobs', { params: { limit: 6, sort: 'newest' } })
    return response.data.items
  },

  async getAllJobs(params?: Record<string, string | number | boolean | string[] | undefined>): Promise<Job[]> {
    const response = await apiClient.get<JobPage>('/jobs', { params: { limit: 50, ...params } })
    return response.data.items
  },

  async searchJobs(params?: Record<string, string | number | boolean | string[] | undefined>): Promise<JobPage> {
    const response = await apiClient.get<JobPage>('/jobs', { params })
    return response.data
  },

  async getRecommendedJobs(params?: Record<string, string | number | boolean | string[] | undefined>): Promise<JobPage> {
    const response = await apiClient.get<JobPage>('/jobs/recommended', { params })
    return response.data
  },

  async getJobById(jobId: string): Promise<Job | undefined> {
    const response = await apiClient.get<Job>(`/jobs/${jobId}`)
    return response.data
  },

  async getSimilarJobs(jobId: string): Promise<Job[]> {
    const jobs = await this.getAllJobs()
    const similarJobs = jobs.filter((job) => job.id !== jobId)
    return similarJobs.slice(0, 3)
  },
}
