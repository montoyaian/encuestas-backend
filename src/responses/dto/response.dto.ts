import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDefined,
  IsInt,
  IsNotEmpty,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateAnswerDto {
  @IsInt()
  @Min(1)
  surveyQuestionId: number;

  @IsDefined({ message: 'El valor de la respuesta es obligatorio' })
  value: unknown;
}

export class CreateResponseDto {
  @IsUUID()
  @IsNotEmpty()
  surveyId: string;

  @IsArray()
  @ArrayNotEmpty({ message: 'Debe enviar al menos una respuesta' })
  @ValidateNested({ each: true })
  @Type(() => CreateAnswerDto)
  answers: CreateAnswerDto[];
}
