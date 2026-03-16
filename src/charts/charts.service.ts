import { Injectable } from '@nestjs/common';
import { AnswersService } from 'src/responses/answers.service';
import { SurveysService } from 'src/surveys/surveys.service';
import { Answer } from 'src/responses/entities/answer.entity';
import { SurveyQuestion } from 'src/surveys/entities/survey-question.entity';
import {
  BarChartDataDto,
  ChartQuestionDto,
  PieChartDataDto,
  SupportedQuestionType,
  SurveyChartsResponseDto,
  TextFeedChartDataDto,
} from './dto/chart.dto';

@Injectable()
export class ChartsService {
  constructor(
    private readonly surveysService: SurveysService,
    private readonly answersService: AnswersService,
  ) {}

  async getSurveyCharts(surveyId: string): Promise<SurveyChartsResponseDto> {
    const [survey, answers] = await Promise.all([
      this.surveysService.findOneWithQuestionsOrFail(surveyId),
      this.answersService.findBySurveyId(surveyId),
    ]);

    const questions = survey.questions.map((question) => {
      const questionAnswers = answers.filter(
        (answer) => answer.surveyQuestion?.id === question.id,
      );

      return this.mapQuestionToChart(question, questionAnswers);
    });

    return {
      surveyId,
      questions,
    };
  }

  private mapQuestionToChart(
    question: SurveyQuestion,
    answers: Answer[],
  ): ChartQuestionDto {
    const normalizedType = this.normalizeQuestionType(question.type);

    if (normalizedType === 'RADIO') {
      return {
        questionId: question.id,
        title: question.text,
        type: normalizedType,
        chartData: this.buildPieData(answers),
      };
    }

    if (normalizedType === 'MULTIPLE_SELECTION') {
      return {
        questionId: question.id,
        title: question.text,
        type: normalizedType,
        chartData: this.buildBarData(answers),
      };
    }

    return {
      questionId: question.id,
      title: question.text,
      type: normalizedType,
      chartData: this.buildTextData(answers),
    };
  }

  private buildPieData(answers: Answer[]): PieChartDataDto {
    const frequency = new Map<string, number>();

    for (const answer of answers) {
      if (!this.isPrimitive(answer.value)) {
        continue;
      }

      const option = String(answer.value);
      frequency.set(option, (frequency.get(option) ?? 0) + 1);
    }

    const labels = Array.from(frequency.keys());
    const values = Array.from(frequency.values());

    return {
      chartType: 'pie',
      labels,
      values,
      totalResponses: values.reduce((total, current) => total + current, 0),
    };
  }

  private buildBarData(answers: Answer[]): BarChartDataDto {
    const frequency = new Map<string, number>();

    for (const answer of answers) {
      const values = Array.isArray(answer.value) ? answer.value : [answer.value];

      for (const value of values) {
        if (!this.isPrimitive(value)) {
          continue;
        }

        const option = String(value);
        frequency.set(option, (frequency.get(option) ?? 0) + 1);
      }
    }

    const labels = Array.from(frequency.keys());
    const values = Array.from(frequency.values());

    return {
      chartType: 'bar',
      labels,
      values,
      totalSelections: values.reduce((total, current) => total + current, 0),
    };
  }

  private buildTextData(answers: Answer[]): TextFeedChartDataDto {
    const values = answers
      .map((answer) => answer.value)
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .filter((value): value is string => typeof value === 'string');

    return {
      chartType: 'feed',
      values,
      totalResponses: values.length,
    };
  }

  private normalizeQuestionType(type: string): SupportedQuestionType {
    const upper = type.toUpperCase();
    if (upper === 'RADIO') {
      return 'RADIO';
    }
    if (upper === 'SELECT') {
      return 'MULTIPLE_SELECTION';
    }
    return 'TEXT';
  }

  private isPrimitive(value: unknown): value is string | number | boolean {
    return (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    );
  }
}