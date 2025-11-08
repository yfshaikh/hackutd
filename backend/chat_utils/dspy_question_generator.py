import os
import json
import logging
from typing import Dict, Any, Optional, List
import dspy
from pydantic import BaseModel, Field
from dotenv import load_dotenv

logger = logging.getLogger(__name__)
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

lm = dspy.LM("openai/gpt-4o", api_key=OPENAI_API_KEY, temperature=0.9)
dspy.configure(lm=lm)
logger.info("Configured DSPy with OpenAI gpt-5")

class SATQuestionOutput(BaseModel):
    """Pydantic model defining the exact structure of SAT question output"""
    original_question: str = Field(description="The provided original question")
    original_correct_answer: str = Field(description="The provided original correct answer")
    original_rationale: str = Field(description="The provided original rationale")
    new_question: str = Field(description="The newly generated SAT question with LaTeX formatting")
    answer_choices: Optional[List[str]] = Field(description="Four answer choices for MCQ (A, B, C, D)", default=None)
    correct_answer: str = Field(description="The correct answer (letter for MCQ, number for FRQ)")
    rationale: str = Field(description="Explanation of why the correct answer is right and wrong answers are wrong")
    hints: List[str] = Field(description="Up to 3 sequential hints", max_items=3)
    tags: List[str] = Field(description="2-4 relevant topic tags", max_items=4)
    topic_name: str = Field(description="Main topic name for this question")
    subtopic_name: Optional[str] = Field(description="Subtopic name if applicable", default=None)
    difficulty: str = Field(description="Question difficulty: Easy, Medium, or Hard")
    has_diagram: bool = Field(description="Whether this question requires a diagram", default=False)
    diagram_description: Optional[str] = Field(description="Description of diagram if has_diagram is True", default=None)
    irt_difficulty: float = Field(description="IRT difficulty parameter (typically -3 to 3, where higher is more difficult)")
    irt_discrimination: float = Field(description="IRT discrimination parameter (typically 0.5 to 2.5, where higher means more discriminating)")
    irt_guessing: float = Field(description="IRT guessing parameter for MCQ (typically 0.1 to 0.3, around 0.25 for 4-choice)", default=0.25)

class SATQuestionGenerationSignature(dspy.Signature):
    """DSPy signature for generating structured SAT questions"""
    
    original_question: str = dspy.InputField(desc="The original SAT question to base the new question on")
    original_correct_answer: str = dspy.InputField(desc="The correct answer to the original question")
    original_rationale: str = dspy.InputField(desc="The rationale/explanation for the original question")
    question_type: str = dspy.InputField(desc="Question type: MCQ or FRQ")
    topic: str = dspy.InputField(desc="Main topic for the question")
    subtopic: str = dspy.InputField(desc="Subtopic for the question")
    difficulty_level: str = dspy.InputField(desc="Target difficulty level: Easy, Medium, or Hard")
    additional_instructions: str = dspy.InputField(desc="Optional additional instructions from user")
    
    # Output fields with detailed descriptions
    new_question: str = dspy.OutputField(desc="A structurally similar but legally distinct SAT question with proper LaTeX formatting using $ signs. Must preserve the exact same solving method, mathematical operations, and step sequence as the original. Change ALL numbers, variables, and contexts while maintaining pedagogical equivalence.")
    
    answer_choices: str = dspy.OutputField(desc="For MCQ only: Four answer choices in format 'A. choice1|B. choice2|C. choice3|D. choice4' with exactly one correct answer and plausible distractors representing common student mistakes. Leave empty for FRQ.")
    
    correct_answer: str = dspy.OutputField(desc="The correct answer: letter (A/B/C/D) for MCQ or numerical value for FRQ")
    
    rationale: str = dspy.OutputField(desc="One paragraph explanation that mirrors the reasoning and mathematical technique used in the original. For MCQ, explain why the correct answer is right and each incorrect choice is wrong. Include any tricks, steps, or pitfalls.")
    
    hints: str = dspy.OutputField(desc="Exactly 3 sequential hints that guide toward the solution without giving it away, separated by '|'. Format: 'hint1|hint2|hint3'")
    
    tags: str = dspy.OutputField(desc="2-4 relevant topic tags for organizing skills and topics, separated by '|'. Format: 'tag1|tag2|tag3'")
    
    topic_name: str = dspy.OutputField(desc="Main topic name for this question (e.g., 'Algebra', 'Geometry', 'Functions')")
    
    subtopic_name: str = dspy.OutputField(desc="Subtopic name if applicable (e.g., 'Linear Equations', 'Quadratic Functions'). Leave empty if not applicable.")
    
    difficulty: str = dspy.OutputField(desc="Question difficulty level: Easy, Medium, or Hard based on complexity and required steps")
    
    has_diagram: str = dspy.OutputField(desc="'true' if this question would benefit from or require a diagram, 'false' otherwise")
    
    diagram_description: str = dspy.OutputField(desc="If has_diagram is true, provide a brief description of what diagram would be helpful. Leave empty if has_diagram is false.")
    
    irt_difficulty: str = dspy.OutputField(desc="IRT difficulty parameter as a decimal number between -3 and 3, where -3 is very easy, 0 is average, and 3 is very hard")
    
    irt_discrimination: str = dspy.OutputField(desc="IRT discrimination parameter as a decimal number between 0.5 and 2.5, where higher values mean the question better distinguishes between high and low ability students")
    
    irt_guessing: str = dspy.OutputField(desc="IRT guessing parameter as a decimal number between 0.1 and 0.3 for MCQ (around 0.25 for 4 choices), or 0.0 for FRQ")

