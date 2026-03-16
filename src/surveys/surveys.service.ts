import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StandardResponse } from 'src/common/standard-response';
import { Response } from 'src/responses/entities/response.entity';
import { User } from 'src/users/entities/user.entity';
import { ProfileEnum } from 'src/users/entities/profileEnum';
import { CreateSurveyDto, UpdateSurveyDto } from './dto/surveydto';
import { Survey } from './entities/survey.entity';
import { TargetRoleEnum } from './entities/target-role.enum';
import { SurveyQuestion } from './entities/survey-question.entity';

@Injectable()
export class SurveysService {
  constructor(
    @InjectRepository(Survey)
    private readonly surveyRepository: Repository<Survey>,
    @InjectRepository(SurveyQuestion)
    private readonly questionRepository: Repository<SurveyQuestion>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Response)
    private readonly responseRepository: Repository<Response>,
  ) {}

  async findAllVisibleByProfile(profile: ProfileEnum, userId: number) {
    const visibleRoles = this.getVisibleRoles(profile);
    const surveys = await this.surveyRepository
      .createQueryBuilder('survey')
      .leftJoinAndSelect('survey.creator', 'creator')
      .leftJoinAndSelect('survey.questions', 'question')
      .select([
        'survey.id',
        'survey.title',
        'survey.description',
        'survey.targetRole',
        'survey.createdAt',
      ])
      .where(
        'survey.targetRole && ARRAY[:...visibleRoles]::surveys_target_role_enum[]',
        { visibleRoles },
      )
      .andWhere(
        `(
          survey.allowMultipleResponses = true
          OR NOT EXISTS (
            SELECT 1
            FROM responses response
            WHERE response.survey_id = survey.id
              AND response.user_id = :userId
          )
        )`,
        { userId },
      )
      .orderBy('survey.createdAt', 'DESC')
      .addOrderBy('question.questionOrder', 'ASC')
      .getMany();

    return surveys;
  }


  async findByUserId(userId: number) {
    const surveys = await this.surveyRepository
      .createQueryBuilder('survey')
      .leftJoinAndSelect('survey.creator', 'creator')
      .leftJoinAndSelect('survey.questions', 'question')
      .select([
        'survey.id',
        'survey.title',
        'survey.description',
        'survey.targetRole',
        'survey.createdAt'
      ])
      .where('creator.id = :userId', { userId })
      .orderBy('survey.createdAt', 'DESC')
      .addOrderBy('question.questionOrder', 'ASC')
      .getMany();
    return surveys;
  }
      


  async findOneVisibleByProfile(id: string, profile: ProfileEnum) {
    const visibleRoles = this.getVisibleRoles(profile);
    const survey = await this.surveyRepository
      .createQueryBuilder('survey')
      .leftJoinAndSelect('survey.creator', 'creator')
      .leftJoinAndSelect('survey.questions', 'question')
      .select([
        'survey.id',
        'survey.title',
        'survey.description',
        'survey.allowMultipleResponses',
        'survey.targetRole',
        'survey.createdAt',
        'creator.id',
        'creator.fullName',
        'question.id',
        'question.text',
        'question.type',
        'question.options',
        'question.metadata',
        'question.questionOrder',
      ])
      .where('survey.id = :id', { id })
      .addOrderBy('question.questionOrder', 'ASC')
      .getOne();

    if (!survey) {
      throw new NotFoundException('Encuesta no encontrada');
    }

    return survey;
  }

  async findOneWithQuestionsOrFail(id: string) {
    const survey = await this.surveyRepository
      .createQueryBuilder('survey')
      .leftJoinAndSelect('survey.questions', 'question')
      .select([
        'survey.id',
        'question.id',
        'question.text',
        'question.type',
        'question.options',
        'question.questionOrder',
      ])
      .where('survey.id = :id', { id })
      .orderBy('question.questionOrder', 'ASC')
      .getOne();

    if (!survey) {
      throw new NotFoundException('Encuesta no encontrada');
    }

    return survey;
  }

  async create(body: CreateSurveyDto, creatorId: number) {
    const creator = await this.userRepository.findOne({
      where: { id: creatorId },
      select: ['id'],
    });

    if (!creator) {
      throw new BadRequestException('El usuario creador no existe');
    }

    try {
      await this.surveyRepository.manager.transaction(async (manager) => {
        const transactionalSurveyRepository = manager.getRepository(Survey);
        const transactionalQuestionRepository = manager.getRepository(SurveyQuestion);

        const newSurvey = transactionalSurveyRepository.create({
          title: body.title,
          description: body.description,
          targetRole: body.targetRole,
          allowMultipleResponses: body.allowMultipleResponses ?? false,
          creator,
        });

        const savedSurvey = await transactionalSurveyRepository.save(newSurvey);

        const questions = body.questions.map((question, index) =>
          transactionalQuestionRepository.create({
            text: question.text,
            type: question.type,
            options: question.options,
            metadata: question.metadata,
            questionOrder: index + 1,
            survey: savedSurvey,
          }),
        );

        await transactionalQuestionRepository.save(questions);
      });
      return new StandardResponse('Encuesta creada exitosamente');
    } catch (error) {
      throw new BadRequestException('Error al crear la encuesta: ' + (error?.message || error));
    }
  }

  async update(id: string, body: UpdateSurveyDto) {
    const survey = await this.surveyRepository.findOne({ where: { id } });
    if (!survey) {
      throw new NotFoundException('Encuesta no encontrada');
    }

    if (body.questions) {
      const existingResponse = await this.responseRepository
        .createQueryBuilder('response')
        .select('1')
        .where('response.survey_id = :surveyId', { surveyId: id })
        .limit(1)
        .getRawOne();

      if (existingResponse) {
        throw new BadRequestException(
          'No se pueden modificar las preguntas porque la encuesta ya tiene respuestas registradas',
        );
      }
    }

    this.surveyRepository.merge(survey, {
      title: body.title,
      description: body.description,
      targetRole: body.targetRole,
      allowMultipleResponses: body.allowMultipleResponses,
    });

    try {
      await this.surveyRepository.manager.transaction(async (manager) => {
        const transactionalSurveyRepository = manager.getRepository(Survey);
        const transactionalQuestionRepository = manager.getRepository(SurveyQuestion);

        await transactionalSurveyRepository.save(survey);

        if (body.questions) {
          const existingQuestions = await transactionalQuestionRepository.find({
            where: { survey: { id } },
            select: ['id'],
            relations: ['survey'],
          });

          const existingIds = new Set(existingQuestions.map((question) => question.id));
          const incomingIds = body.questions
            .map((question) => question.id)
            .filter((questionId): questionId is number => typeof questionId === 'number');

          const uniqueIncomingIds = new Set(incomingIds);
          if (uniqueIncomingIds.size !== incomingIds.length) {
            throw new BadRequestException('No se permiten IDs de pregunta duplicados en la actualización');
          }

          for (const questionId of incomingIds) {
            if (!existingIds.has(questionId)) {
              throw new BadRequestException(
                `La pregunta con id ${questionId} no pertenece a esta encuesta`,
              );
            }
          }

          const idsToDelete = existingQuestions
            .map((question) => question.id)
            .filter((existingId) => !uniqueIncomingIds.has(existingId));

          if (idsToDelete.length > 0) {
            await transactionalQuestionRepository
              .createQueryBuilder()
              .delete()
              .from(SurveyQuestion)
              .where('survey_id = :surveyId', { surveyId: id })
              .andWhere('id IN (:...idsToDelete)', { idsToDelete })
              .execute();
          }

          const questionsToSave = body.questions.map((question, index) =>
            transactionalQuestionRepository.create({
              id: question.id,
              text: question.text,
              type: question.type,
              options: question.options,
              metadata: question.metadata,
              questionOrder: index + 1,
              survey,
            }),
          );

          await transactionalQuestionRepository.save(questionsToSave);
        }
      });

      return new StandardResponse('Encuesta actualizada exitosamente');
    } catch (error) {
      throw new BadRequestException('Error al actualizar la encuesta: ' + (error?.message || error));
    }
  }

  async remove(id: string) {
    const survey = await this.surveyRepository.findOne({ where: { id } });
    if (!survey) {
      throw new NotFoundException('Encuesta no encontrada');
    }
    try {
      await this.surveyRepository.manager.transaction(async (manager) => {
        await manager
          .createQueryBuilder()
          .delete()
          .from('answers')
          .where(
            `response_id IN (
              SELECT id
              FROM responses
              WHERE survey_id = :surveyId
            )`,
            { surveyId: id },
          )
          .orWhere(
            `survey_question_id IN (
              SELECT id
              FROM survey_questions
              WHERE survey_id = :surveyId
            )`,
            { surveyId: id },
          )
          .execute();

        await manager
          .createQueryBuilder()
          .delete()
          .from(Response)
          .where('survey_id = :surveyId', { surveyId: id })
          .execute();

        await manager.remove(survey);
      });

      return new StandardResponse('Encuesta eliminada exitosamente');
    } catch (error) {
      throw new BadRequestException('Error al eliminar la encuesta: ' + (error?.message || error));
    }
  }

  private getVisibleRoles(profile: ProfileEnum): TargetRoleEnum[] {
    const roleMap: Record<ProfileEnum, TargetRoleEnum> = {
      [ProfileEnum.ADMINISTRATIVO]: TargetRoleEnum.ADMINISTRATIVO,
      [ProfileEnum.PROFESOR]: TargetRoleEnum.PROFESOR,
      [ProfileEnum.ESTUDIANTE]: TargetRoleEnum.ESTUDIANTE,
    };

    return [TargetRoleEnum.TODOS, roleMap[profile]];
  }
}
