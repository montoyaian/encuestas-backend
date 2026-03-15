import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { StandardResponse } from 'src/common/standard-response';
import { SurveyQuestion } from 'src/surveys/entities/survey-question.entity';
import { Survey } from 'src/surveys/entities/survey.entity';
import { User } from 'src/users/entities/user.entity';
import { In, Repository } from 'typeorm';
import { CreateResponseDto } from './dto/response.dto';
import { Answer } from './entities/answer.entity';
import { Response } from './entities/response.entity';

@Injectable()
export class ResponsesService {
  constructor(
    @InjectRepository(Response)
    private readonly responseRepository: Repository<Response>,
    @InjectRepository(Answer)
    private readonly answerRepository: Repository<Answer>,
    @InjectRepository(Survey)
    private readonly surveyRepository: Repository<Survey>,
    @InjectRepository(SurveyQuestion)
    private readonly surveyQuestionRepository: Repository<SurveyQuestion>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(body: CreateResponseDto, userId: number) {
    const [survey, user] = await Promise.all([
      this.surveyRepository.findOne({ where: { id: body.surveyId }, select: ['id'] }),
      this.userRepository.findOne({ where: { id: userId }, select: ['id'] }),
    ]);

    if (!survey) {
      throw new NotFoundException('La encuesta no existe');
    }

    if (!user) {
      throw new NotFoundException('El usuario no existe');
    }

    const questionIds = body.answers.map((answer) => answer.surveyQuestionId);
    const uniqueQuestionIds = [...new Set(questionIds)];

    if (uniqueQuestionIds.length !== questionIds.length) {
      throw new BadRequestException('No se permiten preguntas duplicadas en la misma respuesta');
    }

    const surveyQuestions = await this.surveyQuestionRepository.find({
      where: {
        id: In(uniqueQuestionIds),
        survey: { id: body.surveyId },
      },
      select: ['id'],
      relations: ['survey'],
    });

    if (surveyQuestions.length !== uniqueQuestionIds.length) {
      throw new BadRequestException('Una o más preguntas no pertenecen a la encuesta indicada');
    }

    try {
      const responseId = await this.responseRepository.manager.transaction(async (manager) => {
        const transactionalResponseRepository = manager.getRepository(Response);
        const transactionalAnswerRepository = manager.getRepository(Answer);

        const response = transactionalResponseRepository.create({
          survey,
          user,
        });

        const savedResponse = await transactionalResponseRepository.save(response);

        const questionMap = new Map<number, SurveyQuestion>(
          surveyQuestions.map((question) => [question.id, question]),
        );

        const answers = body.answers.map((answer) =>
          transactionalAnswerRepository.create({
            response: savedResponse,
            surveyQuestion: questionMap.get(answer.surveyQuestionId),
            value: answer.value,
          }),
        );

        await transactionalAnswerRepository.save(answers);

        return savedResponse.id;
      });

      return new StandardResponse('Respuesta registrada exitosamente', {
        responseId,
      });
    } catch (error) {
      throw new BadRequestException(
        'Error al registrar la respuesta: ' + (error?.message || error),
      );
    }
  }

  async findMine(userId: number) {
    return this.responseRepository
      .createQueryBuilder('response')
      .leftJoinAndSelect('response.survey', 'survey')
      .leftJoinAndSelect('response.answers', 'answer')
      .leftJoinAndSelect('answer.surveyQuestion', 'surveyQuestion')
      .where('response.user_id = :userId', { userId })
      .orderBy('response.created_at', 'DESC')
      .addOrderBy('surveyQuestion.question_order', 'ASC')
      .getMany();
  }

  async findOneMine(id: string, userId: number) {
    const response = await this.responseRepository
      .createQueryBuilder('response')
      .leftJoinAndSelect('response.survey', 'survey')
      .leftJoinAndSelect('response.answers', 'answer')
      .leftJoinAndSelect('answer.surveyQuestion', 'surveyQuestion')
      .where('response.id = :id', { id })
      .andWhere('response.user_id = :userId', { userId })
      .orderBy('surveyQuestion.question_order', 'ASC')
      .getOne();

    if (!response) {
      throw new NotFoundException('Respuesta no encontrada');
    }

    return response;
  }

  async findBySurveyForCurrentUser(surveyId: string, userId: number) {
    return this.responseRepository
      .createQueryBuilder('response')
      .leftJoinAndSelect('response.answers', 'answer')
      .leftJoinAndSelect('answer.surveyQuestion', 'surveyQuestion')
      .where('response.survey_id = :surveyId', { surveyId })
      .andWhere('response.user_id = :userId', { userId })
      .orderBy('response.created_at', 'DESC')
      .addOrderBy('surveyQuestion.question_order', 'ASC')
      .getMany();
  }
}
