/**
 * Storage Layer - Sistema Corporativo
 * 
 * Camada de persistência usando PostgreSQL com Drizzle ORM.
 * Implementa todas as operações CRUD para todos os módulos do sistema.
 */

import {
  users,
  budgets,
  approvals,
  invoices,
  documents,
  processes,
  campaigns,
  leads,
  type User,
  type UpsertUser,
  type Budget,
  type InsertBudget,
  type Approval,
  type InsertApproval,
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
import { eq, desc } from "drizzle-orm";

/**
 * Interface de Storage
 * Define todos os métodos CRUD disponíveis no sistema
 */
export interface IStorage {
  // ========== User Operations (Replit Auth) ==========
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // ========== Budget Operations ==========
  getBudgets(): Promise<Budget[]>;
  getBudget(id: string): Promise<Budget | undefined>;
  createBudget(budget: InsertBudget): Promise<Budget>;
  updateBudget(id: string, budget: Partial<InsertBudget>): Promise<Budget>;
  deleteBudget(id: string): Promise<void>;
  
  // ========== Approval Operations ==========
  getApprovals(): Promise<Approval[]>;
  getApproval(id: string): Promise<Approval | undefined>;
  createApproval(approval: InsertApproval): Promise<Approval>;
  updateApproval(id: string, approval: Partial<InsertApproval>): Promise<Approval>;
  
  // ========== Invoice Operations ==========
  getInvoices(): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice>;
  
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
  
  // ========== User Operations (Replit Auth) ==========
  
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
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
  
  // ========== Approval Operations ==========
  
  async getApprovals(): Promise<Approval[]> {
    return await db.select().from(approvals).orderBy(desc(approvals.createdAt));
  }
  
  async getApproval(id: string): Promise<Approval | undefined> {
    const [approval] = await db.select().from(approvals).where(eq(approvals.id, id));
    return approval;
  }
  
  async createApproval(approvalData: InsertApproval): Promise<Approval> {
    const [approval] = await db.insert(approvals).values(approvalData).returning();
    return approval;
  }
  
  async updateApproval(id: string, approvalData: Partial<InsertApproval>): Promise<Approval> {
    const [approval] = await db
      .update(approvals)
      .set({ ...approvalData, updatedAt: new Date() })
      .where(eq(approvals.id, id))
      .returning();
    return approval;
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
    const [invoice] = await db
      .update(invoices)
      .set({ ...invoiceData, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    return invoice;
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
