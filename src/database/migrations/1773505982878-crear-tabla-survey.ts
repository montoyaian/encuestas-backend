import { MigrationInterface, QueryRunner } from "typeorm";

export class CrearTablaSurvey1773505982878 implements MigrationInterface {
    name = 'CrearTablaSurvey1773505982878'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."surveys_target_role_enum" AS ENUM('estudiante', 'profesor', 'administrativo', 'todos')`);
        await queryRunner.query(`CREATE TABLE "surveys" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(255) NOT NULL, "description" text NOT NULL, "questions" jsonb NOT NULL, "target_role" "public"."surveys_target_role_enum" array NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "creator_id" integer NOT NULL, CONSTRAINT "PK_1b5e3d4aaeb2321ffa98498c971" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "surveys" ADD CONSTRAINT "FK_8cc6ba83ca5945cc13529d3aa3c" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "surveys" DROP CONSTRAINT "FK_8cc6ba83ca5945cc13529d3aa3c"`);
        await queryRunner.query(`DROP TABLE "surveys"`);
        await queryRunner.query(`DROP TYPE "public"."surveys_target_role_enum"`);
    }

}
