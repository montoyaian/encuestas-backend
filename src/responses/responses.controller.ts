import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { Payload } from 'src/auth/models/payload.model';
import { CreateResponseDto } from './dto/response.dto';
import { ResponsesService } from './responses.service';

@Controller('responses')
@UseGuards(AuthGuard('jwt'))
export class ResponsesController {
  constructor(private readonly responsesService: ResponsesService) {}

  @Post()
  createResponse(@Body() body: CreateResponseDto, @CurrentUser() user: Payload) {
    return this.responsesService.create(body, user.sub);
  }

  @Get('me')
  getMyResponses(@CurrentUser() user: Payload) {
    return this.responsesService.findMine(user.sub);
  }

  @Get(':id')
  getMyResponseById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: Payload,
  ) {
    return this.responsesService.findOneMine(id, user.sub);
  }

  @Get('survey/:surveyId')
  getResponsesBySurvey(
    @Param('surveyId', ParseUUIDPipe) surveyId: string,
    @CurrentUser() user: Payload,
  ) {
    return this.responsesService.findBySurveyForCurrentUser(surveyId, user.sub);
  }
}
