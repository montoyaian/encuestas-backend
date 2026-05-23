import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Payload } from '../auth/models/payload.model';
import type { Env } from '../env.model';
import { SurveysService } from '../surveys/surveys.service';

type VannaAskResponse = {
  question: string;
  sql?: string;
  answer?: string;
  data?: unknown[];
};

@Injectable()
export class AiAssistantService {
  private readonly baseUrl: string;

  constructor(
    private readonly configService: ConfigService<Env, true>,
    private readonly surveysService: SurveysService,
  ) {
    this.baseUrl =
      this.configService.get('VANNA_SERVICE_URL') ?? 'http://localhost:8000';
  }

  async askQuestion(
    question: string,
    surveyId: string,
    allowLlmToSeeData: boolean | undefined,
    user: Payload,
  ): Promise<VannaAskResponse> {
    try {
      await this.surveysService.findOneVisibleByProfile(surveyId, user.profile);

      const response = await fetch(`${this.baseUrl}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          survey_id: surveyId,
          allow_llm_to_see_data: allowLlmToSeeData ?? true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new InternalServerErrorException(
          `Vanna service error: ${response.status} ${errorText}`,
        );
      }

      return (await response.json()) as VannaAskResponse;
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'No se pudo obtener respuesta del asistente',
      );
    }
  }
}
