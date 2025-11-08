import asyncio
import os
import json
from openai import AsyncOpenAI
from agents import Agent, OpenAIChatCompletionsModel, Runner, function_tool, set_tracing_disabled, RunConfig
from dotenv import load_dotenv
from openai.types.responses import ResponseTextDeltaEvent
from pydantic import BaseModel, Field
from typing import List

 


load_dotenv()


OPENROUTER_API_KEY=os.getenv("OPENROUTER_API_KEY")

# set up open router client
external_client = AsyncOpenAI(api_key=OPENROUTER_API_KEY, base_url="https://openrouter.ai/api/v1")

# choose any open router model
model = OpenAIChatCompletionsModel(model="deepseek/deepseek-chat", openai_client=external_client)

# set up config
config = RunConfig(model=model, model_provider=external_client, tracing_disabled=True)

# Pydantic model for strict schema validation
class QuizQuestion(BaseModel):
    id: str = Field(description="Unique identifier for the question")
    question: str = Field(description="The question text")
    options: List[str] = Field(description="Array of exactly 4 answer choices", min_items=4, max_items=4)
    correctAnswer: int = Field(description="Index (0-3) of the correct answer option", ge=0, le=3)
    rationale: str = Field(description="Explanation of why the correct answer is correct")

# Function tool to enforce schema
@function_tool
def create_quiz_question(
    id: str,
    question: str,
    options: List[str],
    correctAnswer: int,
    rationale: str
) -> QuizQuestion:
    """Create a quiz question with the specified format.
    
    Args:
        id: Unique identifier for the question
        question: The question text
        options: Array of exactly 4 answer choices
        correctAnswer: Index (0-3) of the correct answer option
        rationale: Explanation of why the correct answer is correct
    """
    return QuizQuestion(
        id=id,
        question=question,
        options=options,
        correctAnswer=correctAnswer,
        rationale=rationale
    )

quiz_agent = Agent(
    name="Quiz generator",
    instructions="""You are a quiz generating assistant. When asked to generate questions, you must use the create_quiz_question function to return properly formatted questions. Generate exactly one multiple choice precalculus question with:
    - A unique ID
    - A clear question
    - Exactly 4 answer options
    - The correct answer index (0-3)
    - A rationale explaining why the answer is correct""",
    tools=[create_quiz_question]
)




async def generate_question() -> QuizQuestion:
    result = await Runner.run(
        quiz_agent,
        input="Generate a multiple choice precalculus question",
        run_config=config
    )
    print(result.final_output)
    return result.final_output



# if __name__ == "__main__":
#     asyncio.run(test_quiz_generation())