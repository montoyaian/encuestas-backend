import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateResponsesAndAnswers1773515000000 implements MigrationInterface {
  name = 'CreateResponsesAndAnswers1773515000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "responses" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "survey_id" uuid NOT NULL,
        "user_id" integer NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_responses_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_responses_survey_id" FOREIGN KEY ("survey_id") REFERENCES "surveys"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_responses_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_responses_survey_id" ON "responses" ("survey_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_responses_user_id" ON "responses" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_responses_created_at" ON "responses" ("created_at")
    `);

    await queryRunner.query(`
      CREATE TABLE "answers" (
        "id" SERIAL NOT NULL,
        "response_id" uuid NOT NULL,
        "survey_question_id" integer NOT NULL,
        "value" jsonb NOT NULL,
        CONSTRAINT "PK_answers_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_answers_response_question" UNIQUE ("response_id", "survey_question_id"),
        CONSTRAINT "FK_answers_response_id" FOREIGN KEY ("response_id") REFERENCES "responses"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_answers_survey_question_id" FOREIGN KEY ("survey_question_id") REFERENCES "survey_questions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_answers_response_id" ON "answers" ("response_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_answers_survey_question_id" ON "answers" ("survey_question_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_answers_survey_question_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_answers_response_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "answers"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_responses_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_responses_user_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_responses_survey_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "responses"`);
  }
}
