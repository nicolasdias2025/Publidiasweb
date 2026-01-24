import jsPDF from 'jspdf';
import type { Authorization } from '@shared/schema';

const PUBLIDIAS_DATA = {
  cnpj: '88.847.660/0001-53',
  endereco: 'Rua Patrício de Farias, 101/518 - Florianópolis/SC',
  fones: '(51) 99739.6914 - (51) 99578.2865 - (51) 99668.5967',
  email: 'publidias@publidias.com.br'
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

export async function generateAuthorizationPDF(auth: Authorization, logoBase64?: string): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = 15;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('AUTORIZAÇÃO DE INSERÇÃO', pageWidth / 2, y, { align: 'center' });
  
  y += 8;
  doc.setFontSize(12);
  doc.text(`Número => ${auth.authorizationNumber}`, pageWidth - margin, y, { align: 'right' });
  
  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', margin, y - 5, 35, 15);
    } catch (e) {
      console.warn('Não foi possível adicionar o logo:', e);
    }
  }
  
  const infoX = margin + 40;
  doc.text(PUBLIDIAS_DATA.endereco, infoX, y);
  y += 4;
  doc.text(`Fones: ${PUBLIDIAS_DATA.fones}`, infoX, y);
  y += 4;
  doc.text(`CNPJ: ${PUBLIDIAS_DATA.cnpj}`, infoX, y);
  y += 4;
  doc.text(`E-mail: ${PUBLIDIAS_DATA.email}`, infoX, y);
  
  y += 12;
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('DADOS DO CLIENTE', margin, y);
  
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  const drawField = (label: string, value: string | null | undefined, x: number, yPos: number, width: number) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, x, yPos);
    doc.setFont('helvetica', 'normal');
    const labelWidth = doc.getTextWidth(`${label}: `);
    const textValue = value || '-';
    const maxWidth = width - labelWidth - 2;
    if (doc.getTextWidth(textValue) > maxWidth) {
      doc.text(textValue.substring(0, Math.floor(maxWidth / 2.5)) + '...', x + labelWidth, yPos);
    } else {
      doc.text(textValue, x + labelWidth, yPos);
    }
  };
  
  const col1 = margin;
  const col2 = pageWidth / 2;
  const colWidth = (pageWidth - 2 * margin) / 2;
  
  drawField('Razão Social', auth.clientName, col1, y, pageWidth - 2 * margin);
  y += 5;
  drawField('CNPJ', formatCNPJ(auth.cnpj), col1, y, colWidth);
  drawField('E-mail', auth.clientEmail, col2, y, colWidth);
  y += 5;
  drawField('Endereço', auth.clientAddress, col1, y, pageWidth - 2 * margin);
  y += 5;
  drawField('Cidade', auth.clientCity, col1, y, colWidth * 0.6);
  drawField('UF', auth.clientState, col1 + colWidth * 0.6, y, colWidth * 0.2);
  drawField('CEP', auth.clientZip, col2, y, colWidth);
  
  y += 10;
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('DADOS DA PUBLICAÇÃO', margin, y);
  
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  drawField('Jornal', auth.jornal, col1, y, pageWidth - 2 * margin);
  y += 5;
  drawField('Tipo', auth.tipo, col1, y, colWidth);
  drawField('Período', `${auth.mes}/${auth.ano}`, col2, y, colWidth);
  y += 5;
  
  let diasText = '-';
  try {
    const dias = JSON.parse(auth.diasPublicacao || '[]');
    if (Array.isArray(dias) && dias.length > 0) {
      diasText = dias.sort((a: number, b: number) => a - b).join(', ');
    }
  } catch {
    diasText = auth.diasPublicacao || '-';
  }
  drawField('Dias de Publicação', diasText, col1, y, pageWidth - 2 * margin);
  
  y += 10;
  doc.line(margin, y, pageWidth - margin, y);
  
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('FORMATO E INSERÇÕES', margin, y);
  
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  drawField('Col./Linha', auth.colLinha, col1, y, colWidth * 0.5);
  drawField('Cm', auth.cm, col1 + colWidth * 0.5, y, colWidth * 0.5);
  drawField('Formato', auth.formato || `${auth.colLinha} × ${auth.cm}`, col2, y, colWidth);
  y += 5;
  drawField('Nº Inserções', String(auth.numInsercoes || 1), col1, y, colWidth);
  drawField('Valor Unitário', formatCurrency(auth.valorUnitario), col2, y, colWidth);
  
  y += 10;
  doc.line(margin, y, pageWidth - margin, y);
  
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('VALORES', margin, y);
  
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  drawField('Valor Bruto', formatCurrency(auth.valorBruto), col1, y, colWidth);
  const descontoValue = auth.desconto ? `${auth.desconto}%` : '0%';
  drawField('Desconto', descontoValue, col2, y, colWidth);
  y += 5;
  
  if (auth.aplicarValorLiquido) {
    drawField('Valor Líquido (80%)', formatCurrency(auth.valorLiquido), col1, y, colWidth);
    y += 5;
  }
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  drawField('VALOR TOTAL', formatCurrency(auth.valorTotal), col1, y, pageWidth - 2 * margin);
  
  if (auth.observacoes) {
    y += 10;
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('OBSERVAÇÕES', margin, y);
    
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const obsLines = doc.splitTextToSize(auth.observacoes, pageWidth - 2 * margin);
    doc.text(obsLines, margin, y);
    y += obsLines.length * 4;
  }
  
  y += 15;
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  
  y += 8;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Autorizamos através de PUBLIDIAS PUBLICIDADE LTDA.', margin, y);
  y += 4;
  doc.text('as publicações acima e o respectivo faturamento.', margin, y);
  
  y += 10;
  const dataEmissao = auth.createdAt 
    ? new Date(auth.createdAt).toLocaleDateString('pt-BR')
    : new Date().toLocaleDateString('pt-BR');
  doc.text(`Local: Florianópolis/SC`, margin, y);
  doc.text(`Data de emissão: ${dataEmissao}`, col2, y);
  
  y += 15;
  doc.line(col2, y, pageWidth - margin, y);
  y += 4;
  doc.text('Assinatura do cliente', col2 + (pageWidth - margin - col2) / 2, y, { align: 'center' });
  
  y += 10;
  doc.setFontSize(7);
  doc.setTextColor(128);
  doc.text('NÃO VALE COMO RECIBO', pageWidth / 2, y, { align: 'center' });
  
  const fileName = `Autorizacao_${auth.authorizationNumber}_${auth.clientName?.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20)}.pdf`;
  doc.save(fileName);
}

export async function loadLogoAsBase64(): Promise<string | undefined> {
  try {
    const response = await fetch('/assets/logo-publidias.png');
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
