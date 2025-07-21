import { VoiceAuth } from '../db/models';
import { db } from '../db/models';

export class VoiceAuthService {
  async processVoiceFile(userId: string, voiceFileBuffer: Buffer): Promise<{ success: boolean; waveformHash?: string }> {
    try {
      const waveformHash = this.generateWaveformHash(voiceFileBuffer);
      
      const existingAuth = db.getVoiceAuthByUserId(userId);
      if (existingAuth) {
        const isMatch = this.compareWaveforms(existingAuth.waveformHash, waveformHash);
        db.updateVoiceAuth(existingAuth.id, { isVerified: isMatch });
        return { success: isMatch, waveformHash };
      } else {
        db.createVoiceAuth({
          userId,
          voiceFileUrl: `/uploads/voice/${userId}_${Date.now()}.wav`,
          waveformHash,
          isVerified: true
        });
        return { success: true, waveformHash };
      }
    } catch (error) {
      console.error('Voice processing error:', error);
      return { success: false };
    }
  }

  private generateWaveformHash(voiceBuffer: Buffer): string {
    const hash = require('crypto').createHash('sha256');
    hash.update(voiceBuffer);
    return hash.digest('hex');
  }

  private compareWaveforms(hash1: string, hash2: string): boolean {
    const similarity = this.calculateSimilarity(hash1, hash2);
    return similarity > 0.85;
  }

  private calculateSimilarity(hash1: string, hash2: string): number {
    if (hash1.length !== hash2.length) return 0;
    
    let matches = 0;
    for (let i = 0; i < hash1.length; i++) {
      if (hash1[i] === hash2[i]) matches++;
    }
    
    return matches / hash1.length;
  }

  async verifyVoiceAuth(userId: string): Promise<boolean> {
    const voiceAuth = db.getVoiceAuthByUserId(userId);
    return voiceAuth?.isVerified || false;
  }
}
