import asyncio
import os
import json
import tempfile
from typing import Optional, Dict, Any
from dotenv import load_dotenv
import logging

from .agents.sat_question_crew import generate_sat_question
from .agents.single_agent_question_generator import generate_question_single_agent
from .dspy_question_generator import generate_question_dspy

logger = logging.getLogger(__name__)
load_dotenv()

async def generate_question_from_request(request_data: Dict[str, Any], user_message: Optional[str] = None, use_single_agent: bool = False, use_dspy: bool = True):
    """
    Generate a SAT question using DSPy, single-agent, or multi-agent CrewAI approach.
    
    Args:
        request_data: Dictionary containing the SATQuestionGenerateRequest data
        user_message: Optional message from the user with specific instructions
        use_single_agent: If True, use single-agent approach
        use_dspy: If True, use DSPy structured output approach (recommended)
    
    Returns:
        Generated SAT question in the specified format
    """
    
    subject = request_data.get('subject', 'math')
    question_type = request_data.get('type', 'mcq') 
    topic = request_data.get('topic', '')
    subtopic = request_data.get('subtopic', '')
    difficulty = request_data.get('difficulty', 'medium')
    sample_question = request_data.get('sample_question', {})
    
    # Log the request details
    logger.info("\033[96m" + "=" * 20 + " SAT QUESTION GENERATION REQUEST " + "=" * 20 + "\033[0m")
    logger.info(f"\033[96mSubject: {subject}, Type: {question_type}, Topic: {topic}, Subtopic: {subtopic}, Difficulty: {difficulty}\033[0m")
    if sample_question:
        logger.info(f"\033[96mSample Question Provided: {sample_question.get('question', '')[:100]}...\033[0m")
    if user_message:
        logger.info(f"\033[96mUser Instructions: {user_message}\033[0m")
    logger.info("\033[96m" + "=" * 75 + "\033[0m")
    
    try:
        if use_dspy:
            # Generate question using DSPy structured output (recommended)
            logger.info("Starting SAT question generation with DSPy structured output...")
            question_data = await generate_question_dspy(request_data, user_message)
            logger.info("Successfully generated SAT question with DSPy")
        elif use_single_agent:
            # Generate question using single agent with text parsing
            logger.info("Starting SAT question generation with single agent...")
            question_data = await generate_question_single_agent(request_data, user_message)
            logger.info("Successfully generated SAT question with single agent")
        else:
            # Generate question using multi-agent CrewAI (fallback)
            logger.info("Starting SAT question generation with multi-agent CrewAI...")
            question_data = generate_sat_question(
                subject=subject,
                question_type=question_type,
                topic=topic,
                subtopic=subtopic,
                difficulty=difficulty,
                sample_question=sample_question,
                user_message=user_message
            )
            logger.info("Successfully generated SAT question with multi-agent CrewAI")
        logger.info("\033[96m" + "=" * 20 + " GENERATED QUESTION " + "=" * 20 + "\033[0m")
        logger.info(f"\033[96m{json.dumps(question_data, indent=2)}\033[0m")
        logger.info("\033[96m" + "=" * 65 + "\033[0m")
 
        return question_data
        
    except Exception as e:
        if use_dspy:
            approach_name = "DSPy structured output"
        elif use_single_agent:
            approach_name = "single-agent"
        else:
            approach_name = "multi-agent CrewAI"
        logger.error(f"Error in {approach_name} question generation: {e}")
        return create_fallback_question(subject, question_type, topic, subtopic, difficulty)

def create_fallback_question(subject, question_type, topic, subtopic, difficulty):
    """Create a fallback question when agent crew generation fails"""
    
    fallback = {
        "id": f"fallback-crew-{hash(f'{subject}-{topic}-{subtopic}') % 1000000}",
        "question": f"Sample {subject} {question_type.upper()} question for {subtopic} (Agent crew temporarily unavailable)",
        "correct_answer": "Sample answer",
        "explanation": "This is a placeholder question. The agent crew is temporarily unavailable. Please try generating again or contact support if the issue persists.",
        "hints": ["This is a placeholder hint", "Try the question generation again", "Contact support if issues persist"],
        "tags": [subtopic.lower().replace(' ', '_')],
        "topic_name": topic or "General",
        "subtopic_name": subtopic or None,
        "difficulty": difficulty.capitalize(),
        "subject": subject,
        "type": question_type.upper(),
        "topic": topic,
        "subtopic": subtopic,
        "has_latex": subject == "math",
        "has_diagram": False,
        "diagram_url": None,
        "irt_difficulty": 0.0,
        "irt_discrimination": 1.0,
        "irt_guessing": 0.25 if question_type.upper() == "MCQ" else 0.0,
        "generated": True,
        "crew_generated": False,
        "single_agent_generated": False,
        "dspy_generated": False,
        "fallback": True
    }
    
    if question_type.lower() == 'mcq':
        fallback["choices"] = [
            "A. Sample choice 1",
            "B. Sample choice 2",
            "C. Sample choice 3 (correct)",
            "D. Sample choice 4"
        ]
        fallback["correct_answer"] = "C"
    else:
        fallback["choices"] = []
    
    return fallback
