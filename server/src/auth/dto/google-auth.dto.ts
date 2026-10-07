import { IsNotEmpty } from 'class-validator'

export class GoogleAuthDto {
  @IsNotEmpty({ message: 'Google credential is required.' })
  credential!: string
}
