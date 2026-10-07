import apiClient from './apiClient'

export type ApplicationApiStatus =
  | 'APPLIED'
  | 'SCREENING'
  | 'SHORTLISTED'
  | 'INTERVIEW'
  | 'OFFER'
  | 'REJECTED'
  | 'HIRED'

export type ApplicationApiRecord = {
  id: string
  jobId: string
  jobTitle: string
  companyName: string
  companyLogo: string
  location: string
  status: ApplicationApiStatus
  appliedAt: string
  resume: null | {
    id: string
    originalFileName: string
    status: string
  }
  interview?: InterviewApiRecord | null
  offers?: OfferApiRecord[]
}

export type InterviewApiRecord = {
  id: string
  applicationId: string
  jobTitle: string
  companyName: string
  location: string
  scheduledAt: string | null
  meetingLink: string | null
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'
  interviewerName: string | null
  notes: string | null
}

export type OfferApiRecord = {
  id: string
  applicationId: string
  jobTitle: string
  companyName: string
  location: string
  title: string
  salary: number | null
  joiningDate: string | null
  message: string | null
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
}

export const candidateJourneyService = {
  async listApplications() {
    const response = await apiClient.get<ApplicationApiRecord[]>('/applications')
    return response.data
  },

  async getApplication(applicationId: string) {
    const response = await apiClient.get<ApplicationApiRecord>(`/applications/${applicationId}`)
    return response.data
  },

  async createApplication(jobId: string, resumeId: string) {
    const response = await apiClient.post<ApplicationApiRecord>('/applications', { jobId, resumeId })
    return response.data
  },

  async listInterviews() {
    const response = await apiClient.get<InterviewApiRecord[]>('/interviews')
    return response.data
  },

  async listOffers() {
    const response = await apiClient.get<OfferApiRecord[]>('/offers')
    return response.data
  },

  async respondToOffer(offerId: string, status: 'ACCEPTED' | 'REJECTED') {
    const response = await apiClient.patch<OfferApiRecord & { applicationStatus: ApplicationApiStatus }>(
      `/offers/${offerId}/respond`,
      { status },
    )
    return response.data
  },
}
