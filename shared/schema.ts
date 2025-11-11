/**
 * Database Schema - Sistema Corporativo
 * 
 * Este arquivo define todas as tabelas e relacionamentos do banco de dados
 * seguindo as melhores práticas de arquitetura corporativa.
 * 
 * Módulos implementados:
 * - Autenticação (Replit Auth)
 * - Orçamentos (publicações em jornais oficiais)
 * - Autorizações
 * - Notas Fiscais
 * - Gestão Administrativa
 * - Marketing
 */

import { sql } from "drizzle-orm";
import { 
  pgTable, 
  text, 
  varchar, 
  timestamp,
  decimal,
  jsonb,
  index,
  integer,
  boolean
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// =============================================================================
// TABELAS DE AUTENTICAÇÃO (Replit Auth)
// =============================================================================

// Tabela de sessões (obrigatória para Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Tabela de usuários (obrigatória para Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// =============================================================================
// MÓDULO: ORÇAMENTOS (Publicações em Jornais Oficiais)
// =============================================================================

/**
 * Tabela de Orçamentos
 * 
 * Estrutura para orçamentos de publicações em jornais oficiais.
 * Cada orçamento contém até 5 linhas de publicação com cálculo automático.
 * 
 * Regras de cálculo:
 * - Para cada linha: valor_linha = formato × valor_cm_col (se incluir_no_total = true)
 * - Valor Total = soma de todos os valores das linhas incluídas + diagramacao
 */
export const budgets = pgTable("budgets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Dados do Cliente
  clientName: text("client_name").notNull(),
  clientEmail: varchar("client_email").notNull(),
  
  // Formato (multiplicador para cálculo)
  format: decimal("format", { precision: 10, scale: 2 }).notNull(),
  
  // Linha 1
  line1Jornal: text("line1_jornal"),
  line1ValorCmCol: decimal("line1_valor_cm_col", { precision: 10, scale: 2 }),
  line1IncluirTotal: boolean("line1_incluir_total").default(false),
  
  // Linha 2
  line2Jornal: text("line2_jornal"),
  line2ValorCmCol: decimal("line2_valor_cm_col", { precision: 10, scale: 2 }),
  line2IncluirTotal: boolean("line2_incluir_total").default(false),
  
  // Linha 3
  line3Jornal: text("line3_jornal"),
  line3ValorCmCol: decimal("line3_valor_cm_col", { precision: 10, scale: 2 }),
  line3IncluirTotal: boolean("line3_incluir_total").default(false),
  
  // Linha 4
  line4Jornal: text("line4_jornal"),
  line4ValorCmCol: decimal("line4_valor_cm_col", { precision: 10, scale: 2 }),
  line4IncluirTotal: boolean("line4_incluir_total").default(false),
  
  // Linha 5
  line5Jornal: text("line5_jornal"),
  line5ValorCmCol: decimal("line5_valor_cm_col", { precision: 10, scale: 2 }),
  line5IncluirTotal: boolean("line5_incluir_total").default(false),
  
  // Campos Finais
  valorTotal: decimal("valor_total", { precision: 12, scale: 2 }).notNull(), // Calculado automaticamente
  diagramacao: decimal("diagramacao", { precision: 10, scale: 2 }).default("0"),
  date: timestamp("date").notNull(),
  observations: text("observations"),
  approved: boolean("approved").default(false), // Checkbox "Aprovado" geral
  
  // Metadados
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const budgetsRelations = relations(budgets, ({ one }) => ({
  creator: one(users, {
    fields: [budgets.createdBy],
    references: [users.id],
  }),
}));

export const insertBudgetSchema = createInsertSchema(budgets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBudget = z.infer<typeof insertBudgetSchema>;
export type Budget = typeof budgets.$inferSelect;

// =============================================================================
// MÓDULO: AUTORIZAÇÕES
// =============================================================================

export const approvals = pgTable("approvals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(),
  requester: text("requester").notNull(),
  department: text("department").notNull(),
  value: decimal("value", { precision: 12, scale: 2 }).notNull(),
  description: text("description").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvalComment: text("approval_comment"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const approvalsRelations = relations(approvals, ({ one }) => ({
  creator: one(users, {
    fields: [approvals.createdBy],
    references: [users.id],
  }),
  approver: one(users, {
    fields: [approvals.approvedBy],
    references: [users.id],
  }),
}));

export const insertApprovalSchema = createInsertSchema(approvals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  approvedBy: true,
  approvalComment: true,
});

export type InsertApproval = z.infer<typeof insertApprovalSchema>;
export type Approval = typeof approvals.$inferSelect;

// =============================================================================
// MÓDULO: NOTAS FISCAIS
// =============================================================================

export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceNumber: text("invoice_number").notNull().unique(),
  clientName: text("client_name").notNull(),
  clientDocument: text("client_document").notNull(),
  serviceType: text("service_type").notNull(),
  serviceDescription: text("service_description").notNull(),
  value: decimal("value", { precision: 12, scale: 2 }).notNull(),
  taxValue: decimal("tax_value", { precision: 12, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  issuedBy: varchar("issued_by").notNull().references(() => users.id),
  issuedAt: timestamp("issued_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const invoicesRelations = relations(invoices, ({ one }) => ({
  issuer: one(users, {
    fields: [invoices.issuedBy],
    references: [users.id],
  }),
}));

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  issuedAt: true,
});

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

// =============================================================================
// MÓDULO: GESTÃO ADMINISTRATIVA
// =============================================================================

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  category: text("category").notNull(),
  fileUrl: text("file_url"),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  uploadedBy: varchar("uploaded_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const documentsRelations = relations(documents, ({ one }) => ({
  uploader: one(users, {
    fields: [documents.uploadedBy],
    references: [users.id],
  }),
}));

export const processes = pgTable("processes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  responsible: text("responsible").notNull(),
  deadline: timestamp("deadline").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  description: text("description"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const processesRelations = relations(processes, ({ one }) => ({
  creator: one(users, {
    fields: [processes.createdBy],
    references: [users.id],
  }),
}));

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProcessSchema = createInsertSchema(processes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertProcess = z.infer<typeof insertProcessSchema>;
export type Process = typeof processes.$inferSelect;

// =============================================================================
// MÓDULO: MARKETING
// =============================================================================

export const campaigns = pgTable("campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  channel: text("channel").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  leads: integer("leads").notNull().default(0),
  conversions: integer("conversions").notNull().default(0),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const campaignsRelations = relations(campaigns, ({ one }) => ({
  creator: one(users, {
    fields: [campaigns.createdBy],
    references: [users.id],
  }),
}));

export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  company: text("company").notNull(),
  source: text("source").notNull(),
  score: integer("score").notNull().default(0),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  campaignId: varchar("campaign_id").references(() => campaigns.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const leadsRelations = relations(leads, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [leads.campaignId],
    references: [campaigns.id],
  }),
}));

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaigns.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;
