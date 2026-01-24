import jsPDF from 'jspdf';
import type { Authorization } from '@shared/schema';
import logoPublidias from '@assets/Logo-Ag-P&B-II_1769269593758.png';

const PUBLIDIAS_DATA = {
  cnpj: '88.847.660/0001-53',
  endereco: 'Rua Patrício de Farias, 101/518 - Florianópolis/SC',
  fones: '(51) 99739.6914 - (51) 99578.2865 - (51) 99668.5967',
  email: 'publidias@publidias.com.br'
};

const COLORS = {
  primary: [59, 130, 246] as [number, number, number],
  cardBg: [248, 250, 252] as [number, number, number],
  cardBorder: [226, 232, 240] as [number, number, number],
  text: [15, 23, 42] as [number, number, number],
  textMuted: [100, 116, 139] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

function formatCurrency(value: string | number | null): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (!num && num !== 0) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
}

function formatCNPJ(cnpj: string): string {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) return cnpj;
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

function drawRoundedRect(doc: jsPDF, x: number, y: number, width: number, height: number, radius: number, fillColor?: [number, number, number], strokeColor?: [number, number, number]) {
  doc.setLineWidth(0.3);
  
  if (fillColor) {
    doc.setFillColor(...fillColor);
  }
  if (strokeColor) {
    doc.setDrawColor(...strokeColor);
  }
  
  doc.roundedRect(x, y, width, height, radius, radius, fillColor && strokeColor ? 'FD' : (fillColor ? 'F' : 'S'));
}

function drawCardHeader(doc: jsPDF, title: string, x: number, y: number, width: number) {
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(x, y, width, 8, 2, 2, 'F');
  doc.rect(x, y + 4, width, 4, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.white);
  doc.text(title, x + 4, y + 5.5);
  doc.setTextColor(...COLORS.text);
}

