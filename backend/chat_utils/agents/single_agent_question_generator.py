import os
import json
import logging
import re
from typing import Dict, Any, Optional
import requests
from dotenv import load_dotenv

logger = logging.getLogger(__name__)
load_dotenv()

# TODO: need to convert this to async for concurrency if this feature is every shipped for commcercial use

# Configure Claude client through OpenRouter

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

if not OPENROUTER_API_KEY:
    logger.error("OPENROUTER_API_KEY not found in environment variables!")
    raise ValueError("OPENROUTER_API_KEY is required for single-agent generation")

client_config = {
    "api_key": OPENROUTER_API_KEY,
    "base_url": "https://openrouter.ai/api/",
    "model": "anthropic/claude-3.7-sonnet:thinking",
    "provider": "openrouter"
}
logger.info(f"Single-agent generator configured with {client_config['model']} via {client_config['provider']}")
logger.info(f"API key present: {bool(OPENROUTER_API_KEY)}")

SINGLE_AGENT_SYSTEM_PROMPT = """
You are Claude, an expert SAT question generator with exceptional analytical and mathematical reasoning abilities. Your task is to create structurally similar but commercially usable SAT-style math questions that preserve the logic and mathematical reasoning (including any subtle tricks) while changing the numbers and variables.

Your approach should be methodical and precise:

STEP 1 - ANALYZE THE ORIGINAL:
- Identify the core mathematical concept and solving technique
- Note the exact sequence of operations required
- Recognize any mathematical "tricks" or insights
- Understand the pedagogical purpose of each step

STEP 2 - PRESERVE STRUCTURE:
- Maintain the EXACT same solving method and step sequence
- Keep the same mathematical operations and techniques
- Preserve the same type of mathematical thinking required
- Ensure the same number of solving steps in the same order

STEP 3 - CREATE ORIGINAL CONTENT:
- Change ALL numbers, variables, and algebraic expressions
- Use different contexts and wording to avoid copyright issues
- Ensure legal distinctness while maintaining pedagogical equivalence
- Do NOT copy any phrases or sentence structures from the original

STEP 4 - ENSURE MATHEMATICAL ACCURACY:
- Verify all calculations and reasoning steps
- For MCQ: Create exactly one correct answer with 3 plausible distractors
- Design distractors that represent realistic student mistakes
- For FRQ: Provide a clear numerical answer

STEP 5 - FORMAT WITH PRECISION:
- Wrap ALL mathematical expressions in $ signs (e.g., $2x+3=7$, $x$, $\\frac{a}{b}$)
- Use π instead of /pi
- Support LaTeX commands: \\frac{}, \\sqrt{}, $x_1$, $x^2$
- No spaces within LaTeX expressions: $3x+5=1$ not $3x + 5 = 1$

OUTPUT FORMAT (follow exactly):

Original Question:
[Insert the provided original question here]

Correct Answer:
[Insert the provided correct answer here]

Original Rationale:
[Insert the provided original rationale here]

New Question:
[Your newly generated, structurally similar SAT-style question here with proper LaTeX formatting]

Answer Choices (if MCQ):
A. [First option]
B. [Second option] 
C. [Third option]
D. [Fourth option]

Correct Answer:
[Letter choice for MCQ or numerical value for FRQ]

Rationale:
[One paragraph explanation that mirrors the reasoning and mathematical technique used in the original. For MCQ, explain why the correct answer is right and why each incorrect choice is wrong. Include any tricks, steps, or pitfalls.]

Desmos Solution:
[If applicable, provide Desmos commands or approach to solve the question. If not applicable, write "Not applicable"]

Hints:
[Provide exactly 3 sequential hints that guide toward the solution without giving it away]

Tags:
[Provide 2-4 relevant tags for organizing skills and topics]

Remember: You excel at maintaining structural similarity while ensuring originality. Apply your analytical strengths to preserve the mathematical essence while creating legally distinct content.
"""

