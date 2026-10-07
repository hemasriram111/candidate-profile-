import {
  Availability,
  CandidateLinkType,
  CareerLevel,
  EmploymentType,
  LanguageProficiency,
  OpenToWorkStatus,
  Prisma,
  ProfileVisibility,
  RelocationPreference,
  SkillProficiency,
  WorkAuthorization,
  WorkMode,
} from '@prisma/client'
import { Type } from 'class-transformer'
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator'

export class CandidateSkillDto {
  @IsString()
  @MaxLength(80)
  skillName!: string

  @IsOptional()
  @IsEnum(SkillProficiency)
  proficiency?: SkillProficiency

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(80)
  yearsOfExperience?: number
}

export class CandidateEducationDto {
  @IsString()
  @MaxLength(160)
  degree!: string

  @IsString()
  @MaxLength(200)
  institution!: string

  @IsOptional()
  @IsString()
  @MaxLength(160)
  fieldOfStudy?: string

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2200)
  startYear?: number

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2200)
  endYear?: number

  @IsOptional()
  @IsString()
  @MaxLength(80)
  grade?: string

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string
}

export class CandidateExperienceDto {
  @IsString()
  @MaxLength(200)
  company!: string

  @IsString()
  @MaxLength(160)
  jobTitle!: string

  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType

  @IsOptional()
  @IsString()
  @MaxLength(160)
  location?: string

  @IsOptional()
  @IsDateString()
  startDate?: string

  @ValidateIf((experience: CandidateExperienceDto) => !experience.currentJob)
  @IsOptional()
  @IsDateString()
  endDate?: string | null

  @IsOptional()
  @IsBoolean()
  currentJob?: boolean

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  description?: string

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  skills?: string[]
}

export class CandidateProjectDto {
  @IsString()
  @MaxLength(180)
  name!: string

  @IsOptional()
  @IsString()
  @MaxLength(8000)
  description?: string

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(40)
  @IsString({ each: true })
  technologies?: string[]

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  githubUrl?: string

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  demoUrl?: string

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  imageUrl?: string

  @IsOptional()
  @IsDateString()
  startDate?: string

  @IsOptional()
  @IsDateString()
  endDate?: string
}

export class CandidateCertificationDto {
  @IsString()
  @MaxLength(200)
  name!: string

  @IsString()
  @MaxLength(200)
  issuingOrganization!: string

  @IsOptional()
  @IsDateString()
  issueDate?: string

  @IsOptional()
  @IsDateString()
  expiryDate?: string

  @IsOptional()
  @IsString()
  @MaxLength(120)
  credentialId?: string

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  credentialUrl?: string
}

export class CandidateLanguageDto {
  @IsString()
  @MaxLength(100)
  language!: string

  @IsOptional()
  @IsEnum(LanguageProficiency)
  proficiency?: LanguageProficiency
}

export class CandidateLinkDto {
  @IsEnum(CandidateLinkType)
  type!: CandidateLinkType

  @IsOptional()
  @IsString()
  @MaxLength(100)
  label?: string

  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  url!: string
}

export class CandidateJobPreferenceDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  desiredTitles?: string[]

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  preferredLocations?: string[]

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3)
  @IsEnum(WorkMode, { each: true })
  workModes?: WorkMode[]

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsEnum(EmploymentType, { each: true })
  employmentTypes?: EmploymentType[]

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  preferredIndustries?: string[]

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  preferredFunctionalAreas?: string[]

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(80)
  experienceMinYears?: number

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(80)
  experienceMaxYears?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  expectedSalaryMin?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  expectedSalaryMax?: number
}

export class UpdateCandidateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  fullName?: string

  @IsOptional()
  @IsString()
  @MaxLength(80)
  phone?: string

  @IsOptional()
  @IsIn(['WOMAN', 'MAN', 'NON_BINARY', 'SELF_DESCRIBED', 'PREFER_NOT_TO_SAY'])
  gender?: string

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string | null

  @IsOptional()
  @IsString()
  @MaxLength(160)
  headline?: string

  @IsOptional()
  @IsString()
  @MaxLength(160)
  location?: string

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  bio?: string

  @IsOptional()
  @IsString()
  @MaxLength(160)
  currentJobTitle?: string

  @IsOptional()
  @IsString()
  @MaxLength(160)
  currentCompany?: string

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(80)
  totalExperienceYears?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(11)
  totalExperienceMonths?: number

  @IsOptional()
  @IsString()
  @MaxLength(120)
  industry?: string

  @IsOptional()
  @IsString()
  @MaxLength(120)
  functionalArea?: string

  @IsOptional()
  @IsEnum(CareerLevel)
  careerLevel?: CareerLevel

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(365)
  noticePeriodDays?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  currentSalary?: number

  @IsOptional()
  @IsEnum(WorkAuthorization)
  workAuthorization?: WorkAuthorization

  @IsOptional()
  @IsEnum(RelocationPreference)
  willingToRelocate?: RelocationPreference

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  relocationLocations?: string[]

  @IsOptional()
  @IsEnum(OpenToWorkStatus)
  openToWork?: OpenToWorkStatus

  @IsOptional()
  @IsEnum(Availability)
  availability?: Availability

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(365)
  customNoticePeriodDays?: number

  @IsOptional()
  @IsEnum(ProfileVisibility)
  visibility?: ProfileVisibility

  @IsOptional()
  @IsBoolean()
  allowRecruiterContact?: boolean

  @IsOptional()
  @IsBoolean()
  showInRecruiterSearch?: boolean

  @IsOptional()
  @IsBoolean()
  showResumeToRecruiters?: boolean

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => CandidateSkillDto)
  skills?: CandidateSkillDto[]

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => CandidateEducationDto)
  education?: CandidateEducationDto[]

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(40)
  @ValidateNested({ each: true })
  @Type(() => CandidateExperienceDto)
  experience?: CandidateExperienceDto[]

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CandidateProjectDto)
  projects?: CandidateProjectDto[]

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(40)
  @ValidateNested({ each: true })
  @Type(() => CandidateCertificationDto)
  certifications?: CandidateCertificationDto[]

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(40)
  @ValidateNested({ each: true })
  @Type(() => CandidateLanguageDto)
  languages?: CandidateLanguageDto[]

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => CandidateLinkDto)
  links?: CandidateLinkDto[]

  @IsOptional()
  @ValidateNested()
  @Type(() => CandidateJobPreferenceDto)
  preferences?: CandidateJobPreferenceDto

  @IsOptional()
  @IsObject()
  parsedResumeData?: Prisma.InputJsonObject

  @IsOptional()
  @IsBoolean()
  completeOnboarding?: boolean
}