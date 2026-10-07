import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { AuthSessionModule } from '../auth/auth-session.module'
import { DemoController } from './demo.controller'
import { DemoService } from './demo.service'

@Module({
  imports: [PrismaModule, AuthSessionModule],
  controllers: [DemoController],
  providers: [DemoService],
  exports: [DemoService],
})
export class DemoModule {}
