import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class AskQuestionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  question: string;

  @IsUUID()
  @IsNotEmpty()
  surveyId: string;

  @IsOptional()
  @IsBoolean()
  allowLlmToSeeData?: boolean;
}