export async function generateAuthorizationPDF(auth: Authorization, logoBase64?: string): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12;
  const contentWidth = pageWidth - 2 * margin;
  let y = 12;

  drawRoundedRect(doc, margin, y, contentWidth, 32, 3, COLORS.white, COLORS.cardBorder);
  
  const logoX = margin + 4;
  const logoY = y + 4;
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', logoX, logoY, 40, 18);
    } catch (e) {
      console.warn('Não foi possível adicionar o logo:', e);
    }
  }
  
  const infoX = margin + 50;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.textMuted);
  doc.text(PUBLIDIAS_DATA.endereco, infoX, y + 8);
  doc.text(`Fones: ${PUBLIDIAS_DATA.fones}`, infoX, y + 12);
  doc.text(`CNPJ: ${PUBLIDIAS_DATA.cnpj}`, infoX, y + 16);
  doc.text(`E-mail: ${PUBLIDIAS_DATA.email}`, infoX, y + 20);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.primary);
  doc.text(`Autorização #${auth.authorizationNumber}`, pageWidth - margin - 4, y + 14, { align: 'right' });
  
  y += 38;

  const cardHeight1 = 35;
  drawRoundedRect(doc, margin, y, contentWidth, cardHeight1, 3, COLORS.cardBg, COLORS.cardBorder);
  drawCardHeader(doc, 'DADOS DO CLIENTE', margin, y, contentWidth);
  
  const innerPadding = 4;
  const fieldY = y + 12;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.text);
  
  const col1 = margin + innerPadding;
  const col2 = margin + contentWidth / 2;
  const colWidth = (contentWidth - innerPadding * 2) / 2;
  
  const drawField = (label: string, value: string | null | undefined, x: number, yPos: number, maxW?: number) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.textMuted);
    doc.setFontSize(7);
    doc.text(label, x, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.text);
    doc.setFontSize(9);
    const textValue = value || '-';
    const maxWidth = maxW || colWidth - 4;
    if (doc.getTextWidth(textValue) > maxWidth) {
      doc.text(textValue.substring(0, Math.floor(maxWidth / 2)) + '...', x, yPos + 4);
    } else {
      doc.text(textValue, x, yPos + 4);
    }
  };
  
  drawField('Razão Social', auth.clientName, col1, fieldY, contentWidth - innerPadding * 2);
  drawField('CNPJ', formatCNPJ(auth.cnpj), col1, fieldY + 10);
  drawField('E-mail', auth.clientEmail, col2, fieldY + 10);
  drawField('Endereço', `${auth.clientAddress || ''} - ${auth.clientCity || ''}/${auth.clientState || ''} - ${auth.clientZip || ''}`, col1, fieldY + 20, contentWidth - innerPadding * 2);
  
  y += cardHeight1 + 5;

  const cardHeight2 = 30;
  drawRoundedRect(doc, margin, y, contentWidth, cardHeight2, 3, COLORS.cardBg, COLORS.cardBorder);
  drawCardHeader(doc, 'DADOS DA PUBLICAÇÃO', margin, y, contentWidth);
  
  const pubY = y + 12;
  drawField('Jornal', auth.jornal, col1, pubY, contentWidth * 0.6);
  drawField('Tipo', auth.tipo, col2, pubY);
  
  let diasText = '-';
  try {
    const dias = JSON.parse(auth.diasPublicacao || '[]');
    if (Array.isArray(dias) && dias.length > 0) {
      diasText = dias.sort((a: number, b: number) => a - b).join(', ');
    }
  } catch {
    diasText = auth.diasPublicacao || '-';
  }
  drawField('Período', `${auth.mes}/${auth.ano}`, col1, pubY + 10);
  drawField('Dias de Publicação', diasText, col2, pubY + 10);
  
  y += cardHeight2 + 5;

  const cardHeight3 = 25;
  drawRoundedRect(doc, margin, y, contentWidth, cardHeight3, 3, COLORS.cardBg, COLORS.cardBorder);
  drawCardHeader(doc, 'FORMATO E INSERÇÕES', margin, y, contentWidth);
  
  const formatY = y + 12;
  const col3Width = contentWidth / 4;
  drawField('Col./Linha', auth.colLinha, col1, formatY, col3Width - 4);
  drawField('Cm', auth.cm, col1 + col3Width, formatY, col3Width - 4);
  drawField('Formato', auth.formato || `${auth.colLinha} × ${auth.cm}`, col1 + col3Width * 2, formatY, col3Width - 4);
  drawField('Nº Inserções', String(auth.numInsercoes || 1), col1 + col3Width * 3, formatY, col3Width - 4);
  
  y += cardHeight3 + 5;

  const cardHeight4 = auth.aplicarValorLiquido ? 35 : 28;
  drawRoundedRect(doc, margin, y, contentWidth, cardHeight4, 3, COLORS.cardBg, COLORS.cardBorder);
  drawCardHeader(doc, 'VALORES', margin, y, contentWidth);
  
  const valY = y + 12;
  drawField('Valor Unitário', formatCurrency(auth.valorUnitario), col1, valY);
  drawField('Valor Bruto', formatCurrency(auth.valorBruto), col2, valY);
  
  const descontoValue = auth.desconto ? `${auth.desconto}%` : '0%';
  drawField('Desconto', descontoValue, col1, valY + 10);
  
  if (auth.aplicarValorLiquido) {
    drawField('Valor Líquido (80%)', formatCurrency(auth.valorLiquido), col2, valY + 10);
  }
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.primary);
  const totalY = auth.aplicarValorLiquido ? valY + 20 : valY + 10;
  doc.text(`VALOR TOTAL: ${formatCurrency(auth.valorTotal)}`, col2, totalY + 4);
  
  y += cardHeight4 + 5;

  if (auth.observacoes) {
    const obsLines = doc.splitTextToSize(auth.observacoes, contentWidth - innerPadding * 2);
    const obsHeight = 12 + obsLines.length * 4;
    
    drawRoundedRect(doc, margin, y, contentWidth, obsHeight, 3, COLORS.cardBg, COLORS.cardBorder);
    drawCardHeader(doc, 'OBSERVAÇÕES', margin, y, contentWidth);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.text);
    doc.text(obsLines, col1, y + 14);
    
    y += obsHeight + 5;
  }

  y += 10;
  doc.setLineWidth(0.2);
  doc.setDrawColor(...COLORS.cardBorder);
  doc.line(margin, y, pageWidth - margin, y);
  
  y += 8;
  const dataEmissao = auth.createdAt 
    ? new Date(auth.createdAt).toLocaleDateString('pt-BR')
    : new Date().toLocaleDateString('pt-BR');
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.textMuted);
  doc.text(`Data de emissão: ${dataEmissao}`, pageWidth / 2, y, { align: 'center' });
  
  const fileName = `Autorizacao_${auth.authorizationNumber}_${auth.clientName?.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20)}.pdf`;
  doc.save(fileName);
}

export async function loadLogoAsBase64(): Promise<string | undefined> {
  try {
    const response = await fetch(logoPublidias);
    if (!response.ok) return undefined;
    
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(undefined);
      reader.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
}
