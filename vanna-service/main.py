import os
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import psycopg2

from training_data import DDL_STATEMENTS, DOCUMENTATION, QUESTION_SQL_PAIRS
from vanna_setup import build_vanna

load_dotenv()

app = FastAPI(title="Vanna AI Survey Assistant", version="1.0.0")

vn = build_vanna()


class AskRequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=500)
    survey_id: str = Field(..., min_length=36, max_length=36)
    allow_llm_to_see_data: bool = False


class AskResponse(BaseModel):
    question: str
    sql: Optional[str] = None
    answer: Optional[str] = None
    data: Optional[List[Dict[str, Any]]] = None


def train_vanna(force: bool = False) -> Dict[str, int]:
    reset_training = os.getenv("RESET_TRAINING", "false").lower() == "true"

    if reset_training or force:
        vn.remove_collection("sql")
        vn.remove_collection("ddl")
        vn.remove_collection("documentation")
    else:
        existing = vn.get_training_data()
        if not existing.empty:
            return {
                "ddl": 0,
                "documentation": 0,
                "question_sql": 0,
            }

    for ddl in DDL_STATEMENTS:
        vn.add_ddl(ddl)

    for doc in DOCUMENTATION:
        vn.add_documentation(doc)

    for pair in QUESTION_SQL_PAIRS:
        vn.add_question_sql(pair["question"], pair["sql"])

    return {
        "ddl": len(DDL_STATEMENTS),
        "documentation": len(DOCUMENTATION),
        "question_sql": len(QUESTION_SQL_PAIRS),
    }


@app.on_event("startup")
def on_startup():
    if os.getenv("AUTO_TRAIN", "true").lower() == "true":
        train_vanna()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/train")
def train(force: bool = False):
    try:
        counts = train_vanna(force=force)
        return {"status": "ok", "trained": counts}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


def get_survey_context(survey_id: str) -> Dict[str, str]:
    conn = psycopg2.connect(
        host=os.getenv("POSTGRES_HOST"),
        dbname=os.getenv("POSTGRES_DB"),
        user=os.getenv("POSTGRES_USER"),
        password=os.getenv("POSTGRES_PASSWORD"),
        port=int(os.getenv("POSTGRES_PORT", "5432")),
        sslmode="require"
        if os.getenv("POSTGRES_SSL", "false").lower() == "true"
        else "prefer",
    )
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT title FROM surveys WHERE id = %s", (survey_id,))
            survey = cur.fetchone()

            if not survey:
                raise HTTPException(status_code=404, detail="Encuesta no encontrada")

            cur.execute(
                """
                SELECT text, type, question_order
                FROM survey_questions
                WHERE survey_id = %s
                ORDER BY question_order
                """,
                (survey_id,),
            )
            questions = cur.fetchall()
    finally:
        conn.close()

    questions_text = "\n".join(
        f"{index + 1}. [{row[1]}] {row[0]}" for index, row in enumerate(questions)
    )

    return {"title": survey[0], "questions_text": questions_text}


def apply_survey_id(sql: str, survey_id: str) -> str:
    return (
        sql.replace("'<survey_id>'", f"'{survey_id}'")
        .replace('"<survey_id>"', f'"{survey_id}"')
        .replace("<survey_id>", survey_id)
    )


@app.post("/ask", response_model=AskResponse)
def ask(request: AskRequest):
    try:
        survey_context = get_survey_context(request.survey_id)
        vn.config["initial_prompt"] = (
            "Eres un experto en SQL para una plataforma de encuestas. "
            f"Estas consultando la encuesta '{survey_context['title']}' "
            f"(ID: {request.survey_id}).\n"
            "Preguntas de la encuesta:\n"
            f"{survey_context['questions_text']}\n\n"
            "IMPORTANTE: Todas las consultas deben filtrar por survey_id = "
            f"'{request.survey_id}'. No consultes datos de otras encuestas."
        )

        original_run_sql = vn.run_sql

        def run_sql_with_scope(sql: str):
            return original_run_sql(apply_survey_id(sql, request.survey_id))

        vn.run_sql = run_sql_with_scope

        try:
            sql = vn.generate_sql(
                request.question, allow_llm_to_see_data=request.allow_llm_to_see_data
            )
        finally:
            vn.run_sql = original_run_sql

        sql = apply_survey_id(sql, request.survey_id)

        if not vn.is_sql_valid(sql):
            return AskResponse(question=request.question, sql=sql)

        if request.survey_id not in sql:
            raise HTTPException(
                status_code=400,
                detail="La consulta generada no esta limitada a la encuesta indicada.",
            )

        df = vn.run_sql(sql)
        data = [] if df is None else df.to_dict(orient="records")
        answer = vn.generate_summary(request.question, df) if df is not None else None

        return AskResponse(
            question=request.question,
            sql=sql,
            answer=answer,
            data=data,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
