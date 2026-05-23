import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SurveysModule } from '../surveys/surveys.module';
import { AiAssistantController } from './ai-assistant.controller';
import { AiAssistantService } from './ai-assistant.service';

@Module({
  imports: [ConfigModule, SurveysModule],
  controllers: [AiAssistantController],
  providers: [AiAssistantService],
})
export class AiAssistantModule {}
