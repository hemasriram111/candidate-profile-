import { Transform, Type } from 'class-transformer'
import { IsEnum, IsIn, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator'
import { EmploymentType, WorkMode } from '@prisma/client'

function toStringArray(value: string | string[] | undefined) {
  if (!value) return undefined
  if (Array.isArray(value)) {
    return value.flatMap((item) => String(item).split(',')).map((item) => item.trim()).filter(Boolean)
  }
  return value.split(',').map((item) => item.trim()).filter(Boolean)
}

export class JobQueryDto {
  @IsOptional()
  @IsString()
  search?: string

  @IsOptional()
  @IsString()
  location?: string

  @IsOptional()
  @IsString()
  industry?: string

  @IsOptional()
  @IsString()
  category?: string

  @IsOptional()
  @IsString()
  companyId?: string

  @IsOptional()
  @IsEnum(WorkMode)
  workMode?: WorkMode

  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  experienceMin?: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  experienceMax?: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  salaryMin?: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  salaryMax?: number

  @IsOptional()
  @Transform(({ value }) => toStringArray(value))
  skills?: string[]

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number

  @IsOptional()
  @IsIn(['relevance', 'newest', 'salary'])
  sort?: 'relevance' | 'newest' | 'salary'
}
