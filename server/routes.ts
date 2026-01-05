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
      console.error("Error fetching budgets:", error);
      res.status(500).json({ message: "Failed to fetch budgets" });
    }
  });

  // Retorna o próximo número de orçamento disponível
  app.get("/api/budgets/next-number", isAuthenticated, async (req, res) => {
    try {
      const nextNumber = await storage.getNextBudgetNumber();
      res.json({ nextNumber });
    } catch (error) {
      console.error("Error fetching next budget number:", error);
      res.status(500).json({ message: "Failed to fetch next budget number" });
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
      const userId = req.user.id;
      
      // Log dados recebidos para debug
      console.log("[POST /api/budgets] Received data:", JSON.stringify(req.body, null, 2));
      
      // Converter string de data para objeto Date
      const requestData = {
        ...req.body,
        createdBy: userId,
        date: req.body.date ? new Date(req.body.date) : new Date(),
      };
      
      const budgetData = insertBudgetSchema.parse(requestData);
      
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

  // Busca cliente por CNPJ no PostgreSQL
  app.get("/api/clients/lookup-by-cnpj", isAuthenticated, async (req, res) => {
    try {
      const { cnpj } = req.query;
      
      if (!cnpj || typeof cnpj !== 'string') {
        return res.status(400).json({ 
          success: false,
          message: "CNPJ é obrigatório" 
        });
      }

      // Validação de formato: deve ter 14 dígitos após normalização
      const normalizedCnpj = cnpj.replace(/\D/g, '');
      if (normalizedCnpj.length !== 14) {
        return res.status(400).json({ 
          success: false,
          message: "CNPJ inválido. Deve conter 14 dígitos." 
        });
      }

      const client = await storage.getClientByCNPJ(cnpj);
      
      if (!client) {
        return res.json({ 
          success: true,
          data: null
        });
      }
      
      // Retorna apenas os campos necessários (exclui telefone, celular, id, timestamps)
      res.json({
        success: true,
        data: {
          cnpj: client.cnpj,
          name: client.name,
          email: client.email || "",
          address: client.address,
          city: client.city,
          state: client.state,
          zip: client.zip
        }
      });
    } catch (error: any) {
      console.error("Error fetching client by CNPJ:", error);
      res.status(500).json({ 
        success: false,
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
      const userId = req.user.id;
      const clientData = insertClientSchema.parse({
        ...req.body,
        createdBy: userId,
      });
      const client = await storage.createClient(clientData);
      res.status(201).json(client);
    } catch (error: any) {
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
  
  // Lista todas as notas fiscais
  app.get("/api/invoices", isAuthenticated, async (req, res) => {
    try {
      const invoices = await storage.getInvoices();
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  // Busca nota fiscal por ID
  app.get("/api/invoices/:id", isAuthenticated, async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      console.error("Error fetching invoice:", error);
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });

  // Cria nova nota fiscal
  app.post("/api/invoices", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      console.log("[POST /api/invoices] Received data:", JSON.stringify(req.body, null, 2));
      
      const invoiceData = insertInvoiceSchema.parse({
        ...req.body,
        createdBy: userId,
      });
      
      console.log("[POST /api/invoices] Parsed data:", JSON.stringify(invoiceData, null, 2));
      
      const invoice = await storage.createInvoice(invoiceData);
      res.status(201).json(invoice);
    } catch (error: any) {
      console.error("Error creating invoice - Full error:", error);
      if (error.name === "ZodError") {
        console.error("Zod validation errors:", JSON.stringify(error.errors, null, 2));
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(400).json({ 
        message: "Failed to create invoice", 
        error: error.message || String(error)
      });
    }
  });

  // Atualiza nota fiscal
  app.patch("/api/invoices/:id", isAuthenticated, async (req, res) => {
    try {
      console.log("[PATCH /api/invoices/:id] Received data:", JSON.stringify(req.body, null, 2));
      
      // Busca invoice atual para merge com dados atualizados
      const currentInvoice = await storage.getInvoice(req.params.id);
      if (!currentInvoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Valida dados parciais usando updateInvoiceSchema
      const updateData = updateInvoiceSchema.parse(req.body);
      console.log("[PATCH /api/invoices/:id] Validated partial data:", JSON.stringify(updateData, null, 2));
      
      // Merge dados atuais com dados atualizados para validação completa
      const mergedData = {
        invoiceNumber: updateData.invoiceNumber ?? currentInvoice.invoiceNumber,
        cnpj: updateData.cnpj ?? currentInvoice.cnpj,
        clientName: updateData.clientName ?? currentInvoice.clientName,
        clientEmail: updateData.clientEmail ?? currentInvoice.clientEmail,
        serviceType: updateData.serviceType ?? currentInvoice.serviceType,
        value: updateData.value ?? currentInvoice.value,
        emissionDate: updateData.emissionDate ?? currentInvoice.emissionDate,
        dueDate: updateData.dueDate ?? currentInvoice.dueDate,
        paymentDate: updateData.paymentDate !== undefined ? updateData.paymentDate : currentInvoice.paymentDate,
        status: updateData.status ?? currentInvoice.status,
        comments: updateData.comments !== undefined ? updateData.comments : currentInvoice.comments,
        createdBy: currentInvoice.createdBy,
      };
      
      // Valida merged data com insertInvoiceSchema para garantir todas as regras
      insertInvoiceSchema.parse(mergedData);
      
      const invoice = await storage.updateInvoice(req.params.id, updateData);
      res.json(invoice);
    } catch (error: any) {
      console.error("Error updating invoice:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      if (error.message.includes("duplicate") || error.message.includes("já existe")) {
        return res.status(409).json({ 
          message: "Conflict", 
          error: error.message 
        });
      }
      res.status(400).json({ 
        message: "Failed to update invoice",
        error: error.message || String(error)
      });
    }
  });

  // Deleta nota fiscal
  app.delete("/api/invoices/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteInvoice(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting invoice:", error);
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
      const userId = req.user.id;
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
      const userId = req.user.id;
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
      const userId = req.user.id;
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

  // ========== Marketing Activity Routes (Calendar) ==========
  
  app.get("/api/marketing/activities/:year/:month", isAuthenticated, async (req, res) => {
    try {
      const year = parseInt(req.params.year);
      const month = parseInt(req.params.month);
      const activities = await storage.getMarketingActivities(year, month);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  app.get("/api/marketing/activities/:id", isAuthenticated, async (req, res) => {
    try {
      const activity = await storage.getMarketingActivity(req.params.id);
      if (!activity) {
        return res.status(404).json({ message: "Activity not found" });
      }
      res.json(activity);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activity" });
    }
  });

  app.post("/api/marketing/activities", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { date, ...rest } = req.body;
      const activityData = insertMarketingActivitySchema.parse({
        ...rest,
        date: date ? new Date(date) : new Date(),
        createdBy: userId,
      });
      const activity = await storage.createMarketingActivity(activityData);
      res.status(201).json(activity);
    } catch (error: any) {
      console.error("Error creating activity:", error);
      res.status(400).json({ message: error.message || "Failed to create activity" });
    }
  });

  app.patch("/api/marketing/activities/:id", isAuthenticated, async (req, res) => {
    try {
      const { date, ...rest } = req.body;
      const updateData = {
        ...rest,
        ...(date && { date: new Date(date) }),
      };
      const activity = await storage.updateMarketingActivity(req.params.id, updateData);
      res.json(activity);
    } catch (error) {
      res.status(400).json({ message: "Failed to update activity" });
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
      const filters = {
        clientType: req.query.client_type as string,
        contentType: req.query.content_type as string,
        search: req.query.search as string,
        tag: req.query.tag as string,
      };
      const contents = await storage.getMarketingContents(filters);
      res.json(contents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contents" });
    }
  });

  app.get("/api/marketing/content/:id", isAuthenticated, async (req, res) => {
    try {
      const content = await storage.getMarketingContent(req.params.id);
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
      const userId = req.user.id;
      const { tags, ...contentData } = req.body;
      
      const parsed = insertMarketingContentSchema.parse({
        ...contentData,
        createdBy: userId,
      });
      
      const content = await storage.createMarketingContent(parsed);
      
      if (tags && tags.length > 0) {
        await storage.setContentTags(content.id, tags);
      }
      
      res.status(201).json(content);
    } catch (error: any) {
      console.error("Error creating content:", error);
      res.status(400).json({ message: error.message || "Failed to create content" });
    }
  });

  app.patch("/api/marketing/content/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { tags, changeDescription, ...contentData } = req.body;
      const changedBy = req.user.username || req.user.email;
      
      const content = await storage.updateMarketingContent(
        req.params.id, 
        contentData, 
        changeDescription,
        changedBy
      );
      
      if (tags !== undefined) {
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
  
  app.get("/api/marketing/content/:id/comments", isAuthenticated, async (req, res) => {
    try {
      const comments = await storage.getContentComments(req.params.id);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/marketing/content/:id/comments", isAuthenticated, async (req: any, res) => {
    try {
      const commentedBy = req.user.username || req.user.email;
      const commentData = insertContentCommentSchema.parse({
        contentId: req.params.id,
        comment: req.body.comment,
        commentedBy,
      });
      const comment = await storage.createContentComment(commentData);
      res.status(201).json(comment);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create comment" });
    }
  });

  app.delete("/api/marketing/comments/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteContentComment(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  // ========== Content Tag Routes ==========
  
  app.get("/api/marketing/tags", isAuthenticated, async (req, res) => {
    try {
      const tags = await storage.getAllTags();
      res.json(tags);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tags" });
    }
  });

  app.get("/api/marketing/content/:id/tags", isAuthenticated, async (req, res) => {
    try {
      const tags = await storage.getContentTags(req.params.id);
      res.json(tags);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tags" });
    }
  });

  // ========== Marketing Metrics Routes ==========
  
  app.get("/api/marketing/metrics", isAuthenticated, async (req, res) => {
    try {
      const filters: { dateFrom?: Date; dateTo?: Date; collaborator?: string; platform?: string } = {};
      
      if (req.query.date_from) {
        filters.dateFrom = new Date(req.query.date_from as string);
      }
      if (req.query.date_to) {
        filters.dateTo = new Date(req.query.date_to as string);
      }
      if (req.query.collaborator) {
        filters.collaborator = req.query.collaborator as string;
      }
      if (req.query.platform) {
        filters.platform = req.query.platform as string;
      }
      
      const metrics = await storage.getMarketingMetrics(filters);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching metrics:", error);
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  });

  app.get("/api/marketing/metrics/:id", isAuthenticated, async (req, res) => {
    try {
      const metric = await storage.getMarketingMetric(req.params.id);
      if (!metric) {
        return res.status(404).json({ message: "Metric not found" });
      }
      res.json(metric);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch metric" });
    }
  });

  app.post("/api/marketing/metrics", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { date, openRate, activityId, ...rest } = req.body;
      const metricData = insertMarketingMetricSchema.parse({
        ...rest,
        date: date ? new Date(date) : new Date(),
        openRate: String(openRate || 0),
        activityId: (activityId && activityId !== "manual" && activityId !== "") ? activityId : null,
        createdBy: userId,
      });
      const metric = await storage.createMarketingMetric(metricData);
      res.status(201).json(metric);
    } catch (error: any) {
      console.error("Error creating metric:", error);
      res.status(400).json({ message: error.message || "Failed to create metric" });
    }
  });

  app.patch("/api/marketing/metrics/:id", isAuthenticated, async (req, res) => {
    try {
      const metric = await storage.updateMarketingMetric(req.params.id, req.body);
      res.json(metric);
    } catch (error) {
      res.status(400).json({ message: "Failed to update metric" });
    }
  });

  app.delete("/api/marketing/metrics/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteMarketingMetric(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete metric" });
    }
  });

  // Get all activities for dropdown (without month filter)
  app.get("/api/marketing/all-activities", isAuthenticated, async (req, res) => {
    try {
      // Get activities from last 6 months
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