class SATQuestionGenerator(dspy.Module):
    """DSPy module for generating SAT questions with structured output"""
    
    def __init__(self):
        super().__init__()
        self.generate_question = dspy.ChainOfThought(SATQuestionGenerationSignature)
        # Fallback for non-structured output models
        self.generate_text = dspy.ChainOfThought("original_question, original_correct_answer, original_rationale, question_type, topic, subtopic, difficulty_level, additional_instructions -> response")
    
    def forward(self, original_question: str, original_correct_answer: str, original_rationale: str, 
                question_type: str = "MCQ", topic: str = "", subtopic: str = "", 
                difficulty_level: str = "Medium", additional_instructions: str = ""):
        """Generate a structured SAT question with fallback"""
        
        # Add the comprehensive system instructions
        system_instructions = """
You are an expert SAT question generator and psychometrician. Create structurally similar but commercially usable SAT questions that preserve logic and mathematical reasoning while changing numbers and variables.

CRITICAL REQUIREMENTS:
1. STRUCTURAL SIMILARITY: Preserve EXACT same solving method, mathematical operations, and step sequence
2. CONTENT ORIGINALITY: Change ALL numbers, variables, expressions. Use different wording to avoid copyright issues
3. MATHEMATICAL ACCURACY: Verify all calculations. For MCQ, ensure exactly one correct answer with realistic distractors
4. LATEX FORMATTING: Wrap ALL math expressions in $ signs. Use π instead of /pi. No spaces in expressions ($3x+5=1$)
5. QUESTION TYPE MATCHING: If original is MCQ, generate MCQ. If FRQ, generate FRQ.
6. IRT PARAMETERS: Provide realistic Item Response Theory parameters based on question complexity and discrimination ability
7. TOPIC CLASSIFICATION: Accurately classify the main topic and subtopic
8. DIAGRAM ASSESSMENT: Determine if the question would benefit from a visual diagram

The new question must be pedagogically equivalent but legally distinct from the original.
"""
        
        full_instructions = system_instructions + "\n" + additional_instructions
        
        try:
            # Try structured output first
            result = self.generate_question(
                original_question=original_question,
                original_correct_answer=original_correct_answer,
                original_rationale=original_rationale,
                question_type=question_type,
                topic=topic,
                subtopic=subtopic,
                difficulty_level=difficulty_level,
                additional_instructions=full_instructions
            )
            return result
        except Exception as e:
            logger.warning(f"Structured output failed, falling back to text generation: {e}")
            
            # Fallback to text generation with manual parsing
            text_prompt = f"""
{full_instructions}

Original Question: {original_question}
Original Correct Answer: {original_correct_answer}
Original Rationale: {original_rationale}
Question Type: {question_type}
Topic: {topic}
Subtopic: {subtopic}
Difficulty Level: {difficulty_level}

Please generate a new SAT question following the format:

NEW_QUESTION: [new question with LaTeX formatting]
ANSWER_CHOICES: [A. choice1|B. choice2|C. choice3|D. choice4] (for MCQ only)
CORRECT_ANSWER: [letter or number]
RATIONALE: [explanation]
HINTS: [hint1|hint2|hint3]
TAGS: [tag1|tag2|tag3]
TOPIC_NAME: [main topic name]
SUBTOPIC_NAME: [subtopic name or empty]
DIFFICULTY: [Easy/Medium/Hard]
HAS_DIAGRAM: [true/false]
DIAGRAM_DESCRIPTION: [description or empty]
IRT_DIFFICULTY: [number between -3 and 3]
IRT_DISCRIMINATION: [number between 0.5 and 2.5]
IRT_GUESSING: [number between 0.0 and 0.3]
"""
            
            text_result = self.generate_text(
                original_question=original_question,
                original_correct_answer=original_correct_answer,
                original_rationale=original_rationale,
                question_type=question_type,
                topic=topic,
                subtopic=subtopic,
                difficulty_level=difficulty_level,
                additional_instructions=text_prompt
            )
            
            return self._parse_text_result(text_result.response, question_type)
    
    def _parse_text_result(self, text_response: str, question_type: str):
        """Parse fallback text response into structured format"""
        
        # Create a mock result object with parsed content
        class MockResult:
            def __init__(self):
                self.new_question = ""
                self.answer_choices = ""
                self.correct_answer = ""
                self.rationale = ""
                self.hints = ""
                self.tags = ""
                self.topic_name = ""
                self.subtopic_name = ""
                self.difficulty = "Medium"
                self.has_diagram = "false"
                self.diagram_description = ""
                self.irt_difficulty = "0.0"
                self.irt_discrimination = "1.0"
                self.irt_guessing = "0.25" if question_type.upper() == "MCQ" else "0.0"
        
        result = MockResult()
        
        # Parse the text response
        lines = text_response.split('\n')
        for line in lines:
            line = line.strip()
            if line.startswith('NEW_QUESTION:'):
                result.new_question = line.replace('NEW_QUESTION:', '').strip()
            elif line.startswith('ANSWER_CHOICES:'):
                result.answer_choices = line.replace('ANSWER_CHOICES:', '').strip()
            elif line.startswith('CORRECT_ANSWER:'):
                result.correct_answer = line.replace('CORRECT_ANSWER:', '').strip()
            elif line.startswith('RATIONALE:'):
                result.rationale = line.replace('RATIONALE:', '').strip()
            elif line.startswith('HINTS:'):
                result.hints = line.replace('HINTS:', '').strip()
            elif line.startswith('TAGS:'):
                result.tags = line.replace('TAGS:', '').strip()
            elif line.startswith('TOPIC_NAME:'):
                result.topic_name = line.replace('TOPIC_NAME:', '').strip()
            elif line.startswith('SUBTOPIC_NAME:'):
                result.subtopic_name = line.replace('SUBTOPIC_NAME:', '').strip()
            elif line.startswith('DIFFICULTY:'):
                result.difficulty = line.replace('DIFFICULTY:', '').strip()
            elif line.startswith('HAS_DIAGRAM:'):
                result.has_diagram = line.replace('HAS_DIAGRAM:', '').strip()
            elif line.startswith('DIAGRAM_DESCRIPTION:'):
                result.diagram_description = line.replace('DIAGRAM_DESCRIPTION:', '').strip()
            elif line.startswith('IRT_DIFFICULTY:'):
                result.irt_difficulty = line.replace('IRT_DIFFICULTY:', '').strip()
            elif line.startswith('IRT_DISCRIMINATION:'):
                result.irt_discrimination = line.replace('IRT_DISCRIMINATION:', '').strip()
            elif line.startswith('IRT_GUESSING:'):
                result.irt_guessing = line.replace('IRT_GUESSING:', '').strip()
        
        return result

