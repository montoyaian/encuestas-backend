
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
  IsEnum
} from 'class-validator';
import { OmitType, PartialType } from '@nestjs/mapped-types';
import { ProfileEnum } from '../entities/profileEnum';

export class CreateUserDto {

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsEnum(ProfileEnum, { message: 'profile debe ser uno de: administrativo, profesor, estudiante' })
  profile: ProfileEnum;

}

export class UpdateUserDto extends PartialType(OmitType(CreateUserDto, ['password'] as const)) {}

