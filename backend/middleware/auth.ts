import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/models';

export interface AuthRequest extends Request {
  userId?: string;
  user?: any;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.SESSION_SECRET!) as any;
    const session = db.getSessionByToken(token);
    
    if (!session || session.expiresAt < new Date()) {
      return res.status(403).json({ error: 'Token expired or invalid' });
    }

    const user = db.getUserById(session.userId);
    if (!user) {
      return res.status(403).json({ error: 'User not found' });
    }

    req.userId = user.id;
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

export const requireVoiceAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const voiceAuth = db.getVoiceAuthByUserId(req.userId);
  if (!voiceAuth || !voiceAuth.isVerified) {
    return res.status(403).json({ error: 'Voice authentication required' });
  }

  next();
};
