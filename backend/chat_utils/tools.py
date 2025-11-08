import requests
import json
from .archive.quiz import generate_question
from .archive.question import get_questions
from .generate_question import generate_question_from_request

def get_current_weather(latitude, longitude):
    # Format the URL with proper parameter substitution
    url = f"https://api.open-meteo.com/v1/forecast?latitude={latitude}&longitude={longitude}&current=temperature_2m&hourly=temperature_2m&daily=sunrise,sunset&timezone=auto"

    try:
        # Make the API call
        response = requests.get(url)

        # Raise an exception for bad status codes
        response.raise_for_status()

        # Return the JSON response
        return response.json()

    except requests.RequestException as e:
        # Handle any errors that occur during the request
        print(f"Error fetching weather data: {e}")
        return None


async def generate_quiz():
    result = await generate_question()
    return result

async def generate_question(request_data, user_message=None):
    """
    Generate a SAT question based on an SATQuestionGenerateRequest object.
    
    Args:
        request_data: Dictionary containing the SATQuestionGenerateRequest data
        user_message: Optional message from the user with specific instructions
    
    Returns:
        Generated SAT question
    """
    return await generate_question_from_request(request_data, user_message)

async def generate_sat_question(subject, question_type, topic, subtopic, sample_question=None):
    """
    Generate a SAT-style question based on the provided parameters.
    
    Args:
        subject: 'math' or 'reading'
        question_type: 'mcq' or 'frq'
        topic: The main topic (e.g., 'Algebra', 'Information and Ideas')
        subtopic: The specific subtopic
        sample_question: Optional sample question to base the generation on
    
    Returns:
        Generated SAT question in the specified format
    """
    
    # Create a prompt based on the parameters
    prompt_parts = [
        f"Generate a {subject.upper()} SAT-style {question_type.upper()} question.",
        f"Topic: {topic}",
        f"Subtopic: {subtopic}",
    ]
    
    if sample_question:
        prompt_parts.extend([
            "\nUse this sample question as a reference for style and difficulty:",
            f"Sample: {sample_question.get('text', '')}",
            f"Sample Answer: {sample_question.get('correct_answer', '')}",
            f"Sample Rationale: {sample_question.get('rationale', '')}"
        ])
    
    if question_type.lower() == 'mcq':
        prompt_parts.append("\nProvide 4 answer choices (A, B, C, D) and indicate the correct answer.")
    else:
        prompt_parts.append("\nProvide a clear answer and step-by-step solution.")
    
    prompt_parts.extend([
        "\nReturn the response in JSON format with the following structure:",
        "{",
        '  "question": "The question text",',
        '  "answerChoices": ["A. choice1", "B. choice2", "C. choice3", "D. choice4"], // Only for MCQ',
        '  "correctAnswer": "The correct answer",',
        '  "rationale": "Detailed explanation of the solution",',
        '  "difficulty": "easy|medium|hard",',
        '  "subject": "' + subject + '",',
        '  "type": "' + question_type + '",',
        '  "topic": "' + topic + '",',
        '  "subtopic": "' + subtopic + '"',
        "}"
    ])
    
    full_prompt = "\n".join(prompt_parts)
    
    # For now, return a mock response structure
    # In a real implementation, you would call an AI service here
    mock_response = {
        "question": f"Sample {subject} {question_type.upper()} question for {subtopic}",
        "correctAnswer": "Sample answer",
        "rationale": "This is a sample generated question for demonstration purposes.",
        "difficulty": "medium",
        "subject": subject,
        "type": question_type,
        "topic": topic,
        "subtopic": subtopic,
        "generated": True,
        "prompt_used": full_prompt  # Include for debugging
    }
    
    if question_type.lower() == 'mcq':
        mock_response["answerChoices"] = [
            "A. Sample choice 1",
            "B. Sample choice 2", 
            "C. Sample choice 3",
            "D. Sample choice 4"
        ]
    
    return mock_response

