export interface User {
  id: string;
  phone: string;
  name: string;
  voiceAuthHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invitation {
  id: string;
  senderId: string;
  recipientPhone: string;
  recipientName?: string;
  status: 'pending' | 'accepted' | 'rejected';
  inviteCode: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrustUnit {
  id: string;
  memberIds: string[];
  status: 'forming' | 'active' | 'dissolved';
  approvals: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Memory {
  id: string;
  userId: string;
  title: string;
  content: string;
  tags: string[];
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Challenge {
  id: string;
  memoryId: string;
  question: string;
  correctAnswer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  createdAt: Date;
}

export interface VoiceAuth {
  id: string;
  userId: string;
  voiceFileUrl: string;
  waveformHash: string;
  isVerified: boolean;
  createdAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export class InMemoryDatabase {
  private users: Map<string, User> = new Map();
  private invitations: Map<string, Invitation> = new Map();
  private trustUnits: Map<string, TrustUnit> = new Map();
  private memories: Map<string, Memory> = new Map();
  private challenges: Map<string, Challenge> = new Map();
  private voiceAuths: Map<string, VoiceAuth> = new Map();
  private sessions: Map<string, Session> = new Map();

  getUsers(): User[] {
    return Array.from(this.users.values());
  }

  getUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  getUserByPhone(phone: string): User | undefined {
    return Array.from(this.users.values()).find(user => user.phone === phone);
  }

  createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User {
    const newUser: User = {
      ...user,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(newUser.id, newUser);
    return newUser;
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  getInvitations(): Invitation[] {
    return Array.from(this.invitations.values());
  }

  getInvitationById(id: string): Invitation | undefined {
    return this.invitations.get(id);
  }

  createInvitation(invitation: Omit<Invitation, 'id' | 'createdAt' | 'updatedAt'>): Invitation {
    const newInvitation: Invitation = {
      ...invitation,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.invitations.set(newInvitation.id, newInvitation);
    return newInvitation;
  }

  updateInvitation(id: string, updates: Partial<Invitation>): Invitation | undefined {
    const invitation = this.invitations.get(id);
    if (!invitation) return undefined;
    
    const updatedInvitation = { ...invitation, ...updates, updatedAt: new Date() };
    this.invitations.set(id, updatedInvitation);
    return updatedInvitation;
  }

  getTrustUnits(): TrustUnit[] {
    return Array.from(this.trustUnits.values());
  }

  getTrustUnitById(id: string): TrustUnit | undefined {
    return this.trustUnits.get(id);
  }

  createTrustUnit(trustUnit: Omit<TrustUnit, 'id' | 'createdAt' | 'updatedAt'>): TrustUnit {
    const newTrustUnit: TrustUnit = {
      ...trustUnit,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.trustUnits.set(newTrustUnit.id, newTrustUnit);
    return newTrustUnit;
  }

  updateTrustUnit(id: string, updates: Partial<TrustUnit>): TrustUnit | undefined {
    const trustUnit = this.trustUnits.get(id);
    if (!trustUnit) return undefined;
    
    const updatedTrustUnit = { ...trustUnit, ...updates, updatedAt: new Date() };
    this.trustUnits.set(id, updatedTrustUnit);
    return updatedTrustUnit;
  }

  getMemories(): Memory[] {
    return Array.from(this.memories.values());
  }

  getMemoryById(id: string): Memory | undefined {
    return this.memories.get(id);
  }

  getMemoriesByUserId(userId: string): Memory[] {
    return Array.from(this.memories.values()).filter(memory => memory.userId === userId);
  }

  createMemory(memory: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>): Memory {
    const newMemory: Memory = {
      ...memory,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.memories.set(newMemory.id, newMemory);
    return newMemory;
  }

  getChallenges(): Challenge[] {
    return Array.from(this.challenges.values());
  }

  getChallengeById(id: string): Challenge | undefined {
    return this.challenges.get(id);
  }

  createChallenge(challenge: Omit<Challenge, 'id' | 'createdAt'>): Challenge {
    const newChallenge: Challenge = {
      ...challenge,
      id: this.generateId(),
      createdAt: new Date()
    };
    this.challenges.set(newChallenge.id, newChallenge);
    return newChallenge;
  }

  getVoiceAuths(): VoiceAuth[] {
    return Array.from(this.voiceAuths.values());
  }

  getVoiceAuthById(id: string): VoiceAuth | undefined {
    return this.voiceAuths.get(id);
  }

  getVoiceAuthByUserId(userId: string): VoiceAuth | undefined {
    return Array.from(this.voiceAuths.values()).find(auth => auth.userId === userId);
  }

  createVoiceAuth(voiceAuth: Omit<VoiceAuth, 'id' | 'createdAt'>): VoiceAuth {
    const newVoiceAuth: VoiceAuth = {
      ...voiceAuth,
      id: this.generateId(),
      createdAt: new Date()
    };
    this.voiceAuths.set(newVoiceAuth.id, newVoiceAuth);
    return newVoiceAuth;
  }

  updateVoiceAuth(id: string, updates: Partial<VoiceAuth>): VoiceAuth | undefined {
    const voiceAuth = this.voiceAuths.get(id);
    if (!voiceAuth) return undefined;
    
    const updatedVoiceAuth = { ...voiceAuth, ...updates };
    this.voiceAuths.set(id, updatedVoiceAuth);
    return updatedVoiceAuth;
  }

  getSessions(): Session[] {
    return Array.from(this.sessions.values());
  }

  getSessionById(id: string): Session | undefined {
    return this.sessions.get(id);
  }

  getSessionByToken(token: string): Session | undefined {
    return Array.from(this.sessions.values()).find(session => session.token === token);
  }

  createSession(session: Omit<Session, 'id' | 'createdAt'>): Session {
    const newSession: Session = {
      ...session,
      id: this.generateId(),
      createdAt: new Date()
    };
    this.sessions.set(newSession.id, newSession);
    return newSession;
  }

  deleteSession(id: string): boolean {
    return this.sessions.delete(id);
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
}

export const db = new InMemoryDatabase();
