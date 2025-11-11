/**
 * Google Sheets Service
 * 
 * Serviço responsável por integração com Google Sheets para busca de dados de clientes por CNPJ.
 * Implementa cache em memória com TTL de 1 hora para otimizar performance.
 * 
 * Configuração necessária:
 * - GOOGLE_SHEETS_CREDENTIALS: JSON da Service Account (base64 encoded)
 * - GOOGLE_SHEETS_SHEET_ID: ID da planilha Google Sheets
 */

import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

export interface ClientData {
  cnpj: string;
  razaoSocial: string;
  endereco: string;
  cidade: string;
  cep: string;
  uf: string;
  email: string;
}

interface CacheEntry {
  data: ClientData;
  expiresAt: number;
}

class GoogleSheetsService {
  private auth: JWT | null = null;
  private cache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora
  private readonly SHEET_RANGE = 'Sheet1!A2:G'; // Começa na linha 2 (pula cabeçalho)

  constructor() {
    this.initializeAuth();
  }

  /**
   * Inicializa autenticação com Google Sheets usando Service Account
   */
  private initializeAuth() {
    try {
      const credentialsBase64 = process.env.GOOGLE_SHEETS_CREDENTIALS;
      
      if (!credentialsBase64) {
        console.warn('⚠️  GOOGLE_SHEETS_CREDENTIALS não configurado. Integração Google Sheets desabilitada.');
        return;
      }

      // Decodifica credenciais de base64
      const credentialsJson = Buffer.from(credentialsBase64, 'base64').toString('utf-8');
      const credentials = JSON.parse(credentialsJson);

      this.auth = new JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });

      console.log('✅ Google Sheets Service inicializado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao inicializar Google Sheets Service:', error);
      this.auth = null;
    }
  }

  /**
   * Normaliza CNPJ removendo caracteres especiais
   * Exemplo: "91.338.558/0001-37" → "91338558000137"
   */
  private normalizeCnpj(cnpj: string): string {
    return cnpj.replace(/\D/g, '');
  }

  /**
   * Formata CNPJ adicionando pontuação
   * Exemplo: "91338558000137" → "91.338.558/0001-37"
   */
  private formatCnpj(cnpj: string): string {
    const normalized = this.normalizeCnpj(cnpj);
    if (normalized.length !== 14) return cnpj;
    
    return normalized.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      '$1.$2.$3/$4-$5'
    );
  }

  /**
   * Busca cliente por CNPJ na planilha Google Sheets
   * Utiliza cache em memória para otimizar performance
   */
  async findClientByCnpj(cnpj: string): Promise<ClientData | null> {
    if (!this.auth) {
      throw new Error('Google Sheets Service não está configurado. Configure GOOGLE_SHEETS_CREDENTIALS.');
    }

    const normalizedCnpj = this.normalizeCnpj(cnpj);

    // Verifica cache
    const cached = this.cache.get(normalizedCnpj);
    if (cached && Date.now() < cached.expiresAt) {
      console.log(`🎯 Cache HIT para CNPJ: ${this.formatCnpj(normalizedCnpj)}`);
      return cached.data;
    }

    console.log(`🔍 Cache MISS - Buscando CNPJ ${this.formatCnpj(normalizedCnpj)} no Google Sheets...`);

    try {
      const sheets = google.sheets({ version: 'v4', auth: this.auth });
      const sheetId = process.env.GOOGLE_SHEETS_SHEET_ID;

      if (!sheetId) {
        throw new Error('GOOGLE_SHEETS_SHEET_ID não configurado');
      }

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: this.SHEET_RANGE,
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        console.log('⚠️  Planilha vazia ou sem dados');
        return null;
      }

      // Busca linha com CNPJ correspondente
      // Estrutura esperada: [cnpj, razao_social, endereco, cidade, cep, uf, email]
      const clientRow = rows.find(row => {
        const rowCnpj = row[0] ? this.normalizeCnpj(row[0]) : '';
        return rowCnpj === normalizedCnpj;
      });

      if (!clientRow) {
        console.log(`❌ Cliente não encontrado para CNPJ: ${this.formatCnpj(normalizedCnpj)}`);
        return null;
      }

      const clientData: ClientData = {
        cnpj: this.formatCnpj(normalizedCnpj),
        razaoSocial: clientRow[1] || '',
        endereco: clientRow[2] || '',
        cidade: clientRow[3] || '',
        cep: clientRow[4] || '',
        uf: clientRow[5] || '',
        email: clientRow[6] || '',
      };

      // Armazena no cache
      this.cache.set(normalizedCnpj, {
        data: clientData,
        expiresAt: Date.now() + this.CACHE_TTL_MS,
      });

      console.log(`✅ Cliente encontrado: ${clientData.razaoSocial}`);
      return clientData;
    } catch (error) {
      console.error('❌ Erro ao buscar cliente no Google Sheets:', error);
      throw new Error('Falha ao consultar Google Sheets. Verifique as configurações.');
    }
  }

  /**
   * Limpa cache de um CNPJ específico
   */
  clearCache(cnpj: string) {
    const normalized = this.normalizeCnpj(cnpj);
    this.cache.delete(normalized);
  }

  /**
   * Limpa todo o cache
   */
  clearAllCache() {
    this.cache.clear();
    console.log('🗑️  Cache do Google Sheets limpo');
  }

  /**
   * Retorna estatísticas do cache
   */
  getCacheStats() {
    const now = Date.now();
    const validEntries = Array.from(this.cache.values()).filter(
      entry => entry.expiresAt > now
    ).length;

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries: this.cache.size - validEntries,
    };
  }
}

// Exporta instância singleton
export const googleSheetsService = new GoogleSheetsService();
