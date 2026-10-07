import { Injectable } from '@nestjs/common'
import { ApplicationStatus, EmploymentType, InterviewStatus, OfferStatus, Prisma, WorkMode } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'

const companySeedData = [
  { name: 'Clyptus', description: 'AI-native hiring platform', location: 'Hyderabad', website: 'https://clyptus.ai' },
  { name: 'NorthStar Labs', description: 'Data and product company', location: 'Bengaluru', website: 'https://northstarlabs.ai' },
  { name: 'CloudNest', description: 'Cloud-native workplace platform', location: 'Remote', website: 'https://cloudnest.io' },
  { name: 'OrbitWorks', description: 'Product design and engineering studio', location: 'Mumbai', website: 'https://orbitworks.io' },
  { name: 'InfraHorizon', description: 'Platform and infrastructure team', location: 'Pune', website: 'https://infrahorizon.dev' },
]

const jobSeedData = [
  { title: 'AI Engineer', companyName: 'Clyptus', location: 'Hyderabad', workMode: WorkMode.HYBRID, employmentType: EmploymentType.FULL_TIME, experienceMin: 2, experienceMax: 5, salaryMin: 900000, salaryMax: 1600000, skills: ['Python', 'LLM', 'FastAPI', 'AWS'], industry: 'AI & Machine Learning', description: 'Build AI-powered candidate discovery and recommendation workflows for a modern hiring platform.' },
  { title: 'Generative AI Developer', companyName: 'NorthStar Labs', location: 'Bengaluru', workMode: WorkMode.REMOTE, employmentType: EmploymentType.FULL_TIME, experienceMin: 2, experienceMax: 6, salaryMin: 1200000, salaryMax: 1800000, skills: ['Python', 'LangChain', 'AI APIs', 'Prompt Design'], industry: 'AI & Machine Learning', description: 'Design and iterate on LLM-driven product experiences, tools, and internal automations.' },
  { title: 'Python Developer', companyName: 'CloudNest', location: 'Remote', workMode: WorkMode.REMOTE, employmentType: EmploymentType.FULL_TIME, experienceMin: 1, experienceMax: 4, salaryMin: 800000, salaryMax: 1400000, skills: ['Python', 'Django', 'PostgreSQL', 'REST APIs'], industry: 'Software Development', description: 'Build and profile backend services for secure platform operations and product features.' },
  { title: 'Full Stack Developer', companyName: 'OrbitWorks', location: 'Mumbai', workMode: WorkMode.ONSITE, employmentType: EmploymentType.FULL_TIME, experienceMin: 3, experienceMax: 6, salaryMin: 1300000, salaryMax: 2100000, skills: ['React', 'Node.js', 'TypeScript', 'GraphQL'], industry: 'Software Development', description: 'Deliver full-stack product features across customer workflows, analytics, and platform tooling.' },
  { title: 'React Developer', companyName: 'Clyptus', location: 'Remote', workMode: WorkMode.REMOTE, employmentType: EmploymentType.CONTRACT, experienceMin: 2, experienceMax: 5, salaryMin: 1100000, salaryMax: 1700000, skills: ['React', 'TypeScript', 'CSS', 'UX'], industry: 'Product Engineering', description: 'Create polished interfaces for high-velocity candidate and recruiter experiences.' },
  { title: 'Backend Developer', companyName: 'InfraHorizon', location: 'Pune', workMode: WorkMode.HYBRID, employmentType: EmploymentType.FULL_TIME, experienceMin: 2, experienceMax: 6, salaryMin: 1000000, salaryMax: 1600000, skills: ['Node.js', 'NestJS', 'PostgreSQL', 'Redis'], industry: 'Platform Engineering', description: 'Own API reliability and backend scalability for real-time hiring workflows.' },
  { title: 'Data Analyst', companyName: 'NorthStar Labs', location: 'Hyderabad', workMode: WorkMode.HYBRID, employmentType: EmploymentType.FULL_TIME, experienceMin: 1, experienceMax: 4, salaryMin: 700000, salaryMax: 1200000, skills: ['SQL', 'Python', 'Tableau', 'Analytics'], industry: 'Data', description: 'Translate hiring and customer signals into actionable insights for product optimization.' },
  { title: 'Machine Learning Engineer', companyName: 'CloudNest', location: 'Bengaluru', workMode: WorkMode.REMOTE, employmentType: EmploymentType.FULL_TIME, experienceMin: 3, experienceMax: 7, salaryMin: 1500000, salaryMax: 2200000, skills: ['Python', 'ML', 'MLOps', 'TensorFlow'], industry: 'AI & Machine Learning', description: 'Design and optimize model pipelines that power search and discovery experiences.' },
  { title: 'Software Engineer', companyName: 'OrbitWorks', location: 'Delhi', workMode: WorkMode.ONSITE, employmentType: EmploymentType.FULL_TIME, experienceMin: 2, experienceMax: 6, salaryMin: 1000000, salaryMax: 1800000, skills: ['JavaScript', 'System Design', 'Testing', 'AWS'], industry: 'Technology', description: 'Build dependable software systems and product experiences for growing customers.' },
  { title: 'Cloud Engineer', companyName: 'InfraHorizon', location: 'Remote', workMode: WorkMode.REMOTE, employmentType: EmploymentType.FULL_TIME, experienceMin: 3, experienceMax: 7, salaryMin: 1400000, salaryMax: 2200000, skills: ['AWS', 'Kubernetes', 'Terraform', 'Linux'], industry: 'Cloud', description: 'Improve platform resilience and deployment automation for scale-critical product systems.' },
]

