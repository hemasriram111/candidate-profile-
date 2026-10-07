import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AuthModule } from './auth/auth.module'
import { CandidateModule } from './candidate/candidate.module'
import { PrismaModule } from './prisma/prisma.module'
import { UsersModule } from './users/users.module'
import { AppController } from './app.controller'
import { JobModule } from './jobs/job.module'
import { ApplicationModule } from './applications/application.module'
import { InterviewModule } from './interviews/interview.module'
import { OfferModule } from './offers/offer.module'
import { DemoModule } from './demo/demo.module'
import { ProjectsModule } from './projects/projects.module'
import { SapAssistantModule } from './sap-assistant/sap-assistant.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    PrismaModule,
    UsersModule,
    CandidateModule,
    AuthModule,
    JobModule,
    ApplicationModule,
    InterviewModule,
    OfferModule,
    DemoModule,
    ProjectsModule,
    SapAssistantModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