def generate_dspy_sat_question(
    original_question: str,
    correct_answer: str,
    original_rationale: str,
    question_type: str = "MCQ",
    topic: str = "",
    subtopic: str = "",
    difficulty: str = "Medium",
    additional_context: str = None
) -> Dict[str, Any]:
    """
    Generate a SAT question using DSPy structured output.
    
    Args:
        original_question: The original SAT question to base the new question on
        correct_answer: The correct answer to the original question
        original_rationale: The rationale/explanation for the original question
        question_type: "MCQ" or "FRQ" 
        topic: Main topic for the question
        subtopic: Subtopic for the question
        difficulty: "Easy", "Medium", or "Hard"
        additional_context: Optional additional instructions or context
    
    Returns:
        Generated SAT question data as a dictionary
    """
    logger.info("Starting DSPy-based SAT question generation...")
    
    try:
        # Initialize the DSPy generator
        generator = SATQuestionGenerator()
        
        # Generate the structured output
        result = generator.forward(
            original_question=original_question,
            original_correct_answer=correct_answer,
            original_rationale=original_rationale,
            question_type=question_type,
            topic=topic,
            subtopic=subtopic,
            difficulty_level=difficulty,
            additional_instructions=additional_context or ""
        )
        
        # Parse the structured result
        question_data = {
            "question": result.new_question,
            "correct_answer": result.correct_answer,
            "explanation": result.rationale,
            "has_latex": True,
            "generated": True,
            "crew_generated": False,
            "single_agent_generated": False,
            "dspy_generated": True,
            "type": question_type.upper(),
            "subject": "math",
            "topic_name": result.topic_name,
            "subtopic_name": result.subtopic_name if hasattr(result, 'subtopic_name') and result.subtopic_name else None,
            "difficulty": result.difficulty,
            "has_diagram": result.has_diagram.lower() == 'true' if isinstance(result.has_diagram, str) else result.has_diagram,
            "diagram_url": result.diagram_description if hasattr(result, 'diagram_description') and result.diagram_description else None,
        }
        
        # Handle IRT parameters with proper conversion
        try:
            question_data["irt_difficulty"] = float(result.irt_difficulty)
        except (ValueError, AttributeError):
            question_data["irt_difficulty"] = 0.0
            
        try:
            question_data["irt_discrimination"] = float(result.irt_discrimination)
        except (ValueError, AttributeError):
            question_data["irt_discrimination"] = 1.0
            
        try:
            question_data["irt_guessing"] = float(result.irt_guessing)
        except (ValueError, AttributeError):
            question_data["irt_guessing"] = 0.25 if question_type.upper() == "MCQ" else 0.0
        
        # Handle choices for MCQ
        if question_type.upper() == "MCQ" and result.answer_choices:
            # Parse choices from "A. choice1|B. choice2|C. choice3|D. choice4" format
            if '|' in result.answer_choices:
                choices = [choice.strip() for choice in result.answer_choices.split('|')]
            else:
                # Fallback: try to split by common patterns
                import re
                choices = re.findall(r'[A-D]\.\s*[^|]+', result.answer_choices)
            
            question_data["choices"] = choices[:4]  # Ensure exactly 4 choices
        else:
            question_data["choices"] = []
        
        # Handle hints
        if result.hints:
            if '|' in result.hints:
                hints = [hint.strip() for hint in result.hints.split('|') if hint.strip()]
            else:
                # Fallback: single hint or newline-separated
                hints = [hint.strip() for hint in result.hints.split('\n') if hint.strip()]
            question_data["hints"] = hints[:3]  # Max 3 hints
        
        # Handle tags
        if result.tags:
            if '|' in result.tags:
                tags = [tag.strip() for tag in result.tags.split('|') if tag.strip()]
            else:
                # Fallback: comma-separated
                tags = [tag.strip() for tag in result.tags.split(',') if tag.strip()]
            question_data["tags"] = tags[:4]  # Max 4 tags
        
        # Add generated ID
        question_data["id"] = f"dspy-generated-{hash(str(question_data)) % 1000000}"
        
        logger.info("Successfully generated SAT question with DSPy")
        return question_data
        
    except Exception as e:
        logger.error(f"Error in DSPy question generation: {e}")
        # If DSPy fails, we can still provide a basic fallback
        if "structured output format" in str(e) or "JSON mode failed" in str(e):
            logger.warning("DSPy structured output not supported by current model, need OpenAI GPT models")
        raise Exception(f"DSPy generation failed: {e}")

