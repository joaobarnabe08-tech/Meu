import { jsPDF } from 'jspdf';
import { BRANDING } from './branding';

const BLACK = '#0B0B0B';
const GOLD = '#D4AF37';
const GOLD_DARK = '#B8932B';
const LIGHT_GRAY = '#F4F4F4';
const MID_GRAY = '#9F9F9F';
const DARK_GRAY = '#3D3D3D';

function drawHeader(doc: jsPDF, title: string) {
  const pageW = doc.internal.pageSize.getWidth();

  // Black header band
  doc.setFillColor(BLACK);
  doc.rect(0, 0, pageW, 32, 'F');

  // Gold accent line
  doc.setFillColor(GOLD);
  doc.rect(0, 32, pageW, 1.5, 'F');

  // Logo icon (flame shape - simple triangle)
  doc.setFillColor(GOLD);
  doc.circle(18, 16, 5, 'F');
  doc.setTextColor(BLACK);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('V', 18, 18, { align: 'center' });

  // Brand name
  doc.setTextColor(GOLD);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(BRANDING.name, 28, 14);

  // Tagline
  doc.setTextColor(220, 220, 220);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(BRANDING.tagline, 28, 20);

  // Document title (right side)
  doc.setTextColor(GOLD);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pageW - 14, 18, { align: 'right' });

  return 42; // return Y start position
}

function drawFooter(doc: jsPDF) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const pages = doc.getNumberOfPages();

  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFillColor(BLACK);
    doc.rect(0, pageH - 16, pageW, 16, 'F');
    doc.setFillColor(GOLD);
    doc.rect(0, pageH - 17, pageW, 1, 'F');
    doc.setTextColor(MID_GRAY);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(`${BRANDING.name} - ${BRANDING.tagline}`, pageW / 2, pageH - 6, { align: 'center' });
    doc.text(`Pagina ${i} de ${pages}`, pageW - 14, pageH - 6, { align: 'right' });
  }
}

function sectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFillColor(GOLD);
  doc.rect(14, y - 4, 3, 6, 'F');
  doc.setTextColor(DARK_GRAY);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 20, y + 1);
  return y + 8;
}

function keyValue(doc: jsPDF, label: string, value: string, y: number, pageW: number): number {
  doc.setTextColor(MID_GRAY);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(label, 14, y);
  doc.setTextColor(DARK_GRAY);
  doc.setFont('helvetica', 'bold');
  doc.text(value || '—', 14 + pageW * 0.28, y);
  return y + 6;
}

export type AssessmentPDFData = {
  clientName: string;
  clientEmail?: string | null;
  clientBirthDate?: string | null;
  assessmentDate: string;
  goal?: string | null;
  data: { label: string; value: string | number | null; unit?: string }[];
  notes?: string | null;
};

export function exportAssessmentPDF(data: AssessmentPDFData) {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  let y = drawHeader(doc, 'Avaliacao Fisica');

  // Client info
  y = sectionTitle(doc, 'Dados do Cliente', y);
  y = keyValue(doc, 'Nome:', data.clientName, y, pageW);
  if (data.clientEmail) y = keyValue(doc, 'Email:', data.clientEmail, y, pageW);
  if (data.clientBirthDate) y = keyValue(doc, 'Data Nascimento:', data.clientBirthDate, y, pageW);
  y = keyValue(doc, 'Data Avaliacao:', data.assessmentDate, y, pageW);
  if (data.goal) y = keyValue(doc, 'Objetivo:', data.goal, y, pageW);
  y += 4;

  // Measurements
  y = sectionTitle(doc, 'Resultados da Avaliacao', y);
  const cols = 2;
  const colW = (pageW - 28) / cols;
  let row = 0;
  for (const item of data.data) {
    if (item.value == null || item.value === '') continue;
    const col = row % cols;
    const r = Math.floor(row / cols);
    const x = 14 + col * colW;
    const ry = y + r * 6;

    if (ry > pageH - 30) {
      doc.addPage();
      y = drawHeader(doc, 'Avaliacao Fisica');
      y = sectionTitle(doc, 'Resultados (cont.)', y);
      row = 0;
    }

    doc.setTextColor(MID_GRAY);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(item.label, x, y + r * 6);
    doc.setTextColor(DARK_GRAY);
    doc.setFont('helvetica', 'bold');
    const valStr = `${item.value}${item.unit ? ' ' + item.unit : ''}`;
    doc.text(valStr, x + colW * 0.6, y + r * 6);
    row++;
  }
  y += Math.ceil(row / cols) * 6 + 6;

  // Notes
  if (data.notes) {
    if (y > pageH - 40) { doc.addPage(); y = drawHeader(doc, 'Avaliacao Fisica'); }
    y = sectionTitle(doc, 'Observacoes', y);
    doc.setTextColor(DARK_GRAY);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(data.notes, pageW - 28);
    doc.text(lines, 14, y);
  }

  drawFooter(doc);
  const fileName = `avaliacao_${data.clientName.replace(/\s/g, '_')}_${data.assessmentDate}.pdf`;
  doc.save(fileName);
}

