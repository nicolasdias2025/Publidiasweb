/**
 * Storage Layer - Sistema Corporativo
 * 
 * Camada de persistência usando PostgreSQL com Drizzle ORM.
 * Implementa todas as operações CRUD para todos os módulos do sistema.
 */

import {
  users,
  budgets,
  clients,
  invoices,
  documents,
  processes,
  campaigns,
  leads,
  marketingActivities,
  marketingContent,
  contentVersions,
  contentComments,
  contentTags,
  marketingMetrics,
  authorizations,
  type User,
  type UpsertUser,
  type Budget,
  type InsertBudget,
  type Client,
  type InsertClient,
  type Invoice,
  type InsertInvoice,
  type Document,
  type InsertDocument,
  type Process,
  type InsertProcess,
  type Campaign,
  type InsertCampaign,
  type Lead,
  type InsertLead,
  type MarketingActivity,
  type InsertMarketingActivity,
  type MarketingContent,
  type InsertMarketingContent,
  type ContentVersion,
  type InsertContentVersion,
  type ContentComment,
  type InsertContentComment,
  type ContentTag,
  type InsertContentTag,
  type MarketingMetric,
  type InsertMarketingMetric,
  type Authorization,
  type InsertAuthorization,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, gte, lte, like, ilike } from "drizzle-orm";

/**
 * Interface de Storage
 * Define todos os métodos CRUD disponíveis no sistema
 */
export interface IStorage {
  // ========== User Operations (Local Auth) ==========
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  
  // ========== Budget Operations ==========
  getBudgets(): Promise<Budget[]>;
  getBudget(id: string): Promise<Budget | undefined>;
  createBudget(budget: InsertBudget): Promise<Budget>;
  updateBudget(id: string, budget: Partial<InsertBudget>): Promise<Budget>;
  deleteBudget(id: string): Promise<void>;
  getNextBudgetNumber(): Promise<number>;
  
  // ========== Client Operations ==========
  getClients(): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  getClientByCNPJ(cnpj: string): Promise<Client | null>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: Partial<InsertClient>): Promise<Client>;
  deleteClient(id: string): Promise<void>;
  
  // ========== Invoice Operations ==========
  getInvoices(): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice>;
  deleteInvoice(id: string): Promise<void>;
  
  // ========== Document Operations ==========
  getDocuments(): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  
  // ========== Process Operations ==========
  getProcesses(): Promise<Process[]>;
  createProcess(process: InsertProcess): Promise<Process>;
  
  // ========== Campaign Operations ==========
  getCampaigns(): Promise<Campaign[]>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  
  // ========== Lead Operations ==========
  getLeads(): Promise<Lead[]>;
  createLead(lead: InsertLead): Promise<Lead>;
  
  // ========== Marketing Activity Operations ==========
  getMarketingActivities(year: number, month: number): Promise<MarketingActivity[]>;
  getMarketingActivity(id: string): Promise<MarketingActivity | undefined>;
  createMarketingActivity(activity: InsertMarketingActivity): Promise<MarketingActivity>;
  updateMarketingActivity(id: string, activity: Partial<InsertMarketingActivity>): Promise<MarketingActivity>;
  deleteMarketingActivity(id: string): Promise<void>;
  
  // ========== Marketing Content Operations ==========
  getMarketingContents(filters?: { clientType?: string; contentType?: string; search?: string; tag?: string }): Promise<MarketingContent[]>;
  getMarketingContent(id: string): Promise<MarketingContent | undefined>;
  createMarketingContent(content: InsertMarketingContent): Promise<MarketingContent>;
  updateMarketingContent(id: string, content: Partial<InsertMarketingContent>, changeDescription?: string, changedBy?: string): Promise<MarketingContent>;
  deleteMarketingContent(id: string): Promise<void>;
  
  // ========== Content Version Operations ==========
  getContentVersions(contentId: string): Promise<ContentVersion[]>;
  restoreContentVersion(contentId: string, versionNumber: number, changedBy: string): Promise<MarketingContent>;
  
  // ========== Content Comment Operations ==========
  getContentComments(contentId: string): Promise<ContentComment[]>;
  createContentComment(comment: InsertContentComment): Promise<ContentComment>;
  deleteContentComment(id: string): Promise<void>;
  
  // ========== Content Tag Operations ==========
  getContentTags(contentId: string): Promise<ContentTag[]>;
  getAllTags(): Promise<string[]>;
  setContentTags(contentId: string, tags: string[]): Promise<void>;
  
  // ========== Marketing Metric Operations ==========
  getMarketingMetrics(filters?: { dateFrom?: Date; dateTo?: Date; collaborator?: string; platform?: string }): Promise<MarketingMetric[]>;
  getMarketingMetric(id: string): Promise<MarketingMetric | undefined>;
  createMarketingMetric(metric: InsertMarketingMetric): Promise<MarketingMetric>;
  updateMarketingMetric(id: string, metric: Partial<InsertMarketingMetric>): Promise<MarketingMetric>;
  deleteMarketingMetric(id: string): Promise<void>;
  getMetricsByActivity(activityId: string): Promise<MarketingMetric[]>;
  
  // ========== Authorization Operations ==========
  getAuthorizations(filters?: { dateFrom?: Date; dateTo?: Date; clientName?: string; jornal?: string }): Promise<Authorization[]>;
  getAuthorization(id: string): Promise<Authorization | undefined>;
  createAuthorization(authorization: InsertAuthorization): Promise<Authorization>;
  updateAuthorization(id: string, authorization: Partial<InsertAuthorization>): Promise<Authorization>;
  deleteAuthorization(id: string): Promise<void>;
}

/**
 * Implementação de Storage usando PostgreSQL
 */
export class DatabaseStorage implements IStorage {
  
  // ========== User Operations (Local Auth) ==========
  
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }
  
  // ========== Budget Operations ==========
  
  async getBudgets(): Promise<Budget[]> {
    return await db.select().from(budgets).orderBy(desc(budgets.createdAt));
  }
  
  async getBudget(id: string): Promise<Budget | undefined> {
    const [budget] = await db.select().from(budgets).where(eq(budgets.id, id));
    return budget;
  }
  
  async createBudget(budgetData: InsertBudget): Promise<Budget> {
    const [budget] = await db.insert(budgets).values(budgetData).returning();
    return budget;
  }
  
  async updateBudget(id: string, budgetData: Partial<InsertBudget>): Promise<Budget> {
    const [budget] = await db
      .update(budgets)
      .set({ ...budgetData, updatedAt: new Date() })
      .where(eq(budgets.id, id))
      .returning();
    return budget;
  }
  
  async deleteBudget(id: string): Promise<void> {
    await db.delete(budgets).where(eq(budgets.id, id));
  }

  async getNextBudgetNumber(): Promise<number> {
    // Query the sequence to get the next value preview (without consuming it)
    const result = await db.execute(sql`
      SELECT COALESCE(
        (SELECT last_value + 1 FROM budget_number_seq WHERE is_called = true),
        (SELECT last_value FROM budget_number_seq WHERE is_called = false),
        1
      ) as next_number
    `);
    return Number((result.rows[0] as any)?.next_number || 1);
  }
  
  // ========== Client Operations ==========
  
  async getClients(): Promise<Client[]> {
    return await db.select().from(clients).orderBy(desc(clients.createdAt));
  }
  
  async getClient(id: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }
  
  async getClientByCNPJ(cnpj: string): Promise<Client | null> {
    const normalizedCNPJ = cnpj.replace(/[^\d]/g, '');
    const results = await db
      .select()
      .from(clients)
      .where(
        sql`REGEXP_REPLACE(${clients.cnpj}, '[^0-9]', '', 'g') = ${normalizedCNPJ}`
      );
    return results[0] || null;
  }
  
  async createClient(clientData: InsertClient): Promise<Client> {
    const [client] = await db.insert(clients).values(clientData).returning();
    return client;
  }
  
  async updateClient(id: string, clientData: Partial<InsertClient>): Promise<Client> {
    const [client] = await db
      .update(clients)
      .set({ ...clientData, updatedAt: new Date() })
      .where(eq(clients.id, id))
      .returning();
    return client;
  }
  
  async deleteClient(id: string): Promise<void> {
    await db.delete(clients).where(eq(clients.id, id));
  }
  
  // ========== Invoice Operations ==========
  
  async getInvoices(): Promise<Invoice[]> {
    return await db.select().from(invoices).orderBy(desc(invoices.createdAt));
  }
  
  async getInvoice(id: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice;
  }
  
  async createInvoice(invoiceData: InsertInvoice): Promise<Invoice> {
    const [invoice] = await db.insert(invoices).values(invoiceData).returning();
    return invoice;
  }
  
  async updateInvoice(id: string, invoiceData: Partial<InsertInvoice>): Promise<Invoice> {
    // Verifica duplicata de invoiceNumber se estiver sendo atualizado
    if (invoiceData.invoiceNumber) {
      const [existing] = await db
        .select()
        .from(invoices)
        .where(eq(invoices.invoiceNumber, invoiceData.invoiceNumber))
        .limit(1);
      
      // Se encontrou outro registro com o mesmo invoiceNumber (que não seja o atual)
      if (existing && existing.id !== id) {
        throw new Error(`Nota fiscal com número ${invoiceData.invoiceNumber} já existe`);
      }
    }
    
    const [invoice] = await db
      .update(invoices)
      .set({ ...invoiceData, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    return invoice;
  }
  
  async deleteInvoice(id: string): Promise<void> {
    await db.delete(invoices).where(eq(invoices.id, id));
  }
  
  // ========== Document Operations ==========
  
  async getDocuments(): Promise<Document[]> {
    return await db.select().from(documents).orderBy(desc(documents.createdAt));
  }
  
  async createDocument(documentData: InsertDocument): Promise<Document> {
    const [document] = await db.insert(documents).values(documentData).returning();
    return document;
  }
  
  // ========== Process Operations ==========
  
  async getProcesses(): Promise<Process[]> {
    return await db.select().from(processes).orderBy(desc(processes.createdAt));
  }
  
  async createProcess(processData: InsertProcess): Promise<Process> {
    const [process] = await db.insert(processes).values(processData).returning();
    return process;
  }
  
  // ========== Campaign Operations ==========
  
  async getCampaigns(): Promise<Campaign[]> {
    return await db.select().from(campaigns).orderBy(desc(campaigns.createdAt));
  }
  
  async createCampaign(campaignData: InsertCampaign): Promise<Campaign> {
    const [campaign] = await db.insert(campaigns).values(campaignData).returning();
    return campaign;
  }
  
  // ========== Lead Operations ==========
  
  async getLeads(): Promise<Lead[]> {
    return await db.select().from(leads).orderBy(desc(leads.createdAt));
  }
  
  async createLead(leadData: InsertLead): Promise<Lead> {
    const [lead] = await db.insert(leads).values(leadData).returning();
    return lead;
  }
  
  // ========== Marketing Activity Operations ==========
  
  async getMarketingActivities(year: number, month: number): Promise<MarketingActivity[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    
    return await db.select()
      .from(marketingActivities)
      .where(and(
        gte(marketingActivities.date, startDate),
        lte(marketingActivities.date, endDate)
      ))
      .orderBy(marketingActivities.date);
  }
  
  async getMarketingActivity(id: string): Promise<MarketingActivity | undefined> {
    const [activity] = await db.select().from(marketingActivities).where(eq(marketingActivities.id, id));
    return activity;
  }
  
  async createMarketingActivity(activityData: InsertMarketingActivity): Promise<MarketingActivity> {
    const [activity] = await db.insert(marketingActivities).values(activityData).returning();
    return activity;
  }
  
  async updateMarketingActivity(id: string, activityData: Partial<InsertMarketingActivity>): Promise<MarketingActivity> {
    const [activity] = await db
      .update(marketingActivities)
      .set({ ...activityData, updatedAt: new Date() })
      .where(eq(marketingActivities.id, id))
      .returning();
    return activity;
  }
  
  async deleteMarketingActivity(id: string): Promise<void> {
    await db.delete(marketingActivities).where(eq(marketingActivities.id, id));
  }
  
  // ========== Marketing Content Operations ==========
  
  async getMarketingContents(filters?: { clientType?: string; contentType?: string; search?: string; tag?: string }): Promise<MarketingContent[]> {
    let query = db.select().from(marketingContent);
    const conditions = [];
    
    if (filters?.clientType && filters.clientType !== "Todos") {
      conditions.push(eq(marketingContent.clientType, filters.clientType));
    }
    if (filters?.contentType && filters.contentType !== "Todos") {
      conditions.push(eq(marketingContent.contentType, filters.contentType));
    }
    if (filters?.search) {
      conditions.push(ilike(marketingContent.title, `%${filters.search}%`));
    }
    
    if (conditions.length > 0) {
      return await db.select()
        .from(marketingContent)
        .where(and(...conditions))
        .orderBy(desc(marketingContent.createdAt));
    }
    
    return await db.select().from(marketingContent).orderBy(desc(marketingContent.createdAt));
  }
  
  async getMarketingContent(id: string): Promise<MarketingContent | undefined> {
    const [content] = await db.select().from(marketingContent).where(eq(marketingContent.id, id));
    return content;
  }
  
  async createMarketingContent(contentData: InsertMarketingContent): Promise<MarketingContent> {
    const [content] = await db.insert(marketingContent).values(contentData).returning();
    
    // Create first version
    await db.insert(contentVersions).values({
      contentId: content.id,
      versionNumber: 1,
      contentData: content.contentData,
      changedBy: contentData.createdBy,
      changeDescription: "Versão inicial",
    });
    
    return content;
  }
  
  async updateMarketingContent(id: string, contentData: Partial<InsertMarketingContent>, changeDescription?: string, changedBy?: string): Promise<MarketingContent> {
    // Get current content
    const [current] = await db.select().from(marketingContent).where(eq(marketingContent.id, id));
    if (!current) throw new Error("Conteúdo não encontrado");
    
    const newVersion = current.currentVersion + 1;
    
    // Create new version
    if (contentData.contentData && changedBy) {
      await db.insert(contentVersions).values({
        contentId: id,
        versionNumber: newVersion,
        contentData: contentData.contentData,
        changedBy,
        changeDescription: changeDescription || "Atualização",
      });
    }
    
    const [content] = await db
      .update(marketingContent)
      .set({ 
        ...contentData, 
        currentVersion: contentData.contentData ? newVersion : current.currentVersion,
        updatedAt: new Date() 
      })
      .where(eq(marketingContent.id, id))
      .returning();
    return content;
  }
  
  async deleteMarketingContent(id: string): Promise<void> {
    await db.delete(marketingContent).where(eq(marketingContent.id, id));
  }
  
  // ========== Content Version Operations ==========
  
  async getContentVersions(contentId: string): Promise<ContentVersion[]> {
    return await db.select()
      .from(contentVersions)
      .where(eq(contentVersions.contentId, contentId))
      .orderBy(desc(contentVersions.versionNumber));
  }
  
  async restoreContentVersion(contentId: string, versionNumber: number, changedBy: string): Promise<MarketingContent> {
    const [version] = await db.select()
      .from(contentVersions)
      .where(and(
        eq(contentVersions.contentId, contentId),
        eq(contentVersions.versionNumber, versionNumber)
      ));
    
    if (!version) throw new Error("Versão não encontrada");
    
    return await this.updateMarketingContent(
      contentId,
      { contentData: version.contentData },
      `Restaurado da versão ${versionNumber}`,
      changedBy
    );
  }
  
  // ========== Content Comment Operations ==========
  
  async getContentComments(contentId: string): Promise<ContentComment[]> {
    return await db.select()
      .from(contentComments)
      .where(eq(contentComments.contentId, contentId))
      .orderBy(desc(contentComments.commentedAt));
  }
  
  async createContentComment(commentData: InsertContentComment): Promise<ContentComment> {
    const [comment] = await db.insert(contentComments).values(commentData).returning();
    return comment;
  }
  
  async deleteContentComment(id: string): Promise<void> {
    await db.delete(contentComments).where(eq(contentComments.id, id));
  }
  
  // ========== Content Tag Operations ==========
  
  async getContentTags(contentId: string): Promise<ContentTag[]> {
    return await db.select()
      .from(contentTags)
      .where(eq(contentTags.contentId, contentId));
  }
  
  async getAllTags(): Promise<string[]> {
    const tags = await db.selectDistinct({ tag: contentTags.tag }).from(contentTags);
    return tags.map(t => t.tag);
  }
  
  async setContentTags(contentId: string, tags: string[]): Promise<void> {
    // Remove existing tags
    await db.delete(contentTags).where(eq(contentTags.contentId, contentId));
    
    // Add new tags
    if (tags.length > 0) {
      await db.insert(contentTags).values(
        tags.map(tag => ({ contentId, tag }))
      );
    }
  }
  
  // ========== Marketing Metric Operations ==========
  
  async getMarketingMetrics(filters?: { dateFrom?: Date; dateTo?: Date; collaborator?: string; platform?: string }): Promise<MarketingMetric[]> {
    const conditions = [];
    
    if (filters?.dateFrom) {
      conditions.push(gte(marketingMetrics.date, filters.dateFrom));
    }
    if (filters?.dateTo) {
      conditions.push(lte(marketingMetrics.date, filters.dateTo));
    }
    if (filters?.collaborator && filters.collaborator !== "Todos") {
      conditions.push(eq(marketingMetrics.collaborator, filters.collaborator));
    }
    if (filters?.platform && filters.platform !== "Todas") {
      conditions.push(eq(marketingMetrics.platform, filters.platform));
    }
    
    if (conditions.length > 0) {
      return await db.select()
        .from(marketingMetrics)
        .where(and(...conditions))
        .orderBy(desc(marketingMetrics.date));
    }
    
    return await db.select().from(marketingMetrics).orderBy(desc(marketingMetrics.date));
  }
  
  async getMarketingMetric(id: string): Promise<MarketingMetric | undefined> {
    const [metric] = await db.select().from(marketingMetrics).where(eq(marketingMetrics.id, id));
    return metric;
  }
  
  async createMarketingMetric(metricData: InsertMarketingMetric): Promise<MarketingMetric> {
    const [metric] = await db.insert(marketingMetrics).values(metricData).returning();
    return metric;
  }
  
  async updateMarketingMetric(id: string, metricData: Partial<InsertMarketingMetric>): Promise<MarketingMetric> {
    const [metric] = await db
      .update(marketingMetrics)
      .set(metricData)
      .where(eq(marketingMetrics.id, id))
      .returning();
    return metric;
  }
  
  async deleteMarketingMetric(id: string): Promise<void> {
    await db.delete(marketingMetrics).where(eq(marketingMetrics.id, id));
  }
  
  async getMetricsByActivity(activityId: string): Promise<MarketingMetric[]> {
    return await db.select()
      .from(marketingMetrics)
      .where(eq(marketingMetrics.activityId, activityId))
      .orderBy(desc(marketingMetrics.date));
  }
  
  // ========== Authorization Operations ==========
  
  async getAuthorizations(filters?: { dateFrom?: Date; dateTo?: Date; clientName?: string; jornal?: string }): Promise<Authorization[]> {
    const conditions: any[] = [];
    
    if (filters?.dateFrom) {
      conditions.push(gte(authorizations.createdAt, filters.dateFrom));
    }
    if (filters?.dateTo) {
      conditions.push(lte(authorizations.createdAt, filters.dateTo));
    }
    if (filters?.clientName) {
      conditions.push(ilike(authorizations.clientName, `%${filters.clientName}%`));
    }
    if (filters?.jornal) {
      conditions.push(ilike(authorizations.jornal, `%${filters.jornal}%`));
    }
    
    if (conditions.length > 0) {
      return await db.select()
        .from(authorizations)
        .where(and(...conditions))
        .orderBy(desc(authorizations.createdAt));
    }
    
    return await db.select().from(authorizations).orderBy(desc(authorizations.createdAt));
  }
  
  async getAuthorization(id: string): Promise<Authorization | undefined> {
    const [authorization] = await db.select().from(authorizations).where(eq(authorizations.id, id));
    return authorization;
  }
  
  async createAuthorization(authorizationData: InsertAuthorization): Promise<Authorization> {
    const [authorization] = await db.insert(authorizations).values(authorizationData).returning();
    return authorization;
  }
  
  async updateAuthorization(id: string, authorizationData: Partial<InsertAuthorization>): Promise<Authorization> {
    const [authorization] = await db
      .update(authorizations)
      .set({ ...authorizationData, updatedAt: new Date() })
      .where(eq(authorizations.id, id))
      .returning();
    return authorization;
  }
  
  async deleteAuthorization(id: string): Promise<void> {
    await db.delete(authorizations).where(eq(authorizations.id, id));
  }
}

export const storage = new DatabaseStorage();
