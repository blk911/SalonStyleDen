import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../db/models';
import { VoiceAuthService } from '../services/voiceAuth';
import { ChallengeService } from '../services/challengeService';
import { TrustUnitService } from '../services/trustUnitService';
import { authenticateToken, requireVoiceAuth, AuthRequest } from '../middleware/auth';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const voiceAuthService = new VoiceAuthService();
const challengeService = new ChallengeService();
const trustUnitService = new TrustUnitService();

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

app.use(cors());
app.use(express.json());
app.use(express.static('uploads'));

app.post('/api/auth/register', async (req, res) => {
  try {
    const { phone, name } = req.body;
    
    if (!phone || !name) {
      return res.status(400).json({ error: 'Phone and name are required' });
    }

    const existingUser = db.getUserByPhone(phone);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const user = db.createUser({ phone, name });
    
    const token = jwt.sign({ userId: user.id }, process.env.SESSION_SECRET!, { expiresIn: '7d' });
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    db.createSession({ userId: user.id, token, expiresAt });

    res.status(201).json({
      user: { id: user.id, phone: user.phone, name: user.name },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ error: 'Phone is required' });
    }

    const user = db.getUserByPhone(phone);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.SESSION_SECRET!, { expiresIn: '7d' });
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    db.createSession({ userId: user.id, token, expiresAt });

    res.json({
      user: { id: user.id, phone: user.phone, name: user.name },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/invitations', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { recipientPhone, recipientName } = req.body;
    
    if (!recipientPhone) {
      return res.status(400).json({ error: 'Recipient phone is required' });
    }

    const inviteCode = Math.random().toString(36).substr(2, 8).toUpperCase();
    
    const invitation = db.createInvitation({
      senderId: req.userId!,
      recipientPhone,
      recipientName,
      status: 'pending',
      inviteCode
    });

    res.status(201).json(invitation);
  } catch (error) {
    console.error('Invitation creation error:', error);
    res.status(500).json({ error: 'Failed to create invitation' });
  }
});

app.get('/api/invitations', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = db.getUserById(req.userId!);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const sentInvitations = db.getInvitations().filter(inv => inv.senderId === req.userId);
    const receivedInvitations = db.getInvitations().filter(inv => inv.recipientPhone === user.phone);

    res.json({
      sent: sentInvitations,
      received: receivedInvitations
    });
  } catch (error) {
    console.error('Invitations fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch invitations' });
  }
});

app.post('/api/invitations/:id/respond', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;
    
    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const invitation = db.getInvitationById(id);
    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    const user = db.getUserById(req.userId!);
    if (!user || invitation.recipientPhone !== user.phone) {
      return res.status(403).json({ error: 'Not authorized to respond to this invitation' });
    }

    const updatedInvitation = db.updateInvitation(id, {
      status: action === 'accept' ? 'accepted' : 'rejected'
    });

    res.json(updatedInvitation);
  } catch (error) {
    console.error('Invitation response error:', error);
    res.status(500).json({ error: 'Failed to respond to invitation' });
  }
});

app.post('/api/voice-auth', authenticateToken, upload.single('voiceFile'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Voice file is required' });
    }

    const result = await voiceAuthService.processVoiceFile(req.userId!, req.file.buffer);
    
    if (result.success) {
      res.json({ success: true, message: 'Voice authentication successful' });
    } else {
      res.status(401).json({ success: false, message: 'Voice authentication failed' });
    }
  } catch (error) {
    console.error('Voice auth error:', error);
    res.status(500).json({ error: 'Voice authentication failed' });
  }
});

app.get('/api/voice-auth/status', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const isVerified = await voiceAuthService.verifyVoiceAuth(req.userId!);
    res.json({ verified: isVerified });
  } catch (error) {
    console.error('Voice auth status error:', error);
    res.status(500).json({ error: 'Failed to check voice auth status' });
  }
});

app.post('/api/memories', authenticateToken, requireVoiceAuth, async (req: AuthRequest, res) => {
  try {
    const { title, content, tags, isPrivate = true } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const memory = db.createMemory({
      userId: req.userId!,
      title,
      content,
      tags: tags || [],
      isPrivate
    });

    res.status(201).json(memory);
  } catch (error) {
    console.error('Memory creation error:', error);
    res.status(500).json({ error: 'Failed to create memory' });
  }
});

