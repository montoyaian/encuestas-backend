import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropUniqueAnswersResponseQuestion1773521000000 implements MigrationInterface {
  name = 'DropUniqueAnswersResponseQuestion1773521000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "answers" DROP CONSTRAINT IF EXISTS "UQ_answers_response_question"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "answers" ADD CONSTRAINT "UQ_answers_response_question" UNIQUE ("response_id", "survey_question_id")`,
    );
  }
}
