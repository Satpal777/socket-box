import { Request, Response, NextFunction } from 'express';
import { createRemoteJWKSet, jwtVerify } from 'jose';

// Define user type for request
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

const JWKS_URL = `${process.env.AURA_AUTH_URL}/.well-known/jwks.json`;
const ISSUER = process.env.AURA_AUTH_URL;
const AUDIENCE = process.env.CLIENT_ID;

const JWKS = createRemoteJWKSet(new URL(JWKS_URL));

export const verifyToken = async (token: string) => {
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: ISSUER,
  });
  return payload;
};

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = await verifyToken(token);
    // Attach user to request
    req.user = payload;
    next();
  } catch (error) {
    console.error('JWT Verification Error:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
