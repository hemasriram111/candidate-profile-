export type LoginForm = {
  email: string
  password: string
  rememberMe: boolean
}

export type RegisterForm = {
  fullName: string
  email: string
  password: string
  confirmPassword: string
  termsAccepted: boolean
}

export type ForgotPasswordForm = {
  email: string
}

export type ContactForm = {
  name: string
  email: string
  subject: string
  message: string
}
