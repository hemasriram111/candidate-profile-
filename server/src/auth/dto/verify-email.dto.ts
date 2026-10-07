import { IsEmail, IsNotEmpty, Matches } from 'class-validator'

export class VerifyEmailDto {
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  email!: string

  @IsNotEmpty({ message: 'Verification code is required.' })
  @Matches(/^\d{6}$/, { message: 'Verification code must be 6 digits.' })
  otp!: string
}