import { BadRequestException, Injectable } from '@nestjs/common'
import mammoth from 'mammoth'
import { PDFParse } from 'pdf-parse'
import WordExtractor from 'word-extractor'

export type ParsedResumeData = {
  personal: {
    fullName: string | null
    email: string | null
    phone: string | null
    location: string | null
    linkedin: string | null
    github: string | null
    portfolio: string | null
  }
  summary: string
  skills: string[]
  education: Array<Record<string, string>>
  experience: Array<Record<string, string>>
  projects: Array<Record<string, string>>
  certifications: Array<Record<string, string>>
  languages: string[]
}

const sectionNames = [
  'summary', 'professional summary', 'profile', 'skills', 'technical skills',
  'experience', 'work experience', 'employment history', 'education', 'projects',
  'certifications', 'certificates', 'languages',
]

@Injectable()
export class ResumeParserService {
  private readonly wordExtractor = new WordExtractor()

  async extractText(buffer: Buffer, extension: string) {
    try {
      if (extension === 'pdf') {
        const parser = new PDFParse({ data: buffer })
        try {
          return (await parser.getText()).text
        } finally {
          await parser.destroy()
        }
      }

      if (extension === 'docx') {
        return (await mammoth.extractRawText({ buffer })).value
      }

      if (extension === 'doc') {
        return (await this.wordExtractor.extract(buffer)).getBody()
      }
    } catch {
      throw new BadRequestException("We couldn't read this resume. Please try another file.")
    }

    throw new BadRequestException('Please upload a PDF, DOC, or DOCX file.')
  }

