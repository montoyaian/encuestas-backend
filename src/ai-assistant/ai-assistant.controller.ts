import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { Payload } from '../auth/models/payload.model';
import { StandardResponse } from '../common/standard-response';
import { AiAssistantService } from './ai-assistant.service';
import { AskQuestionDto } from './dto/ask-question.dto';

@Controller('ai-assistant')
@UseGuards(AuthGuard('jwt'))
export class AiAssistantController {
  constructor(private readonly aiAssistantService: AiAssistantService) {}

  @Post('ask')
  async askQuestion(
    @Body() body: AskQuestionDto,
    @CurrentUser() user: Payload,
  ) {
    const result = await this.aiAssistantService.askQuestion(
      body.question,
      body.surveyId,
      body.allowLlmToSeeData,
      user,
    );
    return new StandardResponse('Pregunta respondida', result);
  }
}
