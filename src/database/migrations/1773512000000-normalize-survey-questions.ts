import { MigrationInterface, QueryRunner } from 'typeorm';

export class NormalizeSurveyQuestions1773512000000 implements MigrationInterface {
  name = 'NormalizeSurveyQuestions1773512000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Elimina las tablas si existen
    await queryRunner.query(`DROP TABLE IF EXISTS "survey_questions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "surveys"`);

    // Elimina el enum si existe para recrearlo limpio
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."surveys_target_role_enum"`);

    await queryRunner.query(`
      CREATE TYPE "public"."surveys_target_role_enum" AS ENUM('estudiante', 'profesor', 'administrativo', 'todos')
    `);

    // Crea la tabla surveys
    await queryRunner.query(`
      CREATE TABLE "surveys" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "title" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "target_role" "public"."surveys_target_role_enum" array NOT NULL,
        "creator_id" integer NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "FK_surveys_creator_id" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_surveys_target_role" ON "surveys" USING GIN ("target_role")`);
    await queryRunner.query(`CREATE INDEX "idx_surveys_target_role_created_at" ON "surveys" ("created_at")`);

    // Crea la tabla survey_questions
    await queryRunner.query(`
      CREATE TABLE "survey_questions" (
        "id" SERIAL PRIMARY KEY,
        "text" TEXT NOT NULL,
        "type" VARCHAR(50) NOT NULL,
        "options" JSONB,
        "metadata" JSONB,
        "question_order" INTEGER NOT NULL,
        "survey_id" uuid NOT NULL,
        CONSTRAINT "FK_survey_questions_survey" FOREIGN KEY ("survey_id") REFERENCES "surveys"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_survey_questions_survey_id" ON "survey_questions" ("survey_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_survey_questions_survey_id_order" ON "survey_questions" ("survey_id", "question_order")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "survey_questions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "surveys"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."surveys_target_role_enum"`);
  }
}