  parse(text: string): ParsedResumeData {
    const cleaned = text
      .replace(/\0/g, '')
      .replace(/\r\n?/g, '\n')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    if (cleaned.length < 40) {
      throw new BadRequestException("We couldn't extract enough information from this resume. Please upload a clearer version.")
    }

    const lines = cleaned.split('\n').map((line) => line.trim()).filter(Boolean)
    const sections = this.extractSections(lines)
    const allUrls = cleaned.match(/(?:https?:\/\/|www\.)[^\s<>]+/gi)?.map((url) => url.replace(/[),.;]+$/, '')) ?? []
    const email = cleaned.match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/)?.[0] ?? null
    const phone = cleaned.match(/\+?\d[\d\s().-]{7,}\d/)?.[0]?.trim() ?? null
    const explicitLocation = cleaned.match(/(?:^|\n)\s*location\s*:\s*([^\n]+)/i)?.[1]?.trim() ?? null
    const summary = this.joinSection(sections.get('summary') ?? sections.get('professional summary') ?? sections.get('profile'))
    const skillsText = sections.get('skills') ?? sections.get('technical skills') ?? ''
    const skills = skillsText
      .split(/[\n,;|]+/)
      .map((value) => this.cleanValue(value))
      .filter(Boolean)

    const education = this.parseBlocks(sections.get('education') ?? '', 'education')
    const experience = this.parseBlocks(
      sections.get('experience') ?? sections.get('work experience') ?? sections.get('employment history') ?? '',
      'experience',
    )
    const projects = this.parseBlocks(sections.get('projects') ?? '', 'projects')
    const certifications = this.parseBlocks(sections.get('certifications') ?? sections.get('certificates') ?? '', 'certifications')
    const languages = (sections.get('languages') ?? '')
      .split(/[\n,;|]+/)
      .map((value) => this.cleanValue(value))
      .filter(Boolean)

    if (!summary && !skills.length && !education.length && !experience.length && !projects.length && !certifications.length) {
      throw new BadRequestException("We couldn't extract enough information from this resume. Please upload a clearer version.")
    }

    const linkedin = allUrls.find((url) => /linkedin\.com/i.test(url)) ?? null
    const github = allUrls.find((url) => /github\.com/i.test(url)) ?? null
    const portfolio = allUrls.find((url) => !/linkedin\.com|github\.com/i.test(url)) ?? null

    return {
      personal: {
        fullName: this.findName(lines),
        email,
        phone,
        location: explicitLocation,
        linkedin,
        github,
        portfolio,
      },
      summary,
      skills: [...new Set(skills)],
      education,
      experience,
      projects,
      certifications,
      languages,
    }
  }

  private extractSections(lines: string[]) {
    const sections = new Map<string, string[]>()
    let activeSection: string | null = null

    for (const line of lines) {
      const normalizedHeading = line.replace(/^[#\s]+|[:\s]+$/g, '').toLowerCase()
      if (sectionNames.includes(normalizedHeading)) {
        activeSection = normalizedHeading
        sections.set(activeSection, [])
        continue
      }
      if (activeSection) sections.get(activeSection)?.push(line)
    }

    return new Map([...sections].map(([key, value]) => [key, value.join('\n')]))
  }

  private findName(lines: string[]) {
    for (const line of lines.slice(0, 8)) {
      if (
        line.length <= 80 &&
        !line.includes('@') &&
        !/(https?:\/\/|www\.)/i.test(line) &&
        !/\d{5,}/.test(line) &&
        !sectionNames.includes(line.replace(/[:\s]+$/g, '').toLowerCase())
      ) {
        return line
      }
    }
    return null
  }

  private joinSection(value?: string) {
    return value?.split('\n').map((line) => this.cleanValue(line)).filter(Boolean).join('\n') ?? ''
  }

  private parseBlocks(value: string, type: 'education' | 'experience' | 'projects' | 'certifications') {
    const blocks = value.split(/\n\s*\n+/).map((block) => block.trim()).filter(Boolean)
    return blocks.map((block, index) => {
      const lines = block.split('\n').map((line) => this.cleanValue(line)).filter(Boolean)
      const fields: Record<string, string> = { id: `${type}-${index + 1}`, details: block }

      for (const line of lines) {
        const match = line.match(/^(role|title|position|company|employer|institution|school|degree|field|location|start\s*date|end\s*date|dates?|duration|issuer|organisation|organization|name|technologies|description)\s*:\s*(.+)$/i)
        if (match) fields[match[1].toLowerCase().replace(/\s+/g, '')] = match[2].trim()
      }

      const dateRange = fields.dates || fields.duration || this.findDateRange(block)
      const splitDates = this.splitDateRange(dateRange)

      if (type === 'education') {
        fields.institution = fields.institution || fields.school || ''
        fields.degree = fields.degree || ''
        fields.fieldOfStudy = fields.field || ''
        fields.startDate = fields.startdate || splitDates.startDate
        fields.endDate = fields.enddate || splitDates.endDate
        fields.grade = ''
        fields.description = fields.description || block
      } else if (type === 'experience') {
        fields.title = fields.title || fields.role || fields.position || ''
        fields.company = fields.company || fields.employer || ''
        fields.employmentType = ''
        fields.location = fields.location || ''
        fields.startDate = fields.startdate || splitDates.startDate
        fields.endDate = fields.enddate || splitDates.endDate
        fields.currentlyWorking = /^(present|current)$/i.test(fields.endDate) ? 'true' : 'false'
        fields.description = fields.description || block
      } else if (type === 'projects') {
        fields.name = fields.name || lines[0] || ''
        fields.technologies = fields.technologies || ''
        fields.projectUrl = ''
        fields.githubUrl = ''
        fields.description = fields.description || block
      } else {
        fields.name = fields.name || lines[0] || ''
        fields.organisation = fields.organisation || fields.organization || fields.issuer || ''
        fields.issueDate = fields.date || fields.dates || fields.duration || ''
        fields.expiryDate = ''
        fields.credentialId = ''
        fields.credentialUrl = ''
      }

      return fields
    })
  }

  private findDateRange(value: string) {
    const date = '(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[.]?\\s+\\d{4}|\\d{1,2}[/-]\\d{4}|\\d{4}'
    return value.match(new RegExp(`\\b${date}\\s*(?:-|–|to)\\s*(?:${date}|present|current)\\b`, 'i'))?.[0] ?? ''
  }

  private splitDateRange(value: string) {
    const dates = value.match(/(?:\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[.]?\s+\d{4}\b|\b\d{1,2}[/-]\d{4}\b|\b\d{4}\b|\b(?:present|current)\b)/gi) ?? []
    return { startDate: dates[0] ?? '', endDate: dates[1] ?? '' }
  }

  private cleanValue(value: string) {
    return value.replace(/^[-*•▪\s]+/, '').trim()
  }
}