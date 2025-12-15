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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

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
}

export const storage = new DatabaseStorage();