@Injectable()
export class DemoService {
  constructor(private readonly prisma: PrismaService) {}

  async seedDemoData(userId: string) {
    const createdCompanies = await Promise.all(
      companySeedData.map(async (company) =>
        this.prisma.company.upsert({
          where: { name: company.name },
          update: { description: company.description, location: company.location, website: company.website },
          create: { ...company },
        }),
      ),
    )

    const companyMap = new Map(createdCompanies.map((company) => [company.name, company.id]))

    const jobs = await Promise.all(
      jobSeedData.map(async (definition) => {
        const companyId = companyMap.get(definition.companyName)
        if (!companyId) return null

        return this.prisma.job.upsert({
          where: {
            id: `${definition.title.toLowerCase().replace(/\s+/g, '-')}-${definition.companyName.toLowerCase().replace(/\s+/g, '-')}`,
          },
          update: {
            description: definition.description,
            location: definition.location,
            workMode: definition.workMode,
            employmentType: definition.employmentType,
            experienceMin: definition.experienceMin,
            experienceMax: definition.experienceMax,
            salaryMin: definition.salaryMin,
            salaryMax: definition.salaryMax,
            skills: definition.skills,
            industry: definition.industry,
            status: 'OPEN',
          },
          create: {
            id: `${definition.title.toLowerCase().replace(/\s+/g, '-')}-${definition.companyName.toLowerCase().replace(/\s+/g, '-')}`,
            title: definition.title,
            description: definition.description,
            companyId,
            location: definition.location,
            workMode: definition.workMode,
            employmentType: definition.employmentType,
            experienceMin: definition.experienceMin,
            experienceMax: definition.experienceMax,
            salaryMin: definition.salaryMin,
            salaryMax: definition.salaryMax,
            skills: definition.skills,
            industry: definition.industry,
            status: 'OPEN',
          },
        })
      }),
    )

    const firstResume = await this.prisma.resume.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    const primaryJob = jobs.find((job): job is NonNullable<typeof job> => Boolean(job)) ?? null

    let application = null
    if (primaryJob && firstResume) {
      application = await this.prisma.application.upsert({
        where: {
          userId_jobId: {
            userId,
            jobId: primaryJob.id,
          },
        },
        update: { status: ApplicationStatus.APPLIED },
        create: {
          userId,
          jobId: primaryJob.id,
          resumeId: firstResume.id,
          status: ApplicationStatus.APPLIED,
        },
      })

      await this.prisma.interview.upsert({
        where: { applicationId: application.id },
        update: {
          status: InterviewStatus.SCHEDULED,
          scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
          interviewerName: 'Priya Nair',
          meetingLink: 'https://meet.google.com/demo-interview',
        },
        create: {
          applicationId: application.id,
          status: InterviewStatus.SCHEDULED,
          scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
          interviewerName: 'Priya Nair',
          meetingLink: 'https://meet.google.com/demo-interview',
        },
      })

      const existingOffer = await this.prisma.offer.findFirst({ where: { applicationId: application.id } })
      if (!existingOffer) {
        await this.prisma.offer.create({
          data: {
            applicationId: application.id,
            title: 'Offer Letter',
            salary: 1800000,
            joiningDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
            message: 'We would love to extend an offer for this opportunity.',
            status: OfferStatus.PENDING,
          },
        })
      }
    }

    return {
      companiesCreated: createdCompanies.length,
      jobsCreated: jobs.filter(Boolean).length,
      applicationId: application?.id ?? null,
      userId,
    }
  }
}