# Wrapper function for compatibility with existing system
async def generate_question_dspy(request_data: Dict[str, Any], user_message: Optional[str] = None):
    """
    Async wrapper for DSPy question generation to maintain compatibility.
    
    Args:
        request_data: Dictionary containing request parameters
        user_message: Optional user instructions
    
    Returns:
        Generated SAT question data
    """
    
    sample_question = request_data.get('sample_question', {})
    question_type = request_data.get('type', 'MCQ').upper()
    topic = request_data.get('topic', '')
    subtopic = request_data.get('subtopic', '')
    difficulty = request_data.get('difficulty', 'Medium')
    
    if not sample_question:
        raise ValueError("Sample question is required for DSPy generation")
    
    original_question = sample_question.get('question', '')
    correct_answer = sample_question.get('correct_answer', '')
    original_rationale = sample_question.get('explanation', '')
    
    if not all([original_question, correct_answer, original_rationale]):
        raise ValueError("Sample question must include question, correct_answer, and explanation fields")
    
    # Generate the question using DSPy
    return generate_dspy_sat_question(
        original_question=original_question,
        correct_answer=correct_answer,
        original_rationale=original_rationale,
        question_type=question_type,
        topic=topic,
        subtopic=subtopic,
        difficulty=difficulty,
        additional_context=user_message
    )

