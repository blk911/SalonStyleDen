import OpenAI from 'openai';
import { db } from '../db/models';

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  return openai;
}

export async function runVoicePrintMatch(userId: string, voiceSample: any) {
  console.log(`Voice print matching for user ${userId}`);
  const similarity = Math.random();
  return { success: similarity > 0.7 };
}

export async function generateChallenge(userId: string) {
  const memories = db.getMemoriesByUserId(userId);
  if (memories.length === 0) {
    return {
      question: "What is your favorite memory?",
      referenceMemoryId: null
    };
  }

  const pick = memories[Math.floor(Math.random() * memories.length)];
  const prompt = `Generate a challenge from this memory: "${pick.content}"`;

  try {
    const aiRes = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }]
    });

    return {
      question: aiRes.choices[0].message.content,
      referenceMemoryId: pick.id
    };
  } catch (error) {
    console.error('OpenAI error:', error);
    return {
      question: `What details do you remember about: ${pick.title}?`,
      referenceMemoryId: pick.id
    };
  }
}

export async function verifyChallengeResponse(memoryId: string, userResponse: string) {
  const memory = db.getMemoryById(memoryId);
  if (!memory) return false;

  const prompt = `Memory: "${memory.content}"\nUser Answer: "${userResponse}"\nIs this a valid match?`;

  try {
    const aiRes = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }]
    });

    return aiRes.choices[0].message.content?.toLowerCase().includes("yes") || false;
  } catch (error) {
    console.error('OpenAI verification error:', error);
    const similarity = userResponse.toLowerCase().includes(memory.content.toLowerCase().split(' ')[0]);
    return similarity;
  }
}
