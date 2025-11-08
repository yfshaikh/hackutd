"""
Question Retrieval Tool for LLM-based Tutoring System

This module provides the get_questions function that can be used as a tool by LLMs
to retrieve SAT questions from the database with hierarchical filtering.

Key Features:
- Hierarchical filtering: subtopic > topic > subject
- Supports both 'reading' and 'math' subjects
- Filter by difficulty (1-5), question type (MCQ/FRQ)
- Returns structured question data with complete metadata
- Respects parameter specificity (if subtopic is provided, only returns questions from that subtopic)

Usage Examples:
- get_questions(subject="math", limit=5) - Get 5 math questions
- get_questions(subject="reading", topic="Reading Comprehension", limit=3) - Get reading comprehension questions
- get_questions(subtopic="Linear Equations", difficulty=2) - Get easy linear equation questions
- get_questions(question_type="MCQ", difficulty=4) - Get hard multiple choice questions

The function is automatically registered as a tool for LLM use in the chat system.
""" 

import asyncio
import os
import json
from openai import AsyncOpenAI
from agents import Agent, OpenAIChatCompletionsModel, Runner, function_tool, set_tracing_disabled, RunConfig
from dotenv import load_dotenv
from openai.types.responses import ResponseTextDeltaEvent
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from utils.initialize_supabase import get_supabase_client
import logging

logger = logging.getLogger(__name__)

load_dotenv()

OPENROUTER_API_KEY=os.getenv("OPENROUTER_API_KEY")

# set up open router client
external_client = AsyncOpenAI(api_key=OPENROUTER_API_KEY, base_url="https://openrouter.ai/api/v1")

# choose any open router model
model = OpenAIChatCompletionsModel(model="deepseek/deepseek-chat", openai_client=external_client)

# set up config
config = RunConfig(model=model, model_provider=external_client, tracing_disabled=True)

class QuestionResponse(BaseModel):
    """Response model for question data"""
    id: str
    body: str
    answer_choices: Dict[str, str]
    correct_answer: str
    hints: List[str]
    rationale: str
    type: str
    subject_type: str
    tags: List[str]
    difficulty: int
    subject_name: Optional[str] = None
    topic_name: Optional[str] = None
    subtopic_name: Optional[str] = None

async def get_questions(
    subject: Optional[str] = None,
    topic: Optional[str] = None, 
    subtopic: Optional[str] = None,
    difficulty: Optional[int] = None,
    question_type: Optional[str] = None,
    limit: Optional[int] = 10
) -> List[Dict[str, Any]]:
    """
    Retrieve SAT questions from the database with hierarchical filtering.
    
    Args:
        subject: Filter by subject ('reading' or 'math'). If not provided, returns questions from all subjects.
        topic: Filter by topic name. If not provided, returns questions from all topics within the subject.
        subtopic: Filter by subtopic name. If provided, only returns questions from this specific subtopic (ignores broader topic).
        difficulty: Filter by difficulty level (1-5). If not provided, returns questions of all difficulties.
        question_type: Filter by question type ('MCQ' or 'FRQ'). If not provided, returns all question types.
        limit: Maximum number of questions to return (default: 10, max: 50).
        
    Returns:
        List of questions matching the specified criteria.
        
    Note: 
        - Filtering follows hierarchy: if subtopic is specified, only questions from that subtopic are returned
        - If only topic is specified, questions from all subtopics within that topic are returned
        - If only subject is specified, questions from all topics/subtopics within that subject are returned
    """
    try:
        # Validate and limit the number of questions
        if limit is None or limit <= 0:
            limit = 10
        elif limit > 50:
            limit = 50
            
        supabase = get_supabase_client()
        
        # Start building the query using the questions_with_hierarchy view
        query = supabase.table("questions_with_hierarchy").select("*")
        
        # Apply hierarchical filtering - most specific first
        if subtopic:
            # If subtopic is specified, filter by subtopic only (most specific)
            query = query.eq("subtopic_name", subtopic)
            logger.info(f"Filtering by subtopic: {subtopic}")
        elif topic:
            # If topic is specified but not subtopic, filter by topic
            query = query.eq("topic_name", topic)
            logger.info(f"Filtering by topic: {topic}")
        
        # Apply subject filter (can be combined with topic/subtopic)
        if subject:
            # For subject, we check both the subject_name and subject_type columns
            # subject_type is 'reading' or 'math', subject_name might be more descriptive
            if subject.lower() in ['reading', 'math']:
                query = query.eq("subject_type", subject.lower())
            else:
                query = query.ilike("subject_name", f"%{subject}%")
            logger.info(f"Filtering by subject: {subject}")
        
        # Apply additional filters
        if difficulty:
            query = query.eq("difficulty", difficulty)
            logger.info(f"Filtering by difficulty: {difficulty}")
            
        if question_type:
            query = query.eq("type", question_type.upper())
            logger.info(f"Filtering by question type: {question_type}")
        
        # Apply limit
        query = query.limit(limit)
        
        # Execute the query
        result = query.execute()
        
        if not result.data:
            logger.info("No questions found matching the specified criteria")
            return []
        
        questions = []
        for q in result.data:
            try:
                question_dict = {
                    "id": q["id"],
                    "body": q["body"],
                    "answer_choices": q["answer_choices"],
                    "correct_answer": q["correct_answer"],
                    "hints": q["hints"] or [],
                    "rationale": q["rationale"] or "",
                    "type": q["type"],
                    "subject_type": q["subject_type"],
                    "tags": q["tags"] or [],
                    "difficulty": q["difficulty"],
                    "subject_name": q.get("subject_name"),
                    "topic_name": q.get("topic_name"),
                    "subtopic_name": q.get("subtopic_name")
                }
                questions.append(question_dict)
            except Exception as e:
                logger.error(f"Error parsing question {q.get('id', 'unknown')}: {str(e)}")
                continue
        
        logger.info(f"Successfully retrieved {len(questions)} questions")
        return questions
        
    except Exception as e:
        logger.error(f"Error retrieving questions: {str(e)}")
        # Return empty list on error instead of raising exception for tool use
        return []

async def test_question_retrieval():
    """Test function to verify question retrieval works"""
    print("Testing question retrieval...")
    
    # Test 1: Get all questions (limited)
    print("\n1. Testing: Get all questions (limit 5)")
    questions = await get_questions(limit=5)
    print(f"Retrieved {len(questions)} questions")
    
    # Test 2: Get questions by subject
    print("\n2. Testing: Get math questions")
    math_questions = await get_questions(subject="math", limit=3)
    print(f"Retrieved {len(math_questions)} math questions")
    
    # Test 3: Get questions by difficulty
    print("\n3. Testing: Get difficulty 3 questions")
    difficult_questions = await get_questions(difficulty=3, limit=3)
    print(f"Retrieved {len(difficult_questions)} difficulty 3 questions")
    
    # Test 4: Get questions by type
    print("\n4. Testing: Get MCQ questions")
    mcq_questions = await get_questions(question_type="MCQ", limit=3)
    print(f"Retrieved {len(mcq_questions)} MCQ questions")
    
    if questions:
        print(f"\nSample question structure:")
        sample = questions[0]
        print(f"  ID: {sample['id']}")
        print(f"  Subject: {sample['subject_type']}")
        print(f"  Topic: {sample['topic_name']}")
        print(f"  Subtopic: {sample['subtopic_name']}")
        print(f"  Type: {sample['type']}")
        print(f"  Difficulty: {sample['difficulty']}")
        print(f"  Body (first 100 chars): {sample['body'][:100]}...")

if __name__ == "__main__":
    asyncio.run(test_question_retrieval())