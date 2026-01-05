/**
 * Local Authentication Setup with JWT
 * 
 * Implementa autenticação local com username/password usando bcrypt e JWT.
 * Tokens são armazenados no localStorage do cliente (funciona em iframes/preview).
 */

import type { Express, RequestHandler } from "express";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { insertUserSchema, loginSchema } from "@shared/schema";

const SALT_ROUNDS = 10;
const JWT_EXPIRY = "7d"; // 7 dias

function getJwtSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is required");
  }
  return secret;
}

function generateToken(userId: string): string {
  return jwt.sign({ userId }, getJwtSecret(), { expiresIn: JWT_EXPIRY });
}

function verifyToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as { userId: string };
    return decoded;
  } catch {
    return null;
  }
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);

  // Registro de novo usuário
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Verificar se username já existe
      const existingUsername = await storage.getUserByUsername(validatedData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Nome de usuário já está em uso" });
      }
      
      // Verificar se email já existe
      const existingEmail = await storage.getUserByEmail(validatedData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "E-mail já está cadastrado" });
      }
      
      // Hash da senha
      const passwordHash = await bcrypt.hash(validatedData.password, SALT_ROUNDS);
      
      // Criar usuário
      const user = await storage.createUser({
        username: validatedData.username,
        email: validatedData.email,
        passwordHash,
      });
      
      // Gerar token JWT
      const token = generateToken(user.id);
      
      res.status(201).json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
        token,
      });
    } catch (error: any) {
      console.error("Register error:", error);
      if (error.errors) {
        return res.status(400).json({ message: error.errors[0]?.message || "Dados inválidos" });
      }
      res.status(500).json({ message: "Erro ao criar conta" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      
      // Buscar usuário
      const user = await storage.getUserByUsername(validatedData.username);
      if (!user) {
        return res.status(401).json({ message: "Usuário ou senha inválidos" });
      }
      
      // Verificar senha
      const passwordMatch = await bcrypt.compare(validatedData.password, user.passwordHash);
      if (!passwordMatch) {
        return res.status(401).json({ message: "Usuário ou senha inválidos" });
      }
      
      // Gerar token JWT
      const token = generateToken(user.id);
      
      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
        token,
      });
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.errors) {
        return res.status(400).json({ message: error.errors[0]?.message || "Dados inválidos" });
      }
      res.status(500).json({ message: "Erro ao fazer login" });
    }
  });

  // Logout (apenas para limpar token no cliente - não faz nada no servidor com JWT)
  app.post("/api/auth/logout", (_req, res) => {
    res.json({ message: "Logout realizado com sucesso" });
  });

  // Retorna usuário atual (baseado no token)
  app.get("/api/auth/user", async (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
    });
  });
}

/**
 * Middleware de autenticação JWT
 * Protege rotas que requerem usuário autenticado
 */
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const user = await storage.getUser(decoded.userId);
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  // Adiciona user ao request para uso posterior
  (req as any).user = user;
  next();
};
