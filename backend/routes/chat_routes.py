"""
Chat Routes - HTTP API endpoints for chat functionality

This module provides the REST API endpoints for the chat system, including:
- Streaming chat responses with message storage
- Conversation CRUD operations  
- Authentication middleware integration
- Tool call execution and result storage

Key Features:
- Persistent conversation history in Supabase
- Real-time streaming responses
- Tool call execution and storage
- User authentication and data isolation
- Automatic conversation title generation
"""

import os
import sys
import json
import asyncio
from typing import List, Optional

# Add the project root to Python path for imports to work
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)
 
from openai.types.chat.chat_completion_message_param import ChatCompletionMessageParam
from pydantic import BaseModel
from dotenv import load_dotenv
from fastapi import Query, APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from openai import OpenAI
import logging

from backend.chat_utils.prompt import ClientMessage, convert_to_openai_messages
from backend.chat_utils.tools import get_current_weather, generate_quiz, get_openai_tools_config, get_questions, generate_sat_question, generate_question
from backend.utils.supabase_auth import get_current_user, CurrentUser
from backend.utils.chat_storage import chat_storage

logger = logging.getLogger(__name__)

# Create router for chat routes
chat_router = APIRouter(prefix="/chat", tags=["chat"])


load_dotenv()

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
)



class ChatRequest(BaseModel):
    messages: List[ClientMessage]
    conversation_id: Optional[str] = None
    save_to_history: bool = True

class ConversationCreateRequest(BaseModel):
    title: str = "New Conversation"


available_tools = {
    "get_current_weather": get_current_weather,
    "generate_quiz": generate_quiz,
    "get_questions": get_questions,
    "generate_sat_question": generate_sat_question,
    "generate_question": generate_question,
}



def do_stream(messages: List[ChatCompletionMessageParam]):
    stream = client.chat.completions.create(
        messages=messages,
        model="gpt-4o",
        stream=True,
        tools=get_openai_tools_config()
    )

    return stream

async def stream_text(messages: List[ChatCompletionMessageParam], protocol: str = 'data', 
                     conversation_id: Optional[str] = None, user: Optional[CurrentUser] = None, 
                     save_to_history: bool = True):
    draft_tool_calls = []
    draft_tool_calls_index = -1
    assistant_content = ""
    usage_data = None

    stream = do_stream(messages)
 
    for chunk in stream:
        for choice in chunk.choices:
            if choice.finish_reason == "stop":
                continue

            elif choice.finish_reason == "tool_calls":
                # Store assistant message with tool calls if saving history
                if save_to_history and conversation_id and user:
                    try:
                        tool_calls_data = []
                        for tool_call in draft_tool_calls:
                            tool_calls_data.append({
                                "id": tool_call["id"],
                                "type": "function",
                                "function": {
                                    "name": tool_call["name"],
                                    "arguments": tool_call["arguments"]
                                }
                            })
                        
                        await chat_storage.store_assistant_message(
                            conversation_id, 
                            content=assistant_content if assistant_content.strip() else None,
                            tool_calls=tool_calls_data,
                            metadata={"usage": usage_data} if usage_data else None
                        )
                    except Exception as e:
                        logger.error(f"Error storing assistant message with tool calls: {e}")

                for tool_call in draft_tool_calls:
                    yield '9:{{"toolCallId":"{id}","toolName":"{name}","args":{args}}}\n'.format(
                        id=tool_call["id"],
                        name=tool_call["name"],
                        args=tool_call["arguments"])

                for tool_call in draft_tool_calls:
                    tool_function = available_tools[tool_call["name"]]
                    args = json.loads(tool_call["arguments"])
                    
                    # Handle async functions
                    if asyncio.iscoroutinefunction(tool_function):
                        tool_result = await tool_function(**args)
                    else:
                        tool_result = tool_function(**args)

                    # Store tool result if saving history
                    if save_to_history and conversation_id and user:
                        try:
                            await chat_storage.store_tool_result(
                                conversation_id,
                                tool_call["id"],
                                tool_call["name"],
                                tool_result
                            )
                        except Exception as e:
                            logger.error(f"Error storing tool result: {e}")

                    yield 'a:{{"toolCallId":"{id}","toolName":"{name}","args":{args},"result":{result}}}\n'.format(
                        id=tool_call["id"],
                        name=tool_call["name"],
                        args=tool_call["arguments"],
                        result=json.dumps(tool_result))

            elif choice.delta.tool_calls:
                for tool_call in choice.delta.tool_calls:
                    id = tool_call.id
                    name = tool_call.function.name
                    arguments = tool_call.function.arguments

                    if (id is not None):
                        draft_tool_calls_index += 1
                        draft_tool_calls.append(
                            {"id": id, "name": name, "arguments": ""})

                    else:
                        draft_tool_calls[draft_tool_calls_index]["arguments"] += arguments

            else:
                # Accumulate assistant content
                if choice.delta.content:
                    assistant_content += choice.delta.content
                yield '0:{text}\n'.format(text=json.dumps(choice.delta.content))

        if chunk.choices == []:
            usage = chunk.usage
            prompt_tokens = usage.prompt_tokens
            completion_tokens = usage.completion_tokens
            usage_data = {"prompt_tokens": prompt_tokens, "completion_tokens": completion_tokens}

            # Store final assistant message if no tool calls and saving history
            if save_to_history and conversation_id and user and not draft_tool_calls and assistant_content.strip():
                try:
                    await chat_storage.store_assistant_message(
                        conversation_id, 
                        content=assistant_content,
                        metadata={"usage": usage_data}
                    )
                except Exception as e:
                    logger.error(f"Error storing assistant message: {e}")

            yield 'e:{{"finishReason":"{reason}","usage":{{"promptTokens":{prompt},"completionTokens":{completion}}},"isContinued":false}}\n'.format(
                reason="tool-calls" if len(
                    draft_tool_calls) > 0 else "stop",
                prompt=prompt_tokens,
                completion=completion_tokens
            )



