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
// Nota: email não é unique pois diferentes providers OIDC podem ter mesmo email
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email"),
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
  
  // Linha 1
  line1Jornal: text("line1_jornal"),
  line1ValorCmCol: decimal("line1_valor_cm_col", { precision: 10, scale: 2 }),
  line1Formato: decimal("line1_formato", { precision: 10, scale: 2 }),
  line1IncluirTotal: boolean("line1_incluir_total").default(false),
  
  // Linha 2
  line2Jornal: text("line2_jornal"),
  line2ValorCmCol: decimal("line2_valor_cm_col", { precision: 10, scale: 2 }),
  line2Formato: decimal("line2_formato", { precision: 10, scale: 2 }),
  line2IncluirTotal: boolean("line2_incluir_total").default(false),
  
  // Linha 3
  line3Jornal: text("line3_jornal"),
  line3ValorCmCol: decimal("line3_valor_cm_col", { precision: 10, scale: 2 }),
  line3Formato: decimal("line3_formato", { precision: 10, scale: 2 }),
  line3IncluirTotal: boolean("line3_incluir_total").default(false),
  
  // Linha 4
  line4Jornal: text("line4_jornal"),
  line4ValorCmCol: decimal("line4_valor_cm_col", { precision: 10, scale: 2 }),
  line4Formato: decimal("line4_formato", { precision: 10, scale: 2 }),
  line4IncluirTotal: boolean("line4_incluir_total").default(false),
  
  // Linha 5
  line5Jornal: text("line5_jornal"),
  line5ValorCmCol: decimal("line5_valor_cm_col", { precision: 10, scale: 2 }),
  line5Formato: decimal("line5_formato", { precision: 10, scale: 2 }),
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
// MÓDULO: CADASTRO DE CLIENTES (com integração Google Sheets)
// =============================================================================

/**
 * Tabela de Clientes
 * 
 * Cadastro de clientes com integração Google Sheets para autopreenchimento por CNPJ.
 * Permite cadastro manual ou automático via busca na planilha.
 */
export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Dados do Cliente
  cnpj: varchar("cnpj", { length: 18 }).notNull(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: varchar("state", { length: 2 }).notNull(),
  zip: varchar("zip", { length: 10 }).notNull(),
  email: varchar("email"),
  telefone: varchar("telefone", { length: 20 }),
  celular: varchar("celular", { length: 20 }),
  
  // Metadados
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const clientsRelations = relations(clients, ({ one }) => ({
  creator: one(users, {
    fields: [clients.createdBy],
    references: [users.id],
  }),
}));

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

// =============================================================================
// MÓDULO: NOTAS FISCAIS
// =============================================================================

/**
 * Tabela de Notas Fiscais
 * 
 * Gerenciamento completo de notas fiscais com:
 * - Lookup automático de clientes por CNPJ
 * - Validação de datas e status
 * - Status com cores personalizadas
 * - Filtros avançados
 * 
 * Status disponíveis:
 * - pending: Pendente Recebimento (#F59E0B - Amarelo)
 * - overdue: Vencida (#EF4444 - Vermelho)
 * - paid: Paga (#10B981 - Verde)
 * - replaced: Substituída (#9CA3AF - Cinza)
 * 
 * Tipos de Serviço:
 * - DOU: Diário Oficial da União
 * - DOE: Diário Oficial do Estado
 * - Diagramação
 * - Comissão
 * - Outros
 * 
 * Regras de negócio:
 * - invoiceNumber deve ser único
 * - emissionDate não pode ser futura
 * - dueDate >= emissionDate
 * - paymentDate obrigatória se status='paid'
 * - paymentDate >= emissionDate (se informada)
 */
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Número da Nota Fiscal (único)
  invoiceNumber: text("invoice_number").notNull().unique(),
  
  // Dados do Cliente (com lookup por CNPJ)
  cnpj: varchar("cnpj", { length: 18 }).notNull(),
  clientName: text("client_name").notNull(),
  clientEmail: varchar("client_email"),
  
  // Tipo de Serviço (DOU, DOE, Diagramação, Comissão, Outros)
  serviceType: varchar("service_type", { length: 50 }).notNull(),
  
  // Valor (positivo, formatado em BRL)
  value: decimal("value", { precision: 12, scale: 2 }).notNull(),
  
  // Datas
  emissionDate: timestamp("emission_date").notNull(),
  dueDate: timestamp("due_date").notNull(),
  paymentDate: timestamp("payment_date"),
  
  // Status (pending, overdue, paid, replaced)
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  
  // Comentários (opcional, max 500 chars)
  comments: text("comments"),
  
  // Metadados
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const invoicesRelations = relations(invoices, ({ one }) => ({
  creator: one(users, {
    fields: [invoices.createdBy],
    references: [users.id],
  }),
}));

// Schema de validação com regras de negócio
export const insertInvoiceSchema = createInsertSchema(invoices)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    invoiceNumber: z.string().min(1, "Número da nota fiscal é obrigatório"),
    cnpj: z.string().regex(/^\d{14}$|^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, "CNPJ inválido"),
    clientName: z.string().min(1, "Razão social é obrigatória"),
    clientEmail: z.string().email("E-mail inválido").optional().or(z.literal("")),
    serviceType: z.enum(["DOU", "DOE", "Diagramação", "Comissão", "Outros"], {
      errorMap: () => ({ message: "Tipo de serviço inválido" })
    }),
    value: z.string().refine((val) => parseFloat(val) > 0, "Valor deve ser maior que zero"),
    emissionDate: z.coerce.date(),
    dueDate: z.coerce.date(),
    paymentDate: z.coerce.date().optional().nullable(),
    status: z.enum(["pending", "overdue", "paid", "replaced"]).default("pending"),
    comments: z.string().max(500, "Comentários não podem exceder 500 caracteres").optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      if (!data.dueDate || !data.emissionDate) return true;
      return new Date(data.dueDate) >= new Date(data.emissionDate);
    },
    {
      message: "Data de vencimento deve ser maior ou igual à data de emissão",
      path: ["dueDate"],
    }
  )
  .refine(
    (data) => {
      if (!data.paymentDate || !data.emissionDate) return true;
      return new Date(data.paymentDate) >= new Date(data.emissionDate);
    },
    {
      message: "Data de pagamento deve ser maior ou igual à data de emissão",
      path: ["paymentDate"],
    }
  )
  .refine(
    (data) => {
      if (data.status === "paid") {
        return !!data.paymentDate;
      }
      return true;
    },
    {
      message: "Data de pagamento é obrigatória para notas fiscais pagas",
      path: ["paymentDate"],
    }
  );

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

