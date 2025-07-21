import OpenAI from 'openai';
import { Memory, Challenge } from '../db/models';
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

export class ChallengeService {
  async generateChallengeFromMemory(memory: Memory): Promise<Challenge> {
    try {
      const prompt = `Based on this personal memory, create a verification question that only the person who experienced it would know:

Memory Title: ${memory.title}
Memory Content: ${memory.content}
Tags: ${memory.tags.join(', ')}

Generate a specific question about details from this memory that would be hard for someone else to guess. The question should be personal and specific to the experience described.

Format your response as JSON:
{
  "question": "Your question here",
  "answer": "Expected answer here",
  "difficulty": "easy|medium|hard"
}`;

      const response = await getOpenAI().chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 200
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      const challenge = db.createChallenge({
        memoryId: memory.id,
        question: result.question,
        correctAnswer: result.answer,
        difficulty: result.difficulty || 'medium'
      });

      return challenge;
    } catch (error) {
      console.error('Challenge generation error:', error);
      throw new Error('Failed to generate challenge');
    }
  }

  async verifyChallengeResponse(challengeId: string, userAnswer: string): Promise<{ correct: boolean; similarity: number }> {
    const challenge = db.getChallengeById(challengeId);
    if (!challenge) {
      throw new Error('Challenge not found');
    }

    try {
      const prompt = `Compare these two answers for semantic similarity:

Correct Answer: "${challenge.correctAnswer}"
User Answer: "${userAnswer}"

Rate the similarity on a scale of 0.0 to 1.0, where:
- 1.0 = Exactly the same meaning
- 0.8-0.9 = Very similar, minor differences
- 0.6-0.7 = Similar core meaning, some differences
- 0.4-0.5 = Somewhat related
- 0.0-0.3 = Different meanings

Respond with only a number between 0.0 and 1.0.`;

      const response = await getOpenAI().chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 10
      });

      const similarity = parseFloat(response.choices[0].message.content?.trim() || '0');
      const correct = similarity >= 0.7;

      return { correct, similarity };
    } catch (error) {
      console.error('Challenge verification error:', error);
      const basicSimilarity = this.basicStringSimilarity(challenge.correctAnswer.toLowerCase(), userAnswer.toLowerCase());
      return { correct: basicSimilarity > 0.6, similarity: basicSimilarity };
    }
  }

  private basicStringSimilarity(str1: string, str2: string): number {
    const words1 = str1.split(/\s+/);
    const words2 = str2.split(/\s+/);
    
    let matches = 0;
    const totalWords = Math.max(words1.length, words2.length);
    
    for (const word1 of words1) {
      if (words2.some(word2 => word2.includes(word1) || word1.includes(word2))) {
        matches++;
      }
    }
    
    return matches / totalWords;
  }
}