@chat_router.post("/message")
async def handle_chat_data(
    request: ChatRequest, 
    protocol: str = Query('data'),
    current_user: CurrentUser = Depends(get_current_user)
):
    messages = request.messages
    
    # Get or create conversation if saving to history
    conversation_id = None
    if request.save_to_history:
        try:
            conversation_id = await chat_storage.get_or_create_conversation(
                current_user.uid, request.conversation_id
            )
            
            # Store user message (assumes last message is from user)
            if messages and messages[-1].role == "user":
                await chat_storage.store_user_message(
                    conversation_id, 
                    messages[-1].content[0].text if messages[-1].content and hasattr(messages[-1].content[0], 'text') else str(messages[-1].content)
                )
        except Exception as e:
            logger.error(f"Error handling conversation storage: {e}")
            # Continue without storage if there's an error
            conversation_id = None
    
    # Add conversation history if available
    if conversation_id:
        try:
            # Get recent conversation history (excluding the current user message)
            history = await chat_storage.get_conversation_history(conversation_id, current_user.uid, limit=20)
            
            # Convert stored messages to OpenAI format and prepend to current messages
            historical_messages = []
            for msg in history[:-1]:  # Exclude the last message we just stored
                if msg['role'] in ['user', 'assistant']:
                    historical_messages.append({
                        "role": msg['role'],
                        "content": msg['content']
                    })
                elif msg['role'] == 'tool':
                    # Add tool results
                    historical_messages.append({
                        "role": "tool",
                        "content": msg['content'],
                        "tool_call_id": msg['tool_call_id']
                    })
            
            # Combine history with current messages
            openai_messages = historical_messages + convert_to_openai_messages(messages)
        except Exception as e:
            logger.error(f"Error loading conversation history: {e}")
            openai_messages = convert_to_openai_messages(messages)
    else:
        openai_messages = convert_to_openai_messages(messages)

    response = StreamingResponse(
        stream_text(openai_messages, protocol, conversation_id, current_user, request.save_to_history)
    )
    response.headers['x-vercel-ai-data-stream'] = 'v1'
    
    # Add conversation ID to response headers if available
    if conversation_id:
        response.headers['x-conversation-id'] = conversation_id
    
    return response


# Conversation management endpoints

@chat_router.post("/conversations")
async def create_conversation(
    request: ConversationCreateRequest,
    current_user: CurrentUser = Depends(get_current_user)
):
    """Create a new conversation"""
    try:
        conversation_id = await chat_storage.create_conversation(current_user.uid, request.title)
        return {"conversation_id": conversation_id, "title": request.title}
    except Exception as e:
        logger.error(f"Error creating conversation: {e}")
        raise HTTPException(status_code=500, detail="Failed to create conversation")


@chat_router.get("/conversations")
async def get_conversations(
    limit: int = Query(50, ge=1, le=100),
    current_user: CurrentUser = Depends(get_current_user)
):
    """Get user's conversations"""
    try:
        conversations = await chat_storage.get_user_conversations(current_user.uid, limit)
        return {"conversations": conversations}
    except Exception as e:
        logger.error(f"Error getting conversations: {e}")
        raise HTTPException(status_code=500, detail="Failed to get conversations")


@chat_router.get("/conversations/{conversation_id}")
async def get_conversation_history(
    conversation_id: str,
    limit: Optional[int] = Query(None, ge=1, le=200),
    current_user: CurrentUser = Depends(get_current_user)
):
    """Get conversation message history"""
    try:
        messages = await chat_storage.get_conversation_history(conversation_id, current_user.uid, limit)
        return {"conversation_id": conversation_id, "messages": messages}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting conversation history: {e}")
        raise HTTPException(status_code=500, detail="Failed to get conversation history")


@chat_router.put("/conversations/{conversation_id}/title")
async def update_conversation_title(
    conversation_id: str,
    request: ConversationCreateRequest,
    current_user: CurrentUser = Depends(get_current_user)
):
    """Update conversation title"""
    try:
        success = await chat_storage.update_conversation_title(conversation_id, current_user.uid, request.title)
        if not success:
            raise HTTPException(status_code=404, detail="Conversation not found")
        return {"conversation_id": conversation_id, "title": request.title}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating conversation title: {e}")
        raise HTTPException(status_code=500, detail="Failed to update conversation title")


@chat_router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    current_user: CurrentUser = Depends(get_current_user)
):
    """Delete a conversation and all its messages"""
    try:
        success = await chat_storage.delete_conversation(conversation_id, current_user.uid)
        if not success:
            raise HTTPException(status_code=404, detail="Conversation not found")
        return {"message": "Conversation deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting conversation: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete conversation")
