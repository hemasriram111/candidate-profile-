export type FaqItem = {
  id: string
  question: string
  answer: string
}

export const mockFAQs: FaqItem[] = [
  {
    id: 'faq-1',
    question: 'How does Clyptus work?',
    answer:
      'Clyptus helps candidates discover relevant roles, create a strong professional profile, and track opportunities through a simpler and more tailored job-search experience.',
  },
  {
    id: 'faq-2',
    question: 'Is Clyptus free for candidates?',
    answer:
      'Yes. The candidate experience is designed to be free to use while helping you discover opportunities and keep your career journey organised.',
  },
  {
    id: 'faq-3',
    question: 'How do I apply for a job?',
    answer:
      'Browse roles, review fit, and use the application flow for the specific job listing. The platform is designed to make applications easier to follow and manage.',
  },
  {
    id: 'faq-4',
    question: 'Can I upload my resume?',
    answer:
      'Yes. Candidates can keep their resume, experience and skills in one place so opportunities can be matched more accurately.',
  },
  {
    id: 'faq-5',
    question: 'Can I track my applications?',
    answer:
      'Yes. The platform is designed to help candidates stay on top of every application and understand where they stand.',
  },
  {
    id: 'faq-6',
    question: 'How do job recommendations work?',
    answer:
      'Recommendations are based on your profile, skills, goals and role preferences so you can discover opportunities that are relevant and timely.',
  },
]
