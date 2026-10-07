import { ApplicationStatus } from '@prisma/client'
import { IsEnum, IsString } from 'class-validator'

export class CreateApplicationDto {
  @IsString()
  jobId!: string

  @IsString()
  resumeId!: string
}

export class UpdateApplicationStatusDto {
  @IsEnum(ApplicationStatus)
  status!: ApplicationStatus
}