def make_api_call(messages: list, config: dict) -> str:
    """Make an API call using requests"""
    
    headers = {
        "Authorization": f"Bearer {config['api_key']}",
        "Content-Type": "application/json"
    }
    
    if config['provider'] == 'openrouter':
        headers["HTTP-Referer"] = "https://github.com/your-repo"  # Required by OpenRouter
        headers["X-Title"] = "SAT Question Generator"
    
    payload = {
        "model": config['model'],
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 2000
    }
    
    endpoint_url = f"{config['base_url']}/chat/completions"
    logger.info(f"Making API call to {endpoint_url} with model {config['model']}")
    
    try:
        response = requests.post(
            endpoint_url,
            headers=headers,
            json=payload,
            timeout=60.0
        )
        
        logger.info(f"API response status: {response.status_code}")
        
        if response.status_code != 200:
            logger.error(f"API error: {response.status_code} - {response.text}")
            response.raise_for_status()
        
        result = response.json()
        
        if 'choices' not in result or not result['choices']:
            logger.error(f"Invalid API response structure: {result}")
            raise ValueError("Invalid response from API - no choices found")
        
        content = result['choices'][0]['message']['content']
        logger.info(f"Successfully received {len(content)} characters from API")
        
        return content
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Request failed: {e}")
        raise Exception(f"API request failed: {e}")
    except (KeyError, IndexError) as e:
        logger.error(f"Response parsing failed: {e}")
        raise Exception(f"Failed to parse API response: {e}")

def generate_single_agent_question(
    original_question: str,
    correct_answer: str,
    original_rationale: str,
    question_type: str = "MCQ",
    additional_context: str = None
) -> Dict[str, Any]:
    """
    Generate a SAT question using Claude with comprehensive system prompt and parsing.
    
    Args:
        original_question: The original SAT question to base the new question on
        correct_answer: The correct answer to the original question
        original_rationale: The rationale/explanation for the original question
        question_type: "MCQ" or "FRQ" 
        additional_context: Optional additional instructions or context
    
    Returns:
        Generated SAT question data as a dictionary
    """
    logger.info(f"Starting single-agent SAT question generation with {client_config['model']}...")
    
    # Prepare the user message
    user_message = f"""
Please generate a new SAT question based on this original question:

Original Question: {original_question}

Correct Answer: {correct_answer}

Original Rationale: {original_rationale}

Question Type: {question_type}
"""
    
    if additional_context:
        user_message += f"\n\nAdditional Instructions: {additional_context}"
    
    try:
        # Make the API call
        messages = [
            {"role": "system", "content": SINGLE_AGENT_SYSTEM_PROMPT},
            {"role": "user", "content": user_message}
        ]
        generated_content = make_api_call(messages, client_config)
        
        # Log the raw response for debugging
        logger.info("Raw AI response:")
        logger.info(generated_content)
        
        # Parse the structured response
        parsed_data = parse_generated_response(generated_content, question_type)
        
        logger.info("Successfully generated SAT question with single agent")
        return parsed_data
        
    except Exception as e:
        logger.error(f"Error in single-agent question generation: {e}")
        raise Exception(f"Single-agent generation failed: {e}")

