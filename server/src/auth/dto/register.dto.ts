import { IsEmail, IsNotEmpty, MinLength, Matches, ValidateIf } from 'class-validator'

export class RegisterDto {
  @IsNotEmpty({ message: 'Full name is required.' })
  fullName!: string

  @IsNotEmpty({ message: 'Email is required.' })
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  email!: string

  @IsNotEmpty({ message: 'Password is required.' })
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  password!: string

  @IsNotEmpty({ message: 'Please confirm your password.' })
  confirmPassword!: string
}