export type NutritionPDFData = {
  clientName: string;
  clientEmail?: string | null;
  planName: string;
  dailyCalories?: number | null;
  goal?: string | null;
  meals: {
    meal_name: string;
    time: string;
    foods: string;
    calories: number | null;
    proteins: number | null;
    carbs: number | null;
    fats: number | null;
  }[];
  notes?: string | null;
};

export function exportNutritionPDF(data: NutritionPDFData) {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  let y = drawHeader(doc, 'Plano Alimentar');

  // Client info
  y = sectionTitle(doc, 'Dados do Cliente', y);
  y = keyValue(doc, 'Nome:', data.clientName, y, pageW);
  if (data.clientEmail) y = keyValue(doc, 'Email:', data.clientEmail, y, pageW);
  y = keyValue(doc, 'Plano:', data.planName, y, pageW);
  if (data.dailyCalories) y = keyValue(doc, 'Calorias Diarias:', `${data.dailyCalories} kcal`, y, pageW);
  if (data.goal) y = keyValue(doc, 'Objetivo:', data.goal, y, pageW);
  y += 4;

  // Summary
  const totalKcal = data.meals.reduce((s, m) => s + (m.calories ?? 0), 0);
  const totalProt = data.meals.reduce((s, m) => s + (m.proteins ?? 0), 0);
  const totalCarbs = data.meals.reduce((s, m) => s + (m.carbs ?? 0), 0);
  const totalFats = data.meals.reduce((s, m) => s + (m.fats ?? 0), 0);

  y = sectionTitle(doc, 'Resumo Nutricional', y);
  doc.setFillColor(LIGHT_GRAY);
  doc.roundedRect(14, y - 2, pageW - 28, 14, 2, 2, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(DARK_GRAY);
  const summaryY = y + 6;
  doc.text(`Total: ${Math.round(totalKcal)} kcal`, 18, summaryY);
  doc.text(`Proteinas: ${Math.round(totalProt)}g`, 18 + (pageW - 28) / 4, summaryY);
  doc.text(`Carbs: ${Math.round(totalCarbs)}g`, 18 + (pageW - 28) / 2, summaryY);
  doc.text(`Gorduras: ${Math.round(totalFats)}g`, 18 + (pageW - 28) * 0.75, summaryY);
  y += 20;

  // Meals
  y = sectionTitle(doc, 'Refeicoes', y);

  for (const meal of data.meals) {
    if (y > pageH - 35) { doc.addPage(); y = drawHeader(doc, 'Plano Alimentar'); y += 4; }

    // Meal header bar
    doc.setFillColor(BLACK);
    doc.roundedRect(14, y - 4, pageW - 28, 8, 1, 1, 'F');
    doc.setTextColor(GOLD);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(meal.meal_name, 18, y + 1);
    doc.setTextColor(220, 220, 220);
    doc.setFontSize(8);
    doc.text(`${meal.time}h`, pageW - 18, y + 1, { align: 'right' });
    y += 8;

    // Foods
    doc.setTextColor(DARK_GRAY);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const foodLines = doc.splitTextToSize(meal.foods, pageW - 28);
    doc.text(foodLines, 18, y + 2);
    y += foodLines.length * 5 + 2;

    // Macros
    doc.setFontSize(8);
    doc.setTextColor(MID_GRAY);
    const macroText = [
      meal.calories != null ? `${Math.round(meal.calories)} kcal` : '',
      meal.proteins != null ? `${meal.proteins}g prot` : '',
      meal.carbs != null ? `${meal.carbs}g carbs` : '',
      meal.fats != null ? `${meal.fats}g gord` : '',
    ].filter(Boolean).join('  ·  ');
    doc.text(macroText, 18, y + 2);
    y += 8;
  }

  // Notes
  if (data.notes) {
    if (y > pageH - 30) { doc.addPage(); y = drawHeader(doc, 'Plano Alimentar'); }
    y = sectionTitle(doc, 'Observacoes', y);
    doc.setTextColor(DARK_GRAY);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(data.notes, pageW - 28);
    doc.text(lines, 14, y);
  }

  drawFooter(doc);
  const fileName = `plano_alimentar_${data.clientName.replace(/\s/g, '_')}.pdf`;
  doc.save(fileName);
}
