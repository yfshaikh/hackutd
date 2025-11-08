import os
import json
from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task
from crewai.agents.agent_builder.base_agent import BaseAgent
from crewai.llm import LLM
from typing import List, Dict, Any
from dotenv import load_dotenv
import logging

logger = logging.getLogger(__name__)
load_dotenv()

# Set up API keys
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Configure LLM based on available API keys
if OPENROUTER_API_KEY:
    llm = LLM(
        model="anthropic/claude-3.7-sonnet:thinking",
        api_key=OPENROUTER_API_KEY,
        base_url="https://openrouter.ai/api/",
        temperature=0.7
    )
    model_info = "OpenRouter Claude 3.7 Sonnet"
elif GEMINI_API_KEY:
    llm = LLM(
        model="gemini/gemini-2.0-flash",
        api_key=GEMINI_API_KEY,
        temperature=0.7
    )
    model_info = "Gemini 2.0 Flash"
else:
    llm = LLM(
        model="gpt-4o-mini",
        api_key=OPENAI_API_KEY,
        temperature=0.7
    )
    model_info = "OpenAI GPT-4o-mini"

@CrewBase
class SATQuestionGenerationCrew():
    """SAT Question Generation crew with four specialized agents"""

    agents: List[BaseAgent]
    tasks: List[Task]

    @agent
    def question_generator(self) -> Agent:
        return Agent(
            config=self.agents_config['question_generator'],
            verbose=True,
            llm=llm,
            allow_delegation=False,
            max_iter=3,
            memory=True
        )

    @agent
    def validation_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['validation_agent'],
            verbose=True,
            llm=llm,
            allow_delegation=False,
            max_iter=3,
            memory=True
        )

    @agent
    def answer_verifier(self) -> Agent:
        return Agent(
            config=self.agents_config['answer_verifier'],
            verbose=True,
            llm=llm,
            allow_delegation=False,
            max_iter=3,
            memory=True
        )

    @agent
    def question_compiler(self) -> Agent:
        return Agent(
            config=self.agents_config['question_compiler'],
            verbose=True,
            llm=llm,
            allow_delegation=False,
            max_iter=3,
            memory=True
        )

    @task
    def generate_question_task(self) -> Task:
        return Task(
            config=self.tasks_config['generate_question_task'],
            agent=self.question_generator()
        )

    @task
    def validate_question_task(self) -> Task:
        return Task(
            config=self.tasks_config['validate_question_task'],
            agent=self.validation_agent()
        )

    @task
    def verify_answer_task(self) -> Task:
        return Task(
            config=self.tasks_config['verify_answer_task'],
            agent=self.answer_verifier()
        )

    @task
    def compile_final_question_task(self) -> Task:
        return Task(
            config=self.tasks_config['compile_final_question_task'],
            agent=self.question_compiler()
        )

    @crew
    def crew(self) -> Crew:
        """Creates the SAT Question Generation crew"""
        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            process=Process.sequential,
            verbose=True,
            memory=True,
            full_output=True
        )

    # def _log_agent_step(self, step):
    #     """Log agent thinking and decision process"""
    #     logger.info(f"\033[94m[AGENT THINKING] {step.get('agent', 'Unknown')}: {step.get('action', 'No action')}\033[0m")
    #     if step.get('thought'):
    #         logger.info(f"\033[96m[THOUGHT] {step['thought']}\033[0m")
    #     if step.get('observation'):
    #         logger.info(f"\033[93m[OBSERVATION] {step['observation']}\033[0m")

    # def _log_crew_step(self, step):
    #     """Log overall crew progress"""
    #     logger.info(f"\033[95m[CREW PROGRESS] {step}\033[0m")

def generate_sat_question(
    subject: str,
    question_type: str,
    topic: str,
    subtopic: str,
    difficulty: str,
    sample_question: Dict[str, Any] = None,
    user_message: str = None
) -> Dict[str, Any]:
    """
    Generate a SAT question using the CrewAI crew
    
    Args:
        subject: The subject (e.g., "math")
        question_type: Type of question ("mcq" or "frq")
        topic: Main topic
        subtopic: Specific subtopic
        difficulty: Difficulty level ("easy", "medium", "hard")
        sample_question: Optional sample question for reference
        user_message: Optional user-specific instructions
    
    Returns:
        Generated SAT question as a dictionary
    """
    logger.info(f"Generating SAT question with CrewAI using {model_info}")
    
    # Prepare sample question context
    sample_question_context = ""
    if sample_question:
        sample_question_context = f"""
SAMPLE QUESTION FOR REFERENCE:
Question: {sample_question.get('question', '')}
"""
        if sample_question.get('choices') and question_type.lower() == 'mcq':
            choices_text = '\n'.join([f"  {choice}" for choice in sample_question.get('choices', [])[:4]])
            sample_question_context += f"""
Sample Answer Choices:
{choices_text}
"""
        sample_question_context += f"""
Sample Correct Answer: {sample_question.get('correct_answer', '')}
Sample Explanation: {sample_question.get('explanation', '')}
"""
    
    # Prepare user instructions
    user_instructions = ""
    if user_message:
        user_instructions = f"""
USER SPECIFIC INSTRUCTIONS:
{user_message}
"""
    
    # Prepare inputs for the crew
    inputs = {
        'subject': subject,
        'question_type': question_type,
        'topic': topic,
        'subtopic': subtopic,
        'difficulty': difficulty,
        'sample_question_context': sample_question_context,
        'user_instructions': user_instructions
    }
    
    try:
        # Run the crew
        crew_instance = SATQuestionGenerationCrew()
        result = crew_instance.crew().kickoff(inputs=inputs)
        
        # Extract and parse the final output
        if hasattr(result, 'raw'):
            final_output = result.raw
        elif hasattr(result, 'output'):
            final_output = result.output
        else:
            final_output = str(result)
        
        # Clean and parse JSON
        final_output = final_output.strip()
        
        # Try to extract JSON from the response if it's embedded in text
        if not final_output.startswith('{'):
            import re
            json_match = re.search(r'\{.*\}', final_output, re.DOTALL)
            if json_match:
                final_output = json_match.group(0)
        
        # Parse the JSON response
        question_data = json.loads(final_output)
        
        # Add metadata
        question_data["id"] = f"crew-generated-{hash(final_output) % 1000000}"
        question_data["generated"] = True
        question_data["crew_generated"] = True
        
        # Ensure required fields
        required_fields = ["question", "correct_answer", "explanation", "difficulty", "subject", "type", "topic", "subtopic"]
        for field in required_fields:
            if field not in question_data:
                logger.warning(f"Missing required field: {field}")
                question_data[field] = inputs.get(field, "Unknown")
        
        # Ensure has_latex is set for math questions
        if subject == "math":
            question_data["has_latex"] = True
        
        logger.info("Successfully generated SAT question with CrewAI")
        return question_data
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse CrewAI JSON: {e}")
        logger.error(f"Raw output: {final_output}")
        raise Exception(f"CrewAI generated invalid JSON: {e}")
    
    except Exception as e:
        logger.error(f"Error in CrewAI question generation: {e}")
        raise Exception(f"CrewAI generation failed: {e}") 