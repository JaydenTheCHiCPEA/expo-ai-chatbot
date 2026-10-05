import { streamText } from 'ai';
import { NextResponse } from 'next/server';

import {
  getChatById,
  getMessagesByChatId,
  saveChat,
  saveMessages,
  getAnonymousUserId,
} from '@/lib/db/queries';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth/token';
import { customModel } from '@/lib/ai';
import { models, DEFAULT_MODEL_NAME } from '@/lib/ai/models';
import { systemPrompt } from '@/lib/ai/prompts';
import { generateUUID } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    let userId: string | undefined;
    if (token) {
      const payload = await verifyToken(token);
      userId = payload?.id;
    }

    if (!userId) {
      userId = await getAnonymousUserId();
    }

    const body = await request.json();
    const { id, message, selectedChatModel, files } = body;

    console.log(`[Chat API] Received request with id: ${id}`);
    console.log(`[Chat API] Message content: ${message?.content}`);
    console.log(`[Chat API] Selected model: ${selectedChatModel}`);

    if (!id || !message?.content) {
      return NextResponse.json(
        { error: 'Chat id and message are required' },
        { status: 400 },
      );
    }

    // Embed attached file contents into the user message so the model can read them
    let userContent = message.content as string;
    if (Array.isArray(files) && files.length > 0) {
      const fileSections = files
        .filter((f: any) => f)
        .map((f: any) => {
          const name = f.name || 'attachment';
          if (f.text) {
            return `\n\n[Attached file: ${name}]\n${f.text}`;
          }
          return `\n\n[Attached file: ${name}] (no readable text extracted from this file)`;
        })
        .join('');
      userContent = `${message.content}${fileSections}`;
    }

    const userMessageId =
      typeof message.id === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        message.id,
      )
        ? message.id
        : generateUUID();

    const userMessage = {
      id: userMessageId,
      role: 'user' as const,
      content: userContent,
    };

    const chat = await getChatById({ id });
    if (!chat) {
      const title = (message.content as string).slice(0, 50);
      await saveChat({ id, userId, title });
    }

    await saveMessages({
      messages: [{ ...userMessage, chatId: id, createdAt: new Date() }],
    });

    const model =
      models.find((m) => m.id === selectedChatModel)?.id ||
      DEFAULT_MODEL_NAME;
    const previousMessages = await getMessagesByChatId({ id });
    
    // Properly format conversation history
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    
    // Add previous messages to context
    for (const msg of previousMessages) {
      const content = typeof msg.content === 'string' 
        ? msg.content 
        : (msg.content as any)?.text || JSON.stringify(msg.content);
      
      if (content && msg.role !== 'system') {
        messages.push({
          role: msg.role as 'user' | 'assistant',
          content,
        });
      }
    }
    
    // Add current user message
    messages.push({
      role: 'user',
      content: userContent,
    });

    console.log(`[Chat API] Processing chat ${id} with model ${model}`);
    console.log(`[Chat API] Message count: ${messages.length}`);
    console.log(`[Chat API] System prompt length: ${systemPrompt.length}`);

    try {
      const result = await streamText({
        model: customModel(model),
        system: systemPrompt,
        messages,
        experimental_generateMessageId: generateUUID,
      });

      console.log(`[Chat API] streamText initialized successfully`);
      
      let responseText = '';
      
      // Use result.text which contains the full generated text
      try {
        responseText = await result.text;
        console.log(`[Chat API] Got response using result.text`);
      } catch (textError) {
        console.warn(`[Chat API] Could not get result.text, trying stream: ${textError}`);
        // Fallback to streaming if result.text fails
        for await (const part of result.textStream) {
          if (part) {
            responseText += part;
          }
        }
      }

      console.log(`[Chat API] Response length: ${responseText.length}`);
      if (responseText.length > 0) {
        console.log(`[Chat API] Response preview: ${responseText.substring(0, 150)}`);
      }
      
      // Check for any finish reason issues
      if (result.finishReason && result.finishReason !== 'stop') {
        console.warn(`[Chat API] Unusual finish reason: ${result.finishReason}`);
      }
      
      if (!responseText || responseText.trim().length === 0) {
        console.warn('[Chat API] Empty response from model');
        return NextResponse.json(
          { 
            error: 'Model returned empty response. Check API keys and model availability.',
            details: {
              model,
              messageCount: messages.length,
              systemPromptLength: systemPrompt.length,
            }
          },
          { status: 500 },
        );
      }

      // Save assistant response
      await saveMessages({
        messages: [
          {
            id: generateUUID(),
            chatId: id,
            role: 'assistant',
            content: responseText,
            createdAt: new Date(),
          },
        ],
      });

      return NextResponse.json({
        id,
        message: responseText,
      });
    } catch (streamError) {
      console.error('[Chat API] Stream processing error:', streamError);
      const errorDetails = streamError instanceof Error ? streamError.message : String(streamError);
      console.error('[Chat API] Error stack:', streamError instanceof Error ? streamError.stack : 'N/A');
      throw streamError;
    }
  } catch (error) {
    console.error('[Chat API] Error in chat:', error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate response',
        details: errorMessage,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}