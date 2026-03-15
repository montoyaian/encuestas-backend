import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAllowMultipleResponsesToSurveys1773518000000 implements MigrationInterface {
  name = 'AddAllowMultipleResponsesToSurveys1773518000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "surveys"
      ADD COLUMN "allow_multiple_responses" boolean NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "surveys"
      DROP COLUMN "allow_multiple_responses"
    `);
  }
}
