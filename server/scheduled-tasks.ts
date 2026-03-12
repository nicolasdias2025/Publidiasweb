/**
 * Scheduled Tasks - Sistema Corporativo
 * 
 * Implementa rotinas agendadas (cron jobs) para limpeza automática de dados
 * e manutenção do banco de dados usando setInterval nativo.
 */

import { db } from "./db";
import { auditLogs } from "@shared/schema";
import { lt } from "drizzle-orm";

/**
 * Data Retention Policy para audit_logs
 * Deleta automaticamente logs mais antigos que 180 dias (6 meses)
 * Executa uma vez por dia
 */
export function setupScheduledTasks() {
  // Executa a limpeza uma vez por dia (86400000 ms = 24 horas)
  setInterval(async () => {
    try {
      const now = new Date();
      const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

      console.log(
        `[SCHEDULED] Iniciando limpeza de audit_logs com data anterior a ${sixMonthsAgo.toISOString()}`
      );

      // Deletar logs com mais de 180 dias
      const result = await db
        .delete(auditLogs)
        .where(lt(auditLogs.createdAt, sixMonthsAgo));

      const deletedCount = result.rowCount || 0;
      console.log(
        `[SCHEDULED] ✅ Limpeza de audit_logs concluída: ${deletedCount} linhas antigas removidas`
      );
    } catch (error) {
      console.error(
        "[SCHEDULED] ❌ Erro ao limpar audit_logs:",
        error instanceof Error ? error.message : error
      );
    }
  }, 24 * 60 * 60 * 1000); // 24 horas em milissegundos

  console.log("[SCHEDULED] 🕐 Data Retention Policy ativada (executa a cada 24 horas)");
}
