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
import { loginSchema } from "@shared/schema";
import { z } from "zod";

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

const createUserSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
});

const changePasswordSchema = z.object({
  newPassword: z.string().min(6, "Nova senha deve ter pelo menos 6 caracteres"),
});

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);

  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(validatedData.username);
      if (!user) {
        return res.status(401).json({ message: "Usuário ou senha inválidos" });
      }
      
      const passwordMatch = await bcrypt.compare(validatedData.password, user.passwordHash);
      if (!passwordMatch) {
        return res.status(401).json({ message: "Usuário ou senha inválidos" });
      }
      
      const token = generateToken(user.id);
      
      res.json({
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          requirePasswordChange: user.requirePasswordChange,
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

  // Logout (JWT é stateless — apenas instrução ao cliente de descartar o token)
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
      role: user.role,
      requirePasswordChange: user.requirePasswordChange,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
    });
  });

  // Troca de senha obrigatória no primeiro acesso (requer auth)
  app.patch("/api/auth/change-password", isAuthenticated, async (req, res) => {
    try {
      const { newPassword } = changePasswordSchema.parse(req.body);
      const user = (req as any).user;

      const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
      await storage.updateUser(user.id, {
        passwordHash,
        requirePasswordChange: false,
      });

      res.json({ message: "Senha alterada com sucesso" });
    } catch (error: any) {
      console.error("Change password error:", error);
      if (error.errors) {
        return res.status(400).json({ message: error.errors[0]?.message || "Dados inválidos" });
      }
      res.status(500).json({ message: "Erro ao alterar senha" });
    }
  });

  // ── Admin: listar usuários (apenas role admin) ──────────────────────────────
  app.get("/api/admin/users", isAuthenticated, isAdmin, async (_req, res) => {
    try {
      const allUsers = await storage.getUsers();
      res.json(allUsers.map((u) => ({
        id: u.id,
        username: u.username,
        role: u.role,
        requirePasswordChange: u.requirePasswordChange,
        createdAt: u.createdAt,
      })));
    } catch (error) {
      res.status(500).json({ message: "Erro ao listar usuários" });
    }
  });

  // ── Admin: criar novo colaborador (apenas role admin) ───────────────────────
  app.post("/api/admin/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { username, password } = createUserSchema.parse(req.body);

      const existing = await storage.getUserByUsername(username);
      if (existing) {
        return res.status(400).json({ message: "Nome de usuário já está em uso" });
      }

      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      const user = await storage.createUser({
        username,
        passwordHash,
        role: "user",
        requirePasswordChange: true,
      });

      res.status(201).json({
        id: user.id,
        username: user.username,
        role: user.role,
        requirePasswordChange: user.requirePasswordChange,
      });
    } catch (error: any) {
      console.error("Admin create user error:", error);
      if (error.errors) {
        return res.status(400).json({ message: error.errors[0]?.message || "Dados inválidos" });
      }
      res.status(500).json({ message: "Erro ao criar colaborador" });
    }
  });

  // ── Admin: deletar colaborador (apenas role admin) ──────────────────────────
  app.delete("/api/admin/users/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const requestingUser = (req as any).user;
      
      console.log(`[DELETE USER] Attempting to delete user ${id} by admin ${requestingUser.username}`);
      
      if (requestingUser.id === id) {
        return res.status(400).json({ message: "Você não pode deletar sua própria conta" });
      }

      const userToDelete = await storage.getUser(id);
      if (!userToDelete) {
        return res.status(404).json({ message: "Colaborador não encontrado" });
      }

      console.log(`[DELETE USER] User found: ${userToDelete.username}, attempting delete...`);

      // Delete do banco de dados
      await storage.deleteUser(id);
      
      console.log(`[DELETE USER] Successfully deleted user ${id}`);
      res.json({ message: `Colaborador ${userToDelete.username} foi removido do sistema` });
    } catch (error: any) {
      console.error("[DELETE USER] Error:", error?.message || error);
      console.error("[DELETE USER] Full error:", error);
      res.status(500).json({ message: `Erro ao remover colaborador: ${error?.message || 'Erro desconhecido'}` });
    }
  });
}

/**
 * Middleware de autenticação JWT
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
  
  (req as any).user = user;
  next();
};

/**
 * Middleware de autorização — apenas admins
 */
export const isAdmin: RequestHandler = (req, res, next) => {
  const user = (req as any).user;
  if (!user || user.role !== "admin") {
    return res.status(403).json({ message: "Acesso negado. Apenas administradores." });
  }
  next();
};
