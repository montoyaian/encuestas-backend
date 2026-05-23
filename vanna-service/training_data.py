DDL_STATEMENTS = [
    """
    CREATE TYPE "public"."users_profile_enum" AS ENUM('administrativo', 'profesor', 'estudiante');
    """,
    """
    CREATE TYPE "public"."surveys_target_role_enum" AS ENUM('estudiante', 'profesor', 'administrativo', 'todos');
    """,
    """
    CREATE TABLE "users" (
      "id" SERIAL PRIMARY KEY,
      "email" character varying(255) NOT NULL UNIQUE,
      "password" character varying(255) NOT NULL,
      "fullName" character varying(255) NOT NULL,
      "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      "profile" "public"."users_profile_enum" NOT NULL
    );
    """,
    """
    CREATE TABLE "surveys" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "title" VARCHAR(255) NOT NULL,
      "description" TEXT,
      "target_role" "public"."surveys_target_role_enum" array NOT NULL,
      "creator_id" integer NOT NULL,
      "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "allow_multiple_responses" boolean NOT NULL DEFAULT false,
      CONSTRAINT "FK_surveys_creator_id" FOREIGN KEY ("creator_id") REFERENCES "users"("id")
    );
    """,
    """
    CREATE TABLE "survey_questions" (
      "id" SERIAL PRIMARY KEY,
      "text" TEXT NOT NULL,
      "type" VARCHAR(50) NOT NULL,
      "options" JSONB,
      "metadata" JSONB,
      "question_order" INTEGER NOT NULL,
      "survey_id" uuid NOT NULL,
      CONSTRAINT "FK_survey_questions_survey" FOREIGN KEY ("survey_id") REFERENCES "surveys"("id") ON DELETE CASCADE
    );
    """,
    """
    CREATE TABLE "responses" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "survey_id" uuid NOT NULL,
      "user_id" integer NOT NULL,
      "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT "FK_responses_survey_id" FOREIGN KEY ("survey_id") REFERENCES "surveys"("id") ON DELETE CASCADE,
      CONSTRAINT "FK_responses_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    );
    """,
    """
    CREATE TABLE "answers" (
      "id" SERIAL PRIMARY KEY,
      "response_id" uuid NOT NULL,
      "survey_question_id" integer NOT NULL,
      "value" jsonb NOT NULL,
      CONSTRAINT "FK_answers_response_id" FOREIGN KEY ("response_id") REFERENCES "responses"("id") ON DELETE CASCADE,
      CONSTRAINT "FK_answers_survey_question_id" FOREIGN KEY ("survey_question_id") REFERENCES "survey_questions"("id")
    );
    """,
]

DOCUMENTATION = [
    """
    The system is a survey platform. Users can create surveys, and other users can respond.
    Surveys are targeted by role. User roles: administrativo, profesor, estudiante.
    Surveys can also target 'todos' to be visible to all roles.
    """,
    """
    surveys: Each survey has title, description, creator_id, target_role[], created_at, and allow_multiple_responses.
    survey_questions: Each survey has multiple questions. Each question has text, type, options, metadata, and question_order.
    Question types: RADIO (single choice), SELECT (multiple selection), TEXT (free text).
    """,
    """
    responses: Each response belongs to a survey and a user.
    answers: Each answer belongs to a response and a survey question. The value is stored in jsonb.
    """,
    """
    Join relationships:
    surveys.id = survey_questions.survey_id
    surveys.id = responses.survey_id
    responses.id = answers.response_id
    survey_questions.id = answers.survey_question_id
    users.id = responses.user_id
    users.id = surveys.creator_id
    """,
    """
    IMPORTANT: All queries must be scoped to a single survey using survey_id.
    survey_questions.question_order indicates the position of the question within a survey.
    Use question_order (1 = first, 2 = second) or survey_questions.text to target a specific question.
    When querying answers for a question, join answers -> survey_questions and filter by survey_id.
    To get user names from a question, join answers -> responses -> users and select users."fullName".
    User age is not stored in users; infer it only from answers to a question about age.
    NOTE: users.fullName is a camelCase column and must be quoted as "fullName" in SQL.
    answers.value is jsonb; to parse numbers safely use (value #>> '{}')::int.
    """,
]

