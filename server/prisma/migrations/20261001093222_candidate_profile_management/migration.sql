-- CreateEnum
CREATE TYPE "CareerLevel" AS ENUM ('STUDENT', 'FRESHER', 'ENTRY_LEVEL', 'MID_LEVEL', 'SENIOR', 'LEAD', 'MANAGER');

-- CreateEnum
CREATE TYPE "WorkAuthorization" AS ENUM ('CITIZEN', 'PERMANENT_RESIDENT', 'WORK_VISA', 'REQUIRES_SPONSORSHIP', 'OTHER');

-- CreateEnum
CREATE TYPE "RelocationPreference" AS ENUM ('YES', 'NO', 'MAYBE');

-- CreateEnum
CREATE TYPE "OpenToWorkStatus" AS ENUM ('ACTIVELY_LOOKING', 'OPEN_TO_OPPORTUNITIES', 'NOT_LOOKING');

-- CreateEnum
CREATE TYPE "ProfileVisibility" AS ENUM ('PUBLIC', 'RECRUITERS_ONLY', 'PRIVATE');

-- CreateEnum
CREATE TYPE "Availability" AS ENUM ('IMMEDIATELY', 'FIFTEEN_DAYS', 'THIRTY_DAYS', 'SIXTY_DAYS', 'NINETY_DAYS', 'CUSTOM');

-- CreateEnum
CREATE TYPE "SkillProficiency" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

-- CreateEnum
CREATE TYPE "LanguageProficiency" AS ENUM ('BASIC', 'CONVERSATIONAL', 'PROFESSIONAL', 'FLUENT', 'NATIVE');

-- CreateEnum
CREATE TYPE "CandidateLinkType" AS ENUM ('LINKEDIN', 'GITHUB', 'PERSONAL_WEBSITE', 'PORTFOLIO', 'KAGGLE', 'BEHANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "WorkMode" AS ENUM ('REMOTE', 'HYBRID', 'ONSITE');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'TEMPORARY');

-- AlterTable
ALTER TABLE "CandidateProfile" ADD COLUMN     "allowRecruiterContact" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "availability" "Availability",
ADD COLUMN     "careerLevel" "CareerLevel",
ADD COLUMN     "currentCompany" TEXT,
ADD COLUMN     "currentJobTitle" TEXT,
ADD COLUMN     "currentSalary" INTEGER,
ADD COLUMN     "customNoticePeriodDays" INTEGER,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "functionalArea" TEXT,
ADD COLUMN     "industry" TEXT,
ADD COLUMN     "noticePeriodDays" INTEGER,
ADD COLUMN     "openToWork" "OpenToWorkStatus" NOT NULL DEFAULT 'NOT_LOOKING',
ADD COLUMN     "profilePhotoMimeType" TEXT,
ADD COLUMN     "profilePhotoStoredName" TEXT,
ADD COLUMN     "relocationLocations" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "showInRecruiterSearch" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showResumeToRecruiters" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "totalExperienceMonths" INTEGER,
ADD COLUMN     "totalExperienceYears" INTEGER,
ADD COLUMN     "visibility" "ProfileVisibility" NOT NULL DEFAULT 'RECRUITERS_ONLY',
ADD COLUMN     "willingToRelocate" "RelocationPreference",
ADD COLUMN     "workAuthorization" "WorkAuthorization";

-- CreateTable
CREATE TABLE "CandidateSkill" (
    "id" TEXT NOT NULL,
    "candidateProfileId" TEXT NOT NULL,
    "skillName" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "proficiency" "SkillProficiency" NOT NULL DEFAULT 'INTERMEDIATE',
    "yearsOfExperience" DECIMAL(4,1),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateEducation" (
    "id" TEXT NOT NULL,
    "candidateProfileId" TEXT NOT NULL,
    "degree" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "fieldOfStudy" TEXT,
    "startYear" INTEGER,
    "endYear" INTEGER,
    "grade" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateEducation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateExperience" (
    "id" TEXT NOT NULL,
    "candidateProfileId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "employmentType" "EmploymentType",
    "location" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "currentJob" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateExperience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateExperienceSkill" (
    "experienceId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,

    CONSTRAINT "CandidateExperienceSkill_pkey" PRIMARY KEY ("experienceId","skillId")
);

-- CreateTable
CREATE TABLE "CandidateProject" (
    "id" TEXT NOT NULL,
    "candidateProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "technologies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "githubUrl" TEXT,
    "demoUrl" TEXT,
    "imageUrl" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateCertification" (
    "id" TEXT NOT NULL,
    "candidateProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "issuingOrganization" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "credentialId" TEXT,
    "credentialUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateCertification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateLanguage" (
    "id" TEXT NOT NULL,
    "candidateProfileId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "proficiency" "LanguageProficiency" NOT NULL DEFAULT 'PROFESSIONAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateLanguage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateLink" (
    "id" TEXT NOT NULL,
    "candidateProfileId" TEXT NOT NULL,
    "type" "CandidateLinkType" NOT NULL,
    "label" TEXT,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateJobPreference" (
    "id" TEXT NOT NULL,
    "candidateProfileId" TEXT NOT NULL,
    "desiredTitles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferredLocations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "workModes" "WorkMode"[] DEFAULT ARRAY[]::"WorkMode"[],
    "employmentTypes" "EmploymentType"[] DEFAULT ARRAY[]::"EmploymentType"[],
    "preferredIndustries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferredFunctionalAreas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "experienceMinYears" DECIMAL(4,1),
    "experienceMaxYears" DECIMAL(4,1),
    "expectedSalaryMin" INTEGER,
    "expectedSalaryMax" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateJobPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CandidateSkill_normalizedName_idx" ON "CandidateSkill"("normalizedName");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateSkill_candidateProfileId_normalizedName_key" ON "CandidateSkill"("candidateProfileId", "normalizedName");

-- CreateIndex
CREATE INDEX "CandidateEducation_candidateProfileId_idx" ON "CandidateEducation"("candidateProfileId");

-- CreateIndex
CREATE INDEX "CandidateExperience_candidateProfileId_idx" ON "CandidateExperience"("candidateProfileId");

-- CreateIndex
CREATE INDEX "CandidateProject_candidateProfileId_idx" ON "CandidateProject"("candidateProfileId");

-- CreateIndex
CREATE INDEX "CandidateCertification_candidateProfileId_idx" ON "CandidateCertification"("candidateProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateLanguage_candidateProfileId_normalizedName_key" ON "CandidateLanguage"("candidateProfileId", "normalizedName");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateLink_candidateProfileId_type_key" ON "CandidateLink"("candidateProfileId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateJobPreference_candidateProfileId_key" ON "CandidateJobPreference"("candidateProfileId");

-- AddForeignKey
ALTER TABLE "CandidateSkill" ADD CONSTRAINT "CandidateSkill_candidateProfileId_fkey" FOREIGN KEY ("candidateProfileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateEducation" ADD CONSTRAINT "CandidateEducation_candidateProfileId_fkey" FOREIGN KEY ("candidateProfileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateExperience" ADD CONSTRAINT "CandidateExperience_candidateProfileId_fkey" FOREIGN KEY ("candidateProfileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateExperienceSkill" ADD CONSTRAINT "CandidateExperienceSkill_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "CandidateExperience"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateExperienceSkill" ADD CONSTRAINT "CandidateExperienceSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "CandidateSkill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateProject" ADD CONSTRAINT "CandidateProject_candidateProfileId_fkey" FOREIGN KEY ("candidateProfileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateCertification" ADD CONSTRAINT "CandidateCertification_candidateProfileId_fkey" FOREIGN KEY ("candidateProfileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateLanguage" ADD CONSTRAINT "CandidateLanguage_candidateProfileId_fkey" FOREIGN KEY ("candidateProfileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateLink" ADD CONSTRAINT "CandidateLink_candidateProfileId_fkey" FOREIGN KEY ("candidateProfileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateJobPreference" ADD CONSTRAINT "CandidateJobPreference_candidateProfileId_fkey" FOREIGN KEY ("candidateProfileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
