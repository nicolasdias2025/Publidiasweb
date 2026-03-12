/**
 * API Routes - Sistema Corporativo
 * 
 * Define todas as rotas REST do sistema seguindo o padrão:
 * - GET /api/resource - Lista todos
 * - GET /api/resource/:id - Busca por ID
 * - POST /api/resource - Cria novo
 * - PATCH /api/resource/:id - Atualiza
 * - DELETE /api/resource/:id - Remove
 */

import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./localAuth";
import { 
  insertBudgetSchema,
  insertClientSchema,
  insertInvoiceSchema,
  updateInvoiceSchema,
  insertDocumentSchema,
  insertProcessSchema,
  insertCampaignSchema,
  insertLeadSchema,
  insertMarketingActivitySchema,
  insertMarketingContentSchema,
  insertContentCommentSchema,
  insertMarketingMetricSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // ========== Auth Setup ==========
  await setupAuth(app);

  // ========== Budget Routes ==========
  
  // Lista todos os orçamentos
  app.get("/api/budgets", isAuthenticated, async (req, res) => {
    try {
      const budgets = await storage.getBudgets();
      res.json(budgets);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch budgets" });
    }
  });


  // Cria novo orçamento
  app.post("/api/budgets", isAuthenticated, async (req: any, res) => {
    try {
      const validation = insertBudgetSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ errors: validation.error.errors });
      }
      const budget = await storage.createBudget({
        ...validation.data,
        createdBy: req.user.id,
      });
      res.status(201).json(budget);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create budget" });
    }
  });

  // Atualiza orçamento
  app.patch("/api/budgets/:id", isAuthenticated, async (req: any, res) => {
    try {
      const validation = insertBudgetSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ errors: validation.error.errors });
      }
      const budget = await storage.updateBudget(req.params.id, validation.data);
      res.json(budget);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update budget" });
    }
  });

  // Deleta orçamento
  app.delete("/api/budgets/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteBudget(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete budget" });
    }
  });

  // ========== Client Routes ==========

  app.get("/api/clients", isAuthenticated, async (req, res) => {
    try {
      const clients = await storage.getClients();
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });


  app.post("/api/clients", isAuthenticated, async (req: any, res) => {
    try {
      const validation = insertClientSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ errors: validation.error.errors });
      }
      const client = await storage.createClient(validation.data);
      res.status(201).json(client);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create client" });
    }
  });

  app.patch("/api/clients/:id", isAuthenticated, async (req: any, res) => {
    try {
      const validation = insertClientSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ errors: validation.error.errors });
      }
      const client = await storage.updateClient(req.params.id, validation.data);
      res.json(client);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteClient(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // ========== Auth Routes (Local) ==========

  app.get("/api/admin/users", isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Acesso negado" });
      }
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/admin/users", isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const { username, tempPassword } = req.body;
      if (!username || !tempPassword) {
        return res.status(400).json({ message: "Username e tempPassword são obrigatórios" });
      }

      const user = await storage.createUser({
        username,
        passwordHash: tempPassword,
        role: "user",
        requirePasswordChange: true,
      });

      res.status(201).json(user);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create user" });
    }
  });

  app.delete("/api/admin/users/:id", isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Acesso negado" });
      }
      await storage.deleteUser(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // ========== Invoice Routes ==========

  app.get("/api/invoices", isAuthenticated, async (req, res) => {
    try {
      const invoices = await storage.getInvoices();
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });


  app.post("/api/invoices", isAuthenticated, async (req: any, res) => {
    try {
      const validation = insertInvoiceSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ errors: validation.error.errors });
      }
      const invoice = await storage.createInvoice(validation.data);
      res.status(201).json(invoice);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create invoice" });
    }
  });

  app.patch("/api/invoices/:id", isAuthenticated, async (req: any, res) => {
    try {
      const validation = updateInvoiceSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ errors: validation.error.errors });
      }
      const invoice = await storage.updateInvoice(req.params.id, validation.data);
      res.json(invoice);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update invoice" });
    }
  });

  app.delete("/api/invoices/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteInvoice(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete invoice" });
    }
  });

  // ========== Document Routes ==========

  app.get("/api/documents", isAuthenticated, async (req, res) => {
    try {
      const documents = await storage.getDocuments();
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.post("/api/documents", isAuthenticated, async (req: any, res) => {
    try {
      const validation = insertDocumentSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ errors: validation.error.errors });
      }
      const document = await storage.createDocument(validation.data);
      res.status(201).json(document);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create document" });
    }
  });


  // ========== Process Routes ==========

  app.get("/api/processes", isAuthenticated, async (req, res) => {
    try {
      const processes = await storage.getProcesses();
      res.json(processes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch processes" });
    }
  });

  app.post("/api/processes", isAuthenticated, async (req: any, res) => {
    try {
      const validation = insertProcessSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ errors: validation.error.errors });
      }
      const process = await storage.createProcess(validation.data);
      res.status(201).json(process);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create process" });
    }
  });


  // ========== Campaign Routes ==========

  app.get("/api/campaigns", isAuthenticated, async (req, res) => {
    try {
      const campaigns = await storage.getCampaigns();
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  app.post("/api/campaigns", isAuthenticated, async (req: any, res) => {
    try {
      const validation = insertCampaignSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ errors: validation.error.errors });
      }
      const campaign = await storage.createCampaign(validation.data);
      res.status(201).json(campaign);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create campaign" });
    }
  });


  // ========== Lead Routes ==========

  app.get("/api/leads", isAuthenticated, async (req, res) => {
    try {
      const leads = await storage.getLeads();
      res.json(leads);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  app.post("/api/leads", isAuthenticated, async (req: any, res) => {
    try {
      const validation = insertLeadSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ errors: validation.error.errors });
      }
      const lead = await storage.createLead(validation.data);
      res.status(201).json(lead);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create lead" });
    }
  });


  // ========== Authorization Routes ==========

  app.get("/api/authorizations", isAuthenticated, async (req, res) => {
    try {
      const authorizations = await storage.getAuthorizations();
      res.json(authorizations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch authorizations" });
    }
  });


  app.post("/api/authorizations", isAuthenticated, async (req: any, res) => {
    try {
      const validation = insertCampaignSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ errors: validation.error.errors });
      }
      const authorization = await storage.createAuthorization(validation.data as any);
      res.status(201).json(authorization);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create authorization" });
    }
  });

  app.patch("/api/authorizations/:id", isAuthenticated, async (req: any, res) => {
    try {
      const validation = insertCampaignSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ errors: validation.error.errors });
      }
      const authorization = await storage.updateAuthorization(req.params.id, validation.data as any);
      res.json(authorization);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update authorization" });
    }
  });

  app.delete("/api/authorizations/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteAuthorization(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete authorization" });
    }
  });

  // ========== Marketing Activity Routes ==========

  app.get("/api/marketing/activities/:year/:month", isAuthenticated, async (req, res) => {
    try {
      const activities = await storage.getMarketingActivities(
        parseInt(req.params.year),
        parseInt(req.params.month)
      );
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  app.post("/api/marketing/activities", isAuthenticated, async (req: any, res) => {
    try {
      const validation = insertMarketingActivitySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ errors: validation.error.errors });
      }
      const activity = await storage.createMarketingActivity({
        ...validation.data,
        createdBy: req.user.id,
      });
      res.status(201).json(activity);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create activity" });
    }
  });

  app.patch("/api/marketing/activities/:id", isAuthenticated, async (req: any, res) => {
    try {
      const validation = insertMarketingActivitySchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ errors: validation.error.errors });
      }
      const activity = await storage.updateMarketingActivity(req.params.id, validation.data);
      res.json(activity);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update activity" });
    }
  });

  app.delete("/api/marketing/activities/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteMarketingActivity(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete activity" });
    }
  });

  // ========== Marketing Content Routes ==========

  app.get("/api/marketing/content", isAuthenticated, async (req, res) => {
    try {
      const content = await storage.getMarketingContent();
      res.json(content);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch content" });
    }
  });

  app.get("/api/marketing/content/:id", isAuthenticated, async (req, res) => {
    try {
      const content = await storage.getMarketingContentById(req.params.id);
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }
      res.json(content);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch content" });
    }
  });

  app.post("/api/marketing/content", isAuthenticated, async (req: any, res) => {
    try {
      const validation = insertMarketingContentSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ errors: validation.error.errors });
      }

      const { tags, ...data } = validation.data;
      const content = await storage.createMarketingContent({
        ...data,
        createdBy: req.user.id,
      });

      if (tags && tags.length > 0) {
        await storage.setContentTags(content.id, tags);
      }

      res.status(201).json(content);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create content" });
    }
  });

  app.patch("/api/marketing/content/:id", isAuthenticated, async (req: any, res) => {
    try {
      const validation = insertMarketingContentSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ errors: validation.error.errors });
      }

      const { tags, ...data } = validation.data;
      const content = await storage.updateMarketingContent(req.params.id, data);

      if (tags) {
        await storage.setContentTags(content.id, tags);
      }

      res.json(content);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update content" });
    }
  });

  app.delete("/api/marketing/content/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteMarketingContent(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete content" });
    }
  });

  // ========== Content Version Routes ==========

  app.get("/api/marketing/content/:id/versions", isAuthenticated, async (req, res) => {
    try {
      const versions = await storage.getContentVersions(req.params.id);
      res.json(versions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch versions" });
    }
  });

  app.post("/api/marketing/content/:id/restore/:version", isAuthenticated, async (req: any, res) => {
    try {
      const changedBy = req.user.username || req.user.email;
      const content = await storage.restoreContentVersion(
        req.params.id,
        parseInt(req.params.version),
        changedBy
      );
      res.json(content);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to restore version" });
    }
  });

  // ========== Content Comment Routes ==========

  app.post("/api/marketing/content/:id/comments", isAuthenticated, async (req: any, res) => {
    try {
      const validation = insertContentCommentSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ errors: validation.error.errors });
      }

      const comment = await storage.createContentComment({
        ...validation.data,
        contentId: req.params.id,
        createdBy: req.user.id,
      });

      res.status(201).json(comment);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create comment" });
    }
  });

  app.get("/api/marketing/content/:id/comments", isAuthenticated, async (req, res) => {
    try {
      const comments = await storage.getContentComments(req.params.id);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // ========== Marketing Metrics Routes ==========

  app.post("/api/marketing/metrics", isAuthenticated, async (req: any, res) => {
    try {
      const validation = insertMarketingMetricSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ errors: validation.error.errors });
      }

      const metric = await storage.createMarketingMetric({
        ...validation.data,
        createdBy: req.user.id,
      });

      res.status(201).json(metric);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create metric" });
    }
  });

  // ========== Google Sheets Client Lookup ==========

  app.get("/api/clients/lookup", isAuthenticated, async (req, res) => {
    try {
      const cnpj = (req.query.cnpj as string) || "";
      if (!cnpj) {
        return res.status(400).json({ message: "CNPJ is required" });
      }
      const client = await storage.lookupClientByCnpj(cnpj);
      res.json(client);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to lookup client" });
    }
  });

  // ========== Audit Log Routes ==========

  app.get("/api/audit-logs", isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const page = parseInt(req.query.page || "1");
      const limit = parseInt(req.query.limit || "50");
      const result = await storage.getAuditLogs({
        page,
        limit,
        action: req.query.action,
        entityType: req.query.entityType,
        userId: req.query.userId,
      });

      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // ========== Marketing all activities ==========

  app.get("/api/marketing/all-activities", isAuthenticated, async (req, res) => {
    try {
      const now = new Date();
      const activities = [];
      for (let i = 0; i < 6; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthActivities = await storage.getMarketingActivities(date.getFullYear(), date.getMonth() + 1);
        activities.push(...monthActivities);
      }
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
