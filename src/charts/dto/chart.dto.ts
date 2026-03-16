export type SupportedQuestionType = 'RADIO' | 'MULTIPLE_SELECTION' | 'TEXT';

export interface PieChartDataDto {
  chartType: 'pie';
  labels: string[];
  values: number[];
  totalResponses: number;
}

export interface BarChartDataDto {
  chartType: 'bar';
  labels: string[];
  values: number[];
  totalSelections: number;
}

export interface TextFeedChartDataDto {
  chartType: 'feed';
  values: string[];
  totalResponses: number;
}

export type ChartDataDto = PieChartDataDto | BarChartDataDto | TextFeedChartDataDto;

export interface ChartQuestionDto {
  questionId: number;
  title: string;
  type: string;
  chartData: ChartDataDto;
}

export interface SurveyChartsResponseDto {
  surveyId: string;
  questions: ChartQuestionDto[];
}