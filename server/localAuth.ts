/**
 * Local Authentication Setup
 * 
 * Implementa autenticação local com username/password usando bcrypt.
 */

import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import { insertUserSchema, loginSchema } from "@shared/schema";

const SALT_ROUNDS = 10;

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 semana
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  const isProduction = !!(process.env.NODE_ENV === "production" || process.env.REPL_ID);
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    proxy: isProduction,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" as const : "lax" as const,
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

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
      
      // Criar sessão e salvar explicitamente
      (req.session as any).userId = user.id;
      
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Erro ao criar sessão" });
        }
        
        res.status(201).json({
          id: user.id,
          username: user.username,
          email: user.email,
        });
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
      
      // Criar sessão e salvar explicitamente
      (req.session as any).userId = user.id;
      
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Erro ao criar sessão" });
        }
        
        res.json({
          id: user.id,
          username: user.username,
          email: user.email,
        });
      });
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.errors) {
        return res.status(400).json({ message: error.errors[0]?.message || "Dados inválidos" });
      }
      res.status(500).json({ message: "Erro ao fazer login" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Erro ao fazer logout" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logout realizado com sucesso" });
    });
  });

  // Retorna usuário atual
  app.get("/api/auth/user", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const user = await storage.getUser(userId);
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
 * Middleware de autenticação
 * Protege rotas que requerem usuário autenticado
 */
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const userId = (req.session as any)?.userId;
  
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const user = await storage.getUser(userId);
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  // Adiciona user ao request para uso posterior
  (req as any).user = user;
  next();
};