app.get('/api/memories', authenticateToken, requireVoiceAuth, async (req: AuthRequest, res) => {
  try {
    const memories = db.getMemoriesByUserId(req.userId!);
    res.json(memories);
  } catch (error) {
    console.error('Memories fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch memories' });
  }
});

app.post('/api/challenges/generate/:memoryId', authenticateToken, requireVoiceAuth, async (req: AuthRequest, res) => {
  try {
    const { memoryId } = req.params;
    
    const memory = db.getMemoryById(memoryId);
    if (!memory) {
      return res.status(404).json({ error: 'Memory not found' });
    }

    if (memory.userId !== req.userId) {
      return res.status(403).json({ error: 'Not authorized to access this memory' });
    }

    const challenge = await challengeService.generateChallengeFromMemory(memory);
    res.status(201).json(challenge);
  } catch (error) {
    console.error('Challenge generation error:', error);
    res.status(500).json({ error: 'Failed to generate challenge' });
  }
});

app.post('/api/challenges/:id/verify', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { answer } = req.body;
    
    if (!answer) {
      return res.status(400).json({ error: 'Answer is required' });
    }

    const result = await challengeService.verifyChallengeResponse(id, answer);
    res.json(result);
  } catch (error) {
    console.error('Challenge verification error:', error);
    res.status(500).json({ error: 'Failed to verify challenge response' });
  }
});

app.get('/api/trust-units/potential', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const potentialTriads = await trustUnitService.detectPotentialTriads(req.userId!);
    res.json(potentialTriads);
  } catch (error) {
    console.error('Potential triads error:', error);
    res.status(500).json({ error: 'Failed to detect potential triads' });
  }
});

app.post('/api/trust-units', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { memberIds } = req.body;
    
    if (!memberIds || !Array.isArray(memberIds) || memberIds.length !== 3) {
      return res.status(400).json({ error: 'Exactly 3 member IDs are required' });
    }

    if (!memberIds.includes(req.userId!)) {
      return res.status(400).json({ error: 'You must be a member of the trust unit' });
    }

    const trustUnit = await trustUnitService.createTrustUnit(memberIds);
    res.status(201).json(trustUnit);
  } catch (error) {
    console.error('Trust unit creation error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to create trust unit' });
  }
});

app.post('/api/trust-units/:id/approve', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    const trustUnit = await trustUnitService.approveTrustUnit(id, req.userId!);
    res.json(trustUnit);
  } catch (error) {
    console.error('Trust unit approval error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to approve trust unit' });
  }
});

app.get('/api/trust-units', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const trustUnits = await trustUnitService.getUserTrustUnits(req.userId!);
    res.json(trustUnits);
  } catch (error) {
    console.error('Trust units fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch trust units' });
  }
});

app.get('/api/dashboard', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = db.getUserById(req.userId!);
    const memories = db.getMemoriesByUserId(req.userId!);
    const trustUnits = await trustUnitService.getUserTrustUnits(req.userId!);
    const voiceAuthStatus = await voiceAuthService.verifyVoiceAuth(req.userId!);
    
    const invitations = db.getInvitations();
    const sentInvitations = invitations.filter(inv => inv.senderId === req.userId);
    const receivedInvitations = invitations.filter(inv => inv.recipientPhone === user?.phone);

    res.json({
      user,
      stats: {
        memoriesCount: memories.length,
        trustUnitsCount: trustUnits.length,
        sentInvitationsCount: sentInvitations.length,
        receivedInvitationsCount: receivedInvitations.length,
        voiceAuthVerified: voiceAuthStatus
      },
      recentMemories: memories.slice(-5),
      activeTrustUnits: trustUnits.filter(unit => unit.status === 'active'),
      pendingInvitations: receivedInvitations.filter(inv => inv.status === 'pending')
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`Social Triad Game backend running on port ${port}`);
  console.log(`Health check: http://localhost:${port}/api/health`);
});