def parse_generated_response(content: str, question_type: str) -> Dict[str, Any]:
    """
    Parse the structured response from the AI agent into a usable dictionary.
    
    Args:
        content: The raw response content from the AI
        question_type: "MCQ" or "FRQ"
    
    Returns:
        Parsed question data as a dictionary
    """
    
    sections = {}
    current_section = None
    current_content = []
    
    lines = content.split('\n')
    
    # Define expected section headers with variations
    section_headers = {
        'Original Question': ['Original Question', 'original question'],
        'Correct Answer': ['Correct Answer', 'correct answer'],
        'Original Rationale': ['Original Rationale', 'original rationale'],
        'New Question': ['New Question', 'new question'],
        'Answer Choices (if MCQ)': ['Answer Choices (if MCQ)', 'answer choices (if mcq)', 'Answer Choices', 'answer choices'],
        'Rationale': ['Rationale', 'rationale'],
        'Desmos Solution': ['Desmos Solution', 'desmos solution'],
        'Hints': ['Hints', 'hints'],
        'Tags': ['Tags', 'tags']
    }
    
    for line in lines:
        line_stripped = line.strip()
        
        # Check for section headers (with or without colon)
        section_found = None
        for standard_header, variations in section_headers.items():
            for variation in variations:
                if (line_stripped == variation + ':' or 
                    line_stripped.lower() == variation.lower() + ':' or
                    line_stripped == variation or
                    line_stripped.lower() == variation.lower()):
                    section_found = standard_header
                    break
            if section_found:
                break
        
        if section_found:
            # Save previous section
            if current_section:
                sections[current_section] = '\n'.join(current_content).strip()
            
            # Start new section
            current_section = section_found
            current_content = []
        else:
            if current_section and line_stripped:
                current_content.append(line_stripped)
    
    # Save the last section
    if current_section:
        sections[current_section] = '\n'.join(current_content).strip()
    
    # Log parsed sections for debugging
    logger.info("Parsed sections:")
    for section_name, section_content in sections.items():
        logger.info(f"{section_name}: {section_content[:100]}...")
    
    # Build the final dictionary
    question_data = {
        "question": sections.get("New Question", ""),
        "correct_answer": sections.get("Correct Answer", ""),
        "explanation": sections.get("Rationale", ""),
        "has_latex": True,
        "generated": True,
        "crew_generated": False,
        "single_agent_generated": True,
        "type": question_type,
        "subject": "math"
    }
    
    # Handle choices for MCQ
    if question_type.upper() == "MCQ":
        choices_section = sections.get("Answer Choices (if MCQ)", "")
        if choices_section:
            choices = []
            for line in choices_section.split('\n'):
                line = line.strip()
                if line and any(line.startswith(f'{letter}.') for letter in ['A', 'B', 'C', 'D']):
                    choices.append(line)
            question_data["choices"] = choices[:4]  # Ensure exactly 4 choices
    
    # Handle hints
    if "Hints" in sections:
        hints_text = sections["Hints"]
        # Try to extract individual hints
        if hints_text.startswith('[') and hints_text.endswith(']'):
            # Parse as bracketed list format
            hints_content = hints_text[1:-1]  # Remove brackets
            hints = []
            # Split by commas but respect quoted strings
            hint_matches = re.findall(r'"([^"]*)"', hints_content)
            if hint_matches:
                hints = hint_matches
            else:
                hints = [hint.strip().strip('"').strip("'") for hint in hints_content.split(',')]
        else:
            # Parse as numbered list or line-by-line format
            hints = []
            for line in hints_text.split('\n'):
                line = line.strip()
                if line:
                    # Remove numbering if present
                    line = re.sub(r'^\d+\.\s*', '', line)
                    hints.append(line)
        question_data["hints"] = hints[:3]  # Max 3 hints
    
    # Handle tags
    if "Tags" in sections:
        tags_text = sections["Tags"]
        if tags_text.startswith('[') and tags_text.endswith(']'):
            # Parse as bracketed list format
            tags_content = tags_text[1:-1]  # Remove brackets
            tags = [tag.strip().strip('"').strip("'") for tag in tags_content.split(',')]
        else:
            # Parse as comma-separated or line-by-line format
            if ',' in tags_text:
                tags = [tag.strip() for tag in tags_text.split(',') if tag.strip()]
            else:
                tags = [line.strip() for line in tags_text.split('\n') if line.strip()]
        question_data["tags"] = tags[:4]  # Max 4 tags
    
    # Handle Desmos solution
    if "Desmos Solution" in sections:
        question_data["desmos_solution"] = sections["Desmos Solution"]
    
    # Add generated ID
    question_data["id"] = f"single-agent-{hash(str(question_data)) % 1000000}"
    
    return question_data



# Wrapper function for compatibility with existing system
def generate_question_single_agent(request_data: Dict[str, Any], user_message: Optional[str] = None):
    """
    Synchronous wrapper for single-agent question generation to maintain compatibility.
    
    Args:
        request_data: Dictionary containing request parameters
        user_message: Optional user instructions
    
    Returns:
        Generated SAT question data
    """
    
    sample_question = request_data.get('sample_question', {})
    question_type = request_data.get('type', 'MCQ').upper()
    
    if not sample_question:
        raise ValueError("Sample question is required for single-agent generation")
    
    original_question = sample_question.get('question', '')
    correct_answer = sample_question.get('correct_answer', '')
    original_rationale = sample_question.get('explanation', '')
    
    if not all([original_question, correct_answer, original_rationale]):
        raise ValueError("Sample question must include question, correct_answer, and explanation fields")
    
    # Generate the question using the synchronous function
    return generate_single_agent_question(
        original_question=original_question,
        correct_answer=correct_answer,
        original_rationale=original_rationale,
        question_type=question_type,
        additional_context=user_message
    ) 

# Example usage function for testing
def demo_single_agent_generation():
    """
    Demo function showing how to use the single-agent question generator.
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
    
    print("Demo: Generating a new SAT question using single agent...")
    print("="*60)
    
    try:
        # Generate using single agent
        result = generate_question_single_agent(
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
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    demo_single_agent_generation() 