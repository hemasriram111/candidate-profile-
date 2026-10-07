import { BadRequestException, Injectable } from '@nestjs/common'
import { Prisma, ResumeStatus } from '@prisma/client'
import { randomUUID } from 'node:crypto'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import { extname, resolve } from 'node:path'
import { PrismaService } from '../prisma/prisma.service'
import { ParsedResumeData, ResumeParserService } from './resume-parser.service'

const MAX_RESUME_SIZE = 8 * 1024 * 1024
const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}

@Injectable()
export class ResumeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly parser: ResumeParserService,
  ) {}

  async uploadAndProcess(userId: string, file?: Express.Multer.File) {
    if (!file || !file.buffer?.length) {
      throw new BadRequestException('Please choose a resume file to upload.')
    }
    if (file.size > MAX_RESUME_SIZE) {
      throw new BadRequestException('Your resume is larger than 8MB.')
    }

    await this.prisma.candidateProfile.upsert({
      where: { userId },
      update: {},
      create: { userId, resumeOnboardingComplete: false },
      select: { id: true },
    })

    const originalFileName = this.cleanOriginalFilename(file.originalname)
    const extension = extname(originalFileName).slice(1).toLowerCase()
    const expectedMimeType = MIME_BY_EXTENSION[extension]
    if (!expectedMimeType || file.mimetype !== expectedMimeType) {
      throw new BadRequestException('Please upload a PDF, DOC, or DOCX file.')
    }
    this.validateSignature(file.buffer, extension)

    const storedFileName = `${randomUUID()}.${extension}`
    const storageKey = `${userId}/${storedFileName}`
    const storageRoot = resolve(process.env.RESUME_STORAGE_DIR || resolve(process.cwd(), 'uploads', 'resumes'))
    const absolutePath = resolve(storageRoot, userId, storedFileName)

    await mkdir(resolve(storageRoot, userId), { recursive: true })
    await writeFile(absolutePath, file.buffer, { flag: 'wx' })

    let resume
    try {
      resume = await this.prisma.resume.create({
        data: {
          userId,
          originalFileName,
          storedFileName,
          storageKey,
          mimeType: expectedMimeType,
          fileSize: file.size,
          status: 'UPLOADED',
        },
      })
    } catch {
      await unlink(absolutePath).catch(() => undefined)
      throw new BadRequestException('Resume upload could not be saved. Please try again.')
    }

    await this.prisma.resume.update({ where: { id: resume.id }, data: { status: 'PROCESSING' } })

    try {
      const extractedText = (await this.parser.extractText(file.buffer, extension))
        .replace(/\0/g, '')
        .trim()
      const parsedData: ParsedResumeData = this.parser.parse(extractedText)

      const savedResume = await this.prisma.resume.update({
        where: { id: resume.id },
        data: {
          status: 'PARSED',
          extractedText,
          parsedData: JSON.parse(JSON.stringify(parsedData)) as Prisma.InputJsonValue,
        },
        select: { id: true, originalFileName: true, mimeType: true, fileSize: true, status: true },
      })

      return {
        success: true,
        resumeId: savedResume.id,
        status: 'parsed' as const,
        resume: savedResume,
        parsedData,
      }
    } catch (error) {
      await this.prisma.resume.update({ where: { id: resume.id }, data: { status: ResumeStatus.FAILED } })
      return {
        success: false,
        resumeId: resume.id,
        status: 'failed' as const,
        resume: { id: resume.id, originalFileName, mimeType: expectedMimeType, fileSize: file.size, status: 'FAILED' as const },
        message: error instanceof BadRequestException
          ? error.message
          : "We couldn't read this resume. Please try another file.",
      }
    }
  }

  private cleanOriginalFilename(value: string) {
    return value.replace(/^.*[\\/]/, '').replace(/[<>:"|?*\u0000-\u001f]/g, '_').slice(0, 180) || 'resume'
  }

  private validateSignature(buffer: Buffer, extension: string) {
    const isPdf = extension === 'pdf' && buffer.subarray(0, 1024).includes(Buffer.from('%PDF-'))
    const isDoc = extension === 'doc' && buffer.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]))
    const isDocx = extension === 'docx' && buffer.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]))

    if (!isPdf && !isDoc && !isDocx) {
      throw new BadRequestException('Please upload a valid PDF, DOC, or DOCX file.')
    }
  }
}