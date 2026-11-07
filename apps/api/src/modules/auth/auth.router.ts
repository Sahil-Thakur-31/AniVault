import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../../database/db.service.js';
import { registerSchema, loginSchema, updatePreferencesSchema } from '@anivault/validation';
import { RatingSystem } from '@anivault/shared-types';
import crypto from 'crypto';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_anivault_super_secure';

// Helper to extract authenticated user
export function getAuthUser(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    return payload.userId;
  } catch {
    return null;
  }
}

// Register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = registerSchema.parse(req.body);

    // Check duplicate email or username
    for (const u of db.users.values()) {
      if (u.email.toLowerCase() === validated.email.toLowerCase()) {
        res.status(409).json({ message: 'Email already registered' });
        return;
      }
      if (u.username.toLowerCase() === validated.username.toLowerCase()) {
        res.status(409).json({ message: 'Username already taken' });
        return;
      }
    }

    const passwordHash = await bcrypt.hash(validated.password, 10);
    const userId = crypto.randomUUID();

    const newUser = {
      id: userId,
      email: validated.email,
      username: validated.username,
      avatarUrl: null,
      isActive: true,
      passwordHash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.users.set(userId, newUser);

    // Default preferences
    db.userPreferences.set(userId, {
      userId,
      preferredTheme: 'midnight',
      ratingSystem: RatingSystem.POINT_10_DECIMAL,
      spoilerProtectionLevel: 'STRICT',
      preferredTitleLanguage: 'ROMAJI',
      enablePushNotifications: true,
      autoSyncIntervalMinutes: 60
    });

    const accessToken = jwt.sign({ userId, username: validated.username }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      user: {
        id: userId,
        email: validated.email,
        username: validated.username,
        avatarUrl: null
      },
      accessToken
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Registration failed' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = loginSchema.parse(req.body);

    let foundUser: any = null;
    for (const u of db.users.values()) {
      if (u.email.toLowerCase() === validated.email.toLowerCase()) {
        foundUser = u;
        break;
      }
    }

    if (!foundUser) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const isValid = await bcrypt.compare(validated.password, foundUser.passwordHash);
    if (!isValid) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const accessToken = jwt.sign({ userId: foundUser.id, username: foundUser.username }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      user: {
        id: foundUser.id,
        email: foundUser.email,
        username: foundUser.username,
        avatarUrl: foundUser.avatarUrl
      },
      accessToken
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Login failed' });
  }
});

// Me
router.get('/me', (req: Request, res: Response): void => {
  const userId = getAuthUser(req);
  if (!userId || !db.users.has(userId)) {
    // If not authenticated, return demo user for immediate playground experience
    const demoUser = Array.from(db.users.values())[0];
    if (demoUser) {
      const preferences = db.userPreferences.get(demoUser.id);
      res.json({ user: demoUser, preferences });
      return;
    }
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const user = db.users.get(userId)!;
  const preferences = db.userPreferences.get(userId);
  res.json({
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      avatarUrl: user.avatarUrl
    },
    preferences
  });
});

export const authRouter = router;