# Tool schema definitions
TOOL_SCHEMAS = {
    "get_current_weather": {
        "name": "get_current_weather",
        "description": "Get the current weather at a location",
        "parameters": {
            "type": "object",
            "properties": {
                "latitude": {
                    "type": "number",
                    "description": "The latitude of the location",
                },
                "longitude": {
                    "type": "number",
                    "description": "The longitude of the location",
                },
            },
            "required": ["latitude", "longitude"],
        },
    },
    "generate_quiz": {
        "name": "generate_quiz",
        "description": "Generate a quiz",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
    "get_questions": {
        "name": "get_questions",
        "description": "Retrieve SAT questions from the database with hierarchical filtering. Use this tool to find questions for tutoring sessions or practice.",
        "parameters": {
            "type": "object",
            "properties": {
                "subject": {
                    "type": "string",
                    "description": "Filter by subject ('reading' or 'math'). If not provided, returns questions from all subjects.",
                    "enum": ["reading", "math"]
                },
                "topic": {
                    "type": "string",
                    "description": "Filter by topic name (e.g., 'Algebra', 'Geometry', 'Reading Comprehension'). If not provided, returns questions from all topics within the subject."
                },
                "subtopic": {
                    "type": "string",
                    "description": "Filter by subtopic name. If provided, only returns questions from this specific subtopic (ignores broader topic filter)."
                },
                "difficulty": {
                    "type": "integer",
                    "description": "Filter by difficulty level (1-5, where 1 is easiest and 5 is hardest). If not provided, returns questions of all difficulties.",
                    "minimum": 1,
                    "maximum": 5
                },
                "question_type": {
                    "type": "string",
                    "description": "Filter by question type ('MCQ' for multiple choice or 'FRQ' for free response). If not provided, returns all question types.",
                    "enum": ["MCQ", "FRQ"]
                },
                "limit": {
                    "type": "integer",
                    "description": "Maximum number of questions to return (default: 10, maximum: 50).",
                    "minimum": 1,
                    "maximum": 50,
                    "default": 10
                }
            },
            "required": [],
        },
    },
    "generate_sat_question": {
        "name": "generate_sat_question",
        "description": "Generate a SAT-style question based on specified parameters. Use this tool when a user requests a new SAT question to be created.",
        "parameters": {
            "type": "object",
            "properties": {
                "subject": {
                    "type": "string",
                    "description": "The subject area for the question",
                    "enum": ["math", "reading"]
                },
                "question_type": {
                    "type": "string",
                    "description": "The type of question to generate",
                    "enum": ["mcq", "frq"]
                },
                "topic": {
                    "type": "string",
                    "description": "The main topic for the question (e.g., 'Algebra', 'Information and Ideas')"
                },
                "subtopic": {
                    "type": "string",
                    "description": "The specific subtopic for the question"
                },
                "sample_question": {
                    "type": "object",
                    "description": "Optional sample question to use as a reference",
                    "properties": {
                        "id": {"type": "string"},
                        "question": {"type": "string"},
                        "topic_name": {"type": "string"},
                        "subtopic_name": {"type": "string"},
                        "difficulty": {
                            "type": "string",
                            "enum": ["Easy", "Medium", "Hard"]
                        },
                        "type": {
                            "type": "string",
                            "enum": ["MCQ", "FRQ"]
                        },
                        "choices": {
                            "type": "array",
                            "items": {"type": "string"}
                        },
                        "correct_answer": {"type": "string"},
                        "explanation": {"type": "string"},
                        "has_latex": {"type": "boolean"},
                        "has_diagram": {"type": "boolean"}
                    }
                }
            }, 
            "required": ["subject", "question_type", "topic", "subtopic"],
        },
    },
    "generate_question": {
        "name": "generate_question",
        "description": "Generate a SAT question based on a complete SATQuestionGenerateRequest configuration. Use this tool when you have a full configuration object with sample question reference.",
        "parameters": {
            "type": "object",
            "properties": {
                "request_data": {
                    "type": "object",
                    "description": "The complete SATQuestionGenerateRequest configuration",
                    "properties": {
                        "subject": {
                            "type": "string",
                            "enum": ["math", "reading"]
                        },
                        "type": {
                            "type": "string",
                            "enum": ["mcq", "frq"]
                        },
                        "topic": {"type": "string"},
                        "subtopic": {"type": "string"},
                        "difficulty": {
                            "type": "string",
                            "enum": ["easy", "medium", "hard"]
                        },
                        "sample_question": {
                            "type": "object",
                            "properties": {
                                "id": {"type": "string"},
                                "question": {"type": "string"},
                                "topic_name": {"type": "string"},
                                "subtopic_name": {"type": "string"},
                                "difficulty": {
                                    "type": "string",
                                    "enum": ["Easy", "Medium", "Hard"]
                                },
                                "type": {
                                    "type": "string",
                                    "enum": ["MCQ", "FRQ"]
                                },
                                "choices": {
                                    "type": "array",
                                    "items": {"type": "string"}
                                },
                                "correct_answer": {"type": "string"},
                                "explanation": {"type": "string"},
                                "has_latex": {"type": "boolean"},
                                "has_diagram": {"type": "boolean"}
                            }
                        }
                    },
                    "required": ["subject", "type", "topic", "subtopic", "difficulty", "sample_question"]
                },
                "user_message": {
                    "type": "string",
                    "description": "Optional message from the user with specific instructions"
                }
            },
            "required": ["request_data"]
        }
    }
}

def get_openai_tools_config(tool_names=None):
    """
    Generate OpenAI tools configuration from tool schemas.
    
    Args:
        tool_names: List of tool names to include. If None, includes all available tools.
    
    Returns:
        List of OpenAI tool configurations
    """
    if tool_names is None:
        tool_names = list(TOOL_SCHEMAS.keys())
    
    tools = []
    for tool_name in tool_names:
        if tool_name in TOOL_SCHEMAS:
            tools.append({
                "type": "function",
                "function": TOOL_SCHEMAS[tool_name]
            })
    
    return tools