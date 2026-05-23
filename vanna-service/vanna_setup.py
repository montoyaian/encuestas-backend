import json
import os
from typing import List

import boto3
from chromadb.utils import embedding_functions
from vanna.legacy.bedrock import Bedrock_Converse
from vanna.legacy.chromadb import ChromaDB_VectorStore


class BedrockTitanEmbeddingFunction(embedding_functions.EmbeddingFunction):
    def __init__(self, client, model_id: str):
        self.client = client
        self.model_id = model_id

    def __call__(self, input):
        if isinstance(input, str):
            texts = [input]
        else:
            texts = list(input)

        embeddings: List[List[float]] = []
        for text in texts:
            payload = json.dumps({"inputText": text})
            response = self.client.invoke_model(
                modelId=self.model_id,
                contentType="application/json",
                accept="application/json",
                body=payload,
            )
            result = json.loads(response["body"].read())
            embeddings.append(result["embedding"])
        return embeddings


class SurveyVanna(ChromaDB_VectorStore, Bedrock_Converse):
    def __init__(self):
        region = os.getenv("AWS_DEFAULT_REGION", "us-east-1")
        llm_model_id = os.getenv(
            "AWS_BEDROCK_LLM_MODEL_ID", "meta.llama3-1-8b-instruct-v1:0"
        )
        embeddings_model_id = os.getenv(
            "AWS_BEDROCK_EMBEDDINGS_MODEL_ID", "amazon.titan-embed-text-v2:0"
        )

        bedrock_runtime = boto3.client("bedrock-runtime", region_name=region)

        embedding_function = BedrockTitanEmbeddingFunction(
            client=bedrock_runtime, model_id=embeddings_model_id
        )

        ChromaDB_VectorStore.__init__(
            self,
            config={
                "path": os.getenv("CHROMA_PATH", ".chroma"),
                "embedding_function": embedding_function,
            },
        )

        Bedrock_Converse.__init__(
            self,
            client=bedrock_runtime,
            config={
                "modelId": llm_model_id,
                "temperature": float(os.getenv("LLM_TEMPERATURE", "0")),
                "max_tokens": int(os.getenv("LLM_MAX_TOKENS", "800")),
            },
        )


def build_vanna() -> SurveyVanna:
    vn = SurveyVanna()
    vn.language = "Spanish"
    vn.connect_to_postgres(
        host=os.getenv("POSTGRES_HOST"),
        dbname=os.getenv("POSTGRES_DB"),
        user=os.getenv("POSTGRES_USER"),
        password=os.getenv("POSTGRES_PASSWORD"),
        port=int(os.getenv("POSTGRES_PORT", "5432")),
        sslmode="require"
        if os.getenv("POSTGRES_SSL", "false").lower() == "true"
        else "prefer",
    )
    return vn
