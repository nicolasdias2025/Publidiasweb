import jsPDF from 'jspdf';
import type { Authorization } from '@shared/schema';
import logoPublidias from '@assets/Logo-Ag-Aut_1769272910487.jpg';

const PUBLIDIAS_DATA = {
  razaoSocial: 'PUBLIDIAS SERVIÇOS DE PUBLICIDADE LTDA.',
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
  doc.roundedRect(x, y, width, 7, 2, 2, 'F');
  doc.rect(x, y + 3.5, width, 3.5, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.white);
  doc.text(title, x + 4, y + 5);
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

  const logoX = margin + 3;
  const logoY = y + 1;
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'JPEG', logoX, logoY, 32, 24);
    } catch (e) {
      console.warn('Não foi possível adicionar o logo:', e);
    }
  }
  
  const titleX = pageWidth - margin - 4;
  const infoStartX = margin + 40;
  const infoEndX = titleX - 45;
  const infoCenterX = infoStartX + (infoEndX - infoStartX) / 2;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.text);
  doc.text(PUBLIDIAS_DATA.razaoSocial, infoCenterX, y + 5, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...COLORS.textMuted);
  doc.text(PUBLIDIAS_DATA.endereco, infoCenterX, y + 9, { align: 'center' });
  doc.text(`Fones: ${PUBLIDIAS_DATA.fones}`, infoCenterX, y + 13, { align: 'center' });
  doc.text(`CNPJ: ${PUBLIDIAS_DATA.cnpj}`, infoCenterX, y + 17, { align: 'center' });
  doc.text(`E-mail: ${PUBLIDIAS_DATA.email}`, infoCenterX, y + 21, { align: 'center' });
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.primary);
  doc.text('Autorização', titleX, y + 8, { align: 'right' });
  doc.text('de Inserção', titleX, y + 13, { align: 'right' });
  doc.text(`nº ${auth.authorizationNumber}`, titleX, y + 18, { align: 'right' });
  
  y += 28;

  const cardHeight1 = 38;
  drawRoundedRect(doc, margin, y, contentWidth, cardHeight1, 3, COLORS.cardBg, COLORS.cardBorder);
  drawCardHeader(doc, 'DADOS DO CLIENTE', margin, y, contentWidth);
  
  const innerPadding = 4;
  const fieldY = y + 11;
  
  const col1 = margin + innerPadding;
  const col2 = margin + contentWidth / 2;
  const colWidth = (contentWidth - innerPadding * 2) / 2;
  
  const drawField = (label: string, value: string | null | undefined, x: number, yPos: number, maxW?: number) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.textMuted);
    doc.setFontSize(6.5);
    doc.text(label, x, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.text);
    doc.setFontSize(8.5);
    const textValue = value || '-';
    const maxWidth = maxW || colWidth - 4;
    if (doc.getTextWidth(textValue) > maxWidth) {
      doc.text(textValue.substring(0, Math.floor(maxWidth / 2)) + '...', x, yPos + 3.5);
    } else {
      doc.text(textValue, x, yPos + 3.5);
    }
  };
  
  drawField('Razão Social', auth.clientName, col1, fieldY, contentWidth - innerPadding * 2);
  drawField('CNPJ', formatCNPJ(auth.cnpj), col1, fieldY + 9);
  drawField('E-mail', auth.clientEmail, col2, fieldY + 9);
  
  const enderecoCompleto = `${auth.clientAddress || ''} - ${auth.clientCity || ''}/${auth.clientState || ''} - CEP ${auth.clientZip || ''}`;
  drawField('Endereço', enderecoCompleto, col1, fieldY + 18, contentWidth - innerPadding * 2);
  
  y += cardHeight1 + 4;

  const cardHeight2 = 18;
  drawRoundedRect(doc, margin, y, contentWidth, cardHeight2, 3, COLORS.cardBg, COLORS.cardBorder);
  drawCardHeader(doc, 'DADOS DA PUBLICAÇÃO', margin, y, contentWidth);
  
  const pubY = y + 11;
  const col4Width = contentWidth / 4;
  
  let diasText = '-';
  try {
    const dias = JSON.parse(auth.diasPublicacao || '[]');
    if (Array.isArray(dias) && dias.length > 0) {
      diasText = dias.sort((a: number, b: number) => a - b).join(', ');
    }
  } catch {
    diasText = auth.diasPublicacao || '-';
  }
  
  drawField('Jornal', auth.jornal, col1, pubY, col4Width - 4);
  drawField('Tipo', auth.tipo, col1 + col4Width, pubY, col4Width - 4);
  drawField('Período', `${auth.mes}/${auth.ano}`, col1 + col4Width * 2, pubY, col4Width - 4);
  drawField('Dia(s) da Publicação', diasText, col1 + col4Width * 3, pubY, col4Width - 4);
  
  y += cardHeight2 + 4;

  const cardHeight3 = 18;
  drawRoundedRect(doc, margin, y, contentWidth, cardHeight3, 3, COLORS.cardBg, COLORS.cardBorder);
  drawCardHeader(doc, 'FORMATO E INSERÇÕES', margin, y, contentWidth);
  
  const formatY = y + 11;
  drawField('Col./Linha', auth.colLinha, col1, formatY, col4Width - 4);
  drawField('Cm', auth.cm, col1 + col4Width, formatY, col4Width - 4);
  drawField('Formato', auth.formato || `${auth.colLinha} × ${auth.cm}`, col1 + col4Width * 2, formatY, col4Width - 4);
  drawField('Nº Inserções', String(auth.numInsercoes || 1), col1 + col4Width * 3, formatY, col4Width - 4);
  
  y += cardHeight3 + 4;

  const cardHeight4 = 18;
  drawRoundedRect(doc, margin, y, contentWidth, cardHeight4, 3, COLORS.cardBg, COLORS.cardBorder);
  drawCardHeader(doc, 'VALORES', margin, y, contentWidth);
  
  const valY = y + 11;
  const descontoValue = auth.desconto ? `${auth.desconto}%` : '0%';
  
  const faturarValor = auth.aplicarValorLiquido ? auth.valorLiquido : auth.valorTotal;
  
  drawField('Valor col./linha × cm', formatCurrency(auth.valorUnitario), col1, valY, col4Width - 4);
  drawField('Valor Bruto', formatCurrency(auth.valorBruto), col1 + col4Width, valY, col4Width - 4);
  drawField('Desconto', descontoValue, col1 + col4Width * 2, valY, col4Width - 4);
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.textMuted);
  doc.setFontSize(6.5);
  doc.text('Faturar Valor', col1 + col4Width * 3, valY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(9);
  doc.text(formatCurrency(faturarValor), col1 + col4Width * 3, valY + 3.5);
  
  y += cardHeight4 + 4;

  const obsText = auth.observacoes || '-';
  const obsLines = doc.splitTextToSize(obsText, contentWidth - innerPadding * 2);
  const obsHeight = Math.max(16, 11 + obsLines.length * 3.5);
  
  drawRoundedRect(doc, margin, y, contentWidth, obsHeight, 3, COLORS.cardBg, COLORS.cardBorder);
  drawCardHeader(doc, 'OBSERVAÇÕES', margin, y, contentWidth);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.text);
  doc.text(obsLines, col1, y + 12);
  
  y += obsHeight + 10;

  const dataEmissao = auth.createdAt 
    ? new Date(auth.createdAt).toLocaleDateString('pt-BR')
    : new Date().toLocaleDateString('pt-BR');
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
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