# Example usage function for testing
async def demo_dspy_generation():
    """
    Demo function showing how to use the DSPy question generator.
    """
    
    # Example sample question data
    sample_request = {
        "subject": "math",
        "type": "MCQ",
        "topic": "Algebra",
        "subtopic": "Linear Equations",
        "difficulty": "medium",
        "sample_question": {
            "question": "If $3x + 7 = 22$, what is the value of $x - 2$?",
            "correct_answer": "C",
            "explanation": "First solve for x: $3x + 7 = 22$, so $3x = 15$, therefore $x = 5$. Then calculate $x - 2 = 5 - 2 = 3$.",
            "choices": [
                "A. 1",
                "B. 2", 
                "C. 3",
                "D. 5"
            ]
        }
    }
    
    print("Demo: Generating a new SAT question using DSPy...")
    print("="*60)
    
    try:
        # Generate using DSPy
        result = await generate_question_dspy(
            request_data=sample_request,
            user_message="Make sure to preserve the algebraic manipulation technique."
        )
        
        print("Generated Question:")
        print(f"Question: {result.get('question', '')}")
        if result.get('choices'):
            for choice in result['choices']:
                print(f"  {choice}")
        print(f"Correct Answer: {result.get('correct_answer', '')}")
        print(f"Explanation: {result.get('explanation', '')}")
        
        if result.get('hints'):
            print(f"Hints: {result['hints']}")
        if result.get('tags'):
            print(f"Tags: {result['tags']}")
        if result.get('desmos_solution'):
            print(f"Desmos Solution: {result['desmos_solution']}")
            
    except Exception as e:
        print(f"Error in demo generation: {e}")

if __name__ == "__main__":
    import asyncio
    asyncio.run(demo_dspy_generation()) 