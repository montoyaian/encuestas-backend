import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { TargetRoleEnum } from '../entities/target-role.enum';

export class SurveyQuestionDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  id?: number;

  @IsString()
  @IsNotEmpty()
  text: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsOptional()
  @IsArray()
  options?: string[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class CreateSurveyDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsArray()
  @ArrayNotEmpty({ message: 'Debe enviar al menos una pregunta' })
  @ValidateNested({ each: true })
  @Type(() => SurveyQuestionDto)
  questions: SurveyQuestionDto[];

  @IsArray()
  @ArrayNotEmpty({ message: 'Debe especificar al menos un targetRole' })
  @IsEnum(TargetRoleEnum, {
    each: true,
    message: 'Cada targetRole debe ser uno de: estudiante, profesor, administrativo, todos',
  })
  targetRole: TargetRoleEnum[];

  @IsOptional()
  @IsBoolean()
  allowMultipleResponses?: boolean;

}

export class UpdateSurveyDto extends PartialType(CreateSurveyDto) {}