QUESTION_SQL_PAIRS = [
    {
        "question": "Cuantas respuestas tiene la encuesta?",
        "sql": "SELECT COUNT(*) AS total_responses FROM responses WHERE survey_id = '<survey_id>';",
    },
    {
        "question": "Cuantos usuarios distintos respondieron la encuesta?",
        "sql": "SELECT COUNT(DISTINCT r.user_id) AS total_users FROM responses r WHERE r.survey_id = '<survey_id>';",
    },
    {
        "question": "Cuantas respuestas hay por dia en la encuesta?",
        "sql": "SELECT DATE_TRUNC('day', r.created_at) AS day, COUNT(*) AS total FROM responses r WHERE r.survey_id = '<survey_id>' GROUP BY day ORDER BY day DESC;",
    },
    {
        "question": "Cuantas preguntas tiene la encuesta?",
        "sql": "SELECT COUNT(*) AS total_questions FROM survey_questions WHERE survey_id = '<survey_id>';",
    },
    {
        "question": "Cuales son las preguntas de la encuesta?",
        "sql": "SELECT id, text, type, question_order FROM survey_questions WHERE survey_id = '<survey_id>' ORDER BY question_order;",
    },
    {
        "question": "Cual es la primera pregunta de la encuesta?",
        "sql": "SELECT id, text, type, question_order FROM survey_questions WHERE survey_id = '<survey_id>' ORDER BY question_order LIMIT 1;",
    },
    {
        "question": "Cual es la ultima pregunta de la encuesta?",
        "sql": "SELECT id, text, type, question_order FROM survey_questions WHERE survey_id = '<survey_id>' ORDER BY question_order DESC LIMIT 1;",
    },
    {
        "question": "Que respondieron en la primera pregunta?",
        "sql": "SELECT a.value FROM answers a JOIN survey_questions q ON q.id = a.survey_question_id WHERE q.survey_id = '<survey_id>' AND q.question_order = 1;",
    },
    {
        "question": "Que respondieron en la pregunta 3?",
        "sql": "SELECT a.value FROM answers a JOIN survey_questions q ON q.id = a.survey_question_id WHERE q.survey_id = '<survey_id>' AND q.question_order = 3;",
    },
    {
        "question": "Cuantos usuarios seleccionaron cada opcion en la primera pregunta?",
        "sql": "SELECT a.value::text AS opcion, COUNT(DISTINCT r.user_id) AS usuarios FROM answers a JOIN survey_questions q ON q.id = a.survey_question_id JOIN responses r ON r.id = a.response_id WHERE q.survey_id = '<survey_id>' AND q.question_order = 1 GROUP BY a.value::text ORDER BY usuarios DESC;",
    },
    {
        "question": "Cual fue la opcion mas elegida en la segunda pregunta?",
        "sql": "SELECT a.value::text, COUNT(*) AS votos FROM answers a JOIN survey_questions q ON q.id = a.survey_question_id WHERE q.survey_id = '<survey_id>' AND q.question_order = 2 GROUP BY a.value::text ORDER BY votos DESC LIMIT 1;",
    },
    {
        "question": "Cuales son las respuestas de texto de la tercera pregunta?",
        "sql": "SELECT a.value::text AS respuesta, u.\"fullName\" FROM answers a JOIN survey_questions q ON q.id = a.survey_question_id JOIN responses r ON r.id = a.response_id JOIN users u ON u.id = r.user_id WHERE q.survey_id = '<survey_id>' AND q.question_order = 3 AND q.type = 'TEXT' ORDER BY a.id;",
    },
    {
        "question": "Que respondio cada usuario en la primera pregunta?",
        "sql": "SELECT u.\"fullName\", a.value FROM answers a JOIN survey_questions q ON q.id = a.survey_question_id JOIN responses r ON r.id = a.response_id JOIN users u ON u.id = r.user_id WHERE q.survey_id = '<survey_id>' AND q.question_order = 1 ORDER BY u.\"fullName\";",
    },
    {
        "question": "Que usuarios respondieron la primera pregunta?",
        "sql": "SELECT DISTINCT u.\"fullName\" FROM answers a JOIN survey_questions q ON q.id = a.survey_question_id JOIN responses r ON r.id = a.response_id JOIN users u ON u.id = r.user_id WHERE q.survey_id = '<survey_id>' AND q.question_order = 1 ORDER BY u.\"fullName\";",
    },
    {
        "question": "Que usuarios respondieron en la pregunta 2?",
        "sql": "SELECT DISTINCT u.\"fullName\" FROM answers a JOIN survey_questions q ON q.id = a.survey_question_id JOIN responses r ON r.id = a.response_id JOIN users u ON u.id = r.user_id WHERE q.survey_id = '<survey_id>' AND q.question_order = 2 ORDER BY u.\"fullName\";",
    },
    {
        "question": "Que usuarios respondieron a la pregunta de edad?",
        "sql": "SELECT DISTINCT u.\"fullName\" FROM answers a JOIN survey_questions q ON q.id = a.survey_question_id JOIN responses r ON r.id = a.response_id JOIN users u ON u.id = r.user_id WHERE q.survey_id = '<survey_id>' AND q.text ILIKE '%edad%' ORDER BY u.\"fullName\";",
    },
    {
        "question": "Que usuarios respondieron juegos en la primera pregunta?",
        "sql": "SELECT DISTINCT u.\"fullName\" FROM answers a JOIN survey_questions q ON q.id = a.survey_question_id JOIN responses r ON r.id = a.response_id JOIN users u ON u.id = r.user_id WHERE q.survey_id = '<survey_id>' AND q.question_order = 1 AND a.value::text = 'juegos' ORDER BY u.\"fullName\";",
    },
    {
        "question": "Que usuario tiene mas años segun la pregunta de edad?",
        "sql": "SELECT u.\"fullName\", (a.value #>> '{}')::int AS edad FROM answers a JOIN survey_questions q ON q.id = a.survey_question_id JOIN responses r ON r.id = a.response_id JOIN users u ON u.id = r.user_id WHERE q.survey_id = '<survey_id>' AND q.text ILIKE '%edad%' ORDER BY edad DESC LIMIT 1;",
    },
    {
        "question": "Cuales son los top 3 usuarios con mas años segun la pregunta de edad?",
        "sql": "SELECT u.\"fullName\", (a.value #>> '{}')::int AS edad FROM answers a JOIN survey_questions q ON q.id = a.survey_question_id JOIN responses r ON r.id = a.response_id JOIN users u ON u.id = r.user_id WHERE q.survey_id = '<survey_id>' AND q.text ILIKE '%edad%' ORDER BY edad DESC LIMIT 3;",
    },
    {
        "question": "Quien ha pasado mas tiempo jugando en la segunda pregunta?",
        "sql": "SELECT u.\"fullName\", (a.value #>> '{}')::int AS anos_jugando FROM answers a JOIN survey_questions q ON q.id = a.survey_question_id JOIN responses r ON r.id = a.response_id JOIN users u ON u.id = r.user_id WHERE q.survey_id = '<survey_id>' AND q.question_order = 2 ORDER BY anos_jugando DESC LIMIT 1;",
    },
    {
        "question": "Que perfiles respondieron la encuesta?",
        "sql": "SELECT DISTINCT u.profile FROM responses r JOIN users u ON u.id = r.user_id WHERE r.survey_id = '<survey_id>';",
    },
    {
        "question": "Cuantos usuarios de cada perfil respondieron la encuesta?",
        "sql": "SELECT u.profile, COUNT(DISTINCT r.user_id) AS total_users FROM responses r JOIN users u ON u.id = r.user_id WHERE r.survey_id = '<survey_id>' GROUP BY u.profile;",
    },
    {
        "question": "Cuantas respuestas por pregunta hay en la encuesta?",
        "sql": "SELECT q.text, q.type, COUNT(a.id) AS total_answers FROM survey_questions q LEFT JOIN answers a ON a.survey_question_id = q.id WHERE q.survey_id = '<survey_id>' GROUP BY q.id, q.text, q.type ORDER BY q.question_order;",
    },
    {
        "question": "Cual es la pregunta con mas respuestas en la encuesta?",
        "sql": "SELECT q.text, COUNT(a.id) AS total_answers FROM survey_questions q LEFT JOIN answers a ON a.survey_question_id = q.id WHERE q.survey_id = '<survey_id>' GROUP BY q.id, q.text ORDER BY total_answers DESC LIMIT 1;",
    },
    {
        "question": "Cual es la distribucion de respuestas para cada opcion en la encuesta?",
        "sql": "SELECT a.value::text AS opcion, COUNT(*) AS total FROM answers a JOIN survey_questions q ON q.id = a.survey_question_id WHERE q.survey_id = '<survey_id>' AND q.type IN ('RADIO', 'SELECT') GROUP BY a.value::text ORDER BY total DESC;",
    },
    {
        "question": "Que tipo de pregunta es la numero 2?",
        "sql": "SELECT text, type FROM survey_questions WHERE survey_id = '<survey_id>' AND question_order = 2;",
    },
    {
        "question": "En que fecha se respondio mas en la encuesta?",
        "sql": "SELECT DATE_TRUNC('day', r.created_at) AS day, COUNT(*) AS total FROM responses r WHERE r.survey_id = '<survey_id>' GROUP BY day ORDER BY total DESC LIMIT 1;",
    },
]
