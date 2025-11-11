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
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertBudgetSchema,
  insertClientSchema,
  insertInvoiceSchema,
  insertDocumentSchema,
  insertProcessSchema,
  insertCampaignSchema,
  insertLeadSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // ========== Auth Setup ==========
  await setupAuth(app);

  // ========== Auth Routes ==========
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ========== Budget Routes ==========
  
  // Lista todos os orçamentos
  app.get("/api/budgets", isAuthenticated, async (req, res) => {
    try {
      const budgets = await storage.getBudgets();
      res.json(budgets);
    } catch (error) {
      console.error("Error fetching budgets:", error);
      res.status(500).json({ message: "Failed to fetch budgets" });
    }
  });

  // Busca orçamento por ID
  app.get("/api/budgets/:id", isAuthenticated, async (req, res) => {
    try {
      const budget = await storage.getBudget(req.params.id);
      if (!budget) {
        return res.status(404).json({ message: "Budget not found" });
      }
      res.json(budget);
    } catch (error) {
      console.error("Error fetching budget:", error);
      res.status(500).json({ message: "Failed to fetch budget" });
    }
  });

  // Cria novo orçamento
  app.post("/api/budgets", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Log dados recebidos para debug
      console.log("[POST /api/budgets] Received data:", JSON.stringify(req.body, null, 2));
      
      const budgetData = insertBudgetSchema.parse({
        ...req.body,
        createdBy: userId,
      });
      
      console.log("[POST /api/budgets] Parsed data:", JSON.stringify(budgetData, null, 2));
      
      const budget = await storage.createBudget(budgetData);
      res.status(201).json(budget);
    } catch (error: any) {
      console.error("Error creating budget - Full error:", error);
      if (error.name === "ZodError") {
        console.error("Zod validation errors:", JSON.stringify(error.errors, null, 2));
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(400).json({ 
        message: "Failed to create budget", 
        error: error.message || String(error)
      });
    }
  });

  // Atualiza orçamento
  app.patch("/api/budgets/:id", isAuthenticated, async (req, res) => {
    try {
      const budget = await storage.updateBudget(req.params.id, req.body);
      res.json(budget);
    } catch (error) {
      console.error("Error updating budget:", error);
      res.status(400).json({ message: "Failed to update budget" });
    }
  });

  // Deleta orçamento
  app.delete("/api/budgets/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteBudget(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting budget:", error);
      res.status(500).json({ message: "Failed to delete budget" });
    }
  });

  // ========== Client Routes ==========
  
  // Lista todos os clientes
  app.get("/api/clients", isAuthenticated, async (req, res) => {
    try {
      const clients = await storage.getClients();
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  // Busca cliente por CNPJ no Google Sheets (lookup)
  app.get("/api/clients/lookup", isAuthenticated, async (req, res) => {
    try {
      const { cnpj } = req.query;
      
      if (!cnpj || typeof cnpj !== 'string') {
        return res.status(400).json({ 
          message: "CNPJ é obrigatório" 
        });
      }

      // Validação de formato: deve ter 14 dígitos após normalização
      const normalizedCnpj = cnpj.replace(/\D/g, '');
      if (normalizedCnpj.length !== 14) {
        return res.status(400).json({ 
          message: "CNPJ inválido. Deve conter 14 dígitos." 
        });
      }

      const { googleSheetsService } = await import("./services/googleSheetsService");
      const clientData = await googleSheetsService.findClientByCnpj(cnpj);
      
      if (!clientData) {
        return res.status(404).json({ 
          message: "Cliente não cadastrado. Preencha os dados manualmente." 
        });
      }
      
      res.json(clientData);
    } catch (error: any) {
      console.error("Error fetching client data:", error);
      res.status(500).json({ 
        message: error.message || "Erro ao consultar dados do cliente" 
      });
    }
  });

  // Busca cliente por ID
  app.get("/api/clients/:id", isAuthenticated, async (req, res) => {
    try {
      const client = await storage.getClient(req.params.id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      console.error("Error fetching client:", error);
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  // Cria novo cliente
  app.post("/api/clients", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const clientData = insertClientSchema.parse({
        ...req.body,
        createdBy: userId,
      });
      const client = await storage.createClient(clientData);
      res.status(201).json(client);
    } catch (error) {
      console.error("Error creating client:", error);
      res.status(400).json({ 
        message: "Failed to create client",
        error: error.message || String(error)
      });
    }
  });

  // Atualiza cliente
  app.patch("/api/clients/:id", isAuthenticated, async (req, res) => {
    try {
      const client = await storage.updateClient(req.params.id, req.body);
      res.json(client);
    } catch (error) {
      console.error("Error updating client:", error);
      res.status(400).json({ message: "Failed to update client" });
    }
  });

  // Deleta cliente
  app.delete("/api/clients/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteClient(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting client:", error);
      res.status(500).json({ message: "Failed to delete client" });
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
      const userId = req.user.claims.sub;
      const invoiceData = insertInvoiceSchema.parse({
        ...req.body,
        issuedBy: userId,
      });
      const invoice = await storage.createInvoice(invoiceData);
      res.status(201).json(invoice);
    } catch (error) {
      res.status(400).json({ message: "Failed to create invoice" });
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
      const userId = req.user.claims.sub;
      const documentData = insertDocumentSchema.parse({
        ...req.body,
        uploadedBy: userId,
      });
      const document = await storage.createDocument(documentData);
      res.status(201).json(document);
    } catch (error) {
      res.status(400).json({ message: "Failed to create document" });
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
      const userId = req.user.claims.sub;
      const processData = insertProcessSchema.parse({
        ...req.body,
        createdBy: userId,
      });
      const process = await storage.createProcess(processData);
      res.status(201).json(process);
    } catch (error) {
      res.status(400).json({ message: "Failed to create process" });
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
      const userId = req.user.claims.sub;
      const campaignData = insertCampaignSchema.parse({
        ...req.body,
        createdBy: userId,
      });
      const campaign = await storage.createCampaign(campaignData);
      res.status(201).json(campaign);
    } catch (error) {
      res.status(400).json({ message: "Failed to create campaign" });
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
      const leadData = insertLeadSchema.parse(req.body);
      const lead = await storage.createLead(leadData);
      res.status(201).json(lead);
    } catch (error) {
      res.status(400).json({ message: "Failed to create lead" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