// Schema para atualizações (PATCH) - todos os campos opcionais com validações condicionais
export const updateInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1, "Número da nota fiscal é obrigatório").optional(),
  cnpj: z.string().regex(/^\d{14}$|^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, "CNPJ inválido").optional(),
  clientName: z.string().min(1, "Razão social é obrigatória").optional(),
  clientEmail: z.string().email("E-mail inválido").optional().or(z.literal("")).optional(),
  serviceType: z.enum(["DOU", "DOE", "Diagramação", "Comissão", "Outros"], {
    errorMap: () => ({ message: "Tipo de serviço inválido" })
  }).optional(),
  value: z.string().refine((val) => parseFloat(val) > 0, "Valor deve ser maior que zero").optional(),
  emissionDate: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional(),
  paymentDate: z.coerce.date().optional().nullable(),
  status: z.enum(["pending", "overdue", "paid", "replaced"]).optional(),
  comments: z.string().max(500, "Comentários não podem exceder 500 caracteres").optional().or(z.literal("")).optional(),
}).superRefine((data, ctx) => {
  // Valida dueDate >= emissionDate apenas se ambos estiverem presentes
  if (data.dueDate !== undefined && data.emissionDate !== undefined) {
    if (new Date(data.dueDate) < new Date(data.emissionDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Data de vencimento deve ser maior ou igual à data de emissão",
        path: ["dueDate"],
      });
    }
  }
  
  // Valida paymentDate >= emissionDate apenas se ambos estiverem presentes
  if (data.paymentDate !== undefined && data.paymentDate !== null && data.emissionDate !== undefined) {
    if (new Date(data.paymentDate) < new Date(data.emissionDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Data de pagamento deve ser maior ou igual à data de emissão",
        path: ["paymentDate"],
      });
    }
  }
  
  // Valida que status="paid" requer paymentDate no mesmo payload
  if (data.status === "paid" && (!data.paymentDate || data.paymentDate === null)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Data de pagamento é obrigatória para notas fiscais pagas",
      path: ["paymentDate"],
    });
  }
});

export type UpdateInvoice = z.infer<typeof updateInvoiceSchema>;

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
