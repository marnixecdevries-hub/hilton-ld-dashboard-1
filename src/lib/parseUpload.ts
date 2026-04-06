import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { ParseResult, ParsedEvaluation, ValidationError } from '@/types';
import { HOTEL_CODES } from './constants';

const REQUIRED_FIELDS = [
  'trainer_name', 'trainer_department', 'hotel_code',
  'manager_name', 'manager_department', 'evaluation_date',
  'score_work_area', 'score_appearance', 'score_body_language',
  'score_voice', 'score_attention', 'score_preparation',
  'score_demonstration', 'score_practice', 'score_follow_through',
  'score_question_techniques', 'strengths', 'development_areas',
];

const SCORE_FIELDS = [
  'score_work_area', 'score_appearance', 'score_body_language',
  'score_voice', 'score_attention', 'score_preparation',
  'score_demonstration', 'score_practice', 'score_follow_through',
  'score_question_techniques',
];

const NOTES_FIELDS = [
  'notes_work_area', 'notes_appearance', 'notes_body_language',
  'notes_voice', 'notes_attention', 'notes_preparation',
  'notes_demonstration', 'notes_practice', 'notes_follow_through',
  'notes_question_techniques',
];

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, '_');
}

function validateRow(row: Record<string, string>, rowIndex: number): { data?: ParsedEvaluation; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  // Check required text fields
  for (const field of ['trainer_name', 'trainer_department', 'hotel_code', 'manager_name', 'manager_department', 'strengths', 'development_areas']) {
    if (!row[field]?.trim()) {
      errors.push({ field, message: `Row ${rowIndex}: "${field}" is required` });
    }
  }

  // Validate hotel code
  const hotelCode = row.hotel_code?.trim().toUpperCase();
  if (hotelCode && !HOTEL_CODES.includes(hotelCode as typeof HOTEL_CODES[number])) {
    errors.push({ field: 'hotel_code', message: `Row ${rowIndex}: Invalid hotel code "${hotelCode}". Must be one of: ${HOTEL_CODES.join(', ')}` });
  }

  // Validate date
  const dateStr = row.evaluation_date?.trim();
  if (!dateStr) {
    errors.push({ field: 'evaluation_date', message: `Row ${rowIndex}: "evaluation_date" is required` });
  } else {
    const date = parseDate(dateStr);
    if (!date) {
      errors.push({ field: 'evaluation_date', message: `Row ${rowIndex}: Invalid date "${dateStr}". Use YYYY-MM-DD, DD/MM/YYYY, or MM/DD/YYYY` });
    }
  }

  // Validate scores
  for (const field of SCORE_FIELDS) {
    const val = parseInt(row[field]?.trim(), 10);
    if (isNaN(val) || val < 1 || val > 5) {
      errors.push({ field, message: `Row ${rowIndex}: "${field}" must be an integer between 1 and 5 (got "${row[field]}")` });
    }
  }

  if (errors.length > 0) {
    return { errors };
  }

  const data: ParsedEvaluation = {
    trainer_name: row.trainer_name.trim(),
    trainer_department: row.trainer_department.trim(),
    hotel_code: hotelCode,
    manager_name: row.manager_name.trim(),
    manager_department: row.manager_department.trim(),
    evaluation_date: formatDateISO(parseDate(dateStr)!),
    score_work_area: parseInt(row.score_work_area, 10),
    score_appearance: parseInt(row.score_appearance, 10),
    score_body_language: parseInt(row.score_body_language, 10),
    score_voice: parseInt(row.score_voice, 10),
    score_attention: parseInt(row.score_attention, 10),
    score_preparation: parseInt(row.score_preparation, 10),
    score_demonstration: parseInt(row.score_demonstration, 10),
    score_practice: parseInt(row.score_practice, 10),
    score_follow_through: parseInt(row.score_follow_through, 10),
    score_question_techniques: parseInt(row.score_question_techniques, 10),
    strengths: row.strengths.trim(),
    development_areas: row.development_areas.trim(),
    notes_work_area: row.notes_work_area?.trim() || '',
    notes_appearance: row.notes_appearance?.trim() || '',
    notes_body_language: row.notes_body_language?.trim() || '',
    notes_voice: row.notes_voice?.trim() || '',
    notes_attention: row.notes_attention?.trim() || '',
    notes_preparation: row.notes_preparation?.trim() || '',
    notes_demonstration: row.notes_demonstration?.trim() || '',
    notes_practice: row.notes_practice?.trim() || '',
    notes_follow_through: row.notes_follow_through?.trim() || '',
    notes_question_techniques: row.notes_question_techniques?.trim() || '',
  };

  return { data, errors: [] };
}

function parseDate(str: string): Date | null {
  // Try YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const d = new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));
    if (!isNaN(d.getTime())) return d;
  }

  // Try DD/MM/YYYY or DD-MM-YYYY
  const euMatch = str.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/);
  if (euMatch) {
    const d = new Date(parseInt(euMatch[3]), parseInt(euMatch[2]) - 1, parseInt(euMatch[1]));
    if (!isNaN(d.getTime())) return d;
  }

  // Try native Date parsing as fallback
  const d = new Date(str);
  if (!isNaN(d.getTime())) return d;

  return null;
}

function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function parseCSV(content: string): ParseResult {
  const result = Papa.parse(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: normalizeHeader,
  });

  if (result.errors.length > 0 && result.data.length === 0) {
    return {
      success: false,
      errors: result.errors.map(e => ({ field: 'csv', message: e.message })),
    };
  }

  const rows = result.data as Record<string, string>[];
  return validateRows(rows);
}

export function parseXLSX(buffer: ArrayBuffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { raw: false });

  // Normalize headers
  const normalizedRows = rows.map(row => {
    const normalized: Record<string, string> = {};
    for (const [key, value] of Object.entries(row)) {
      normalized[normalizeHeader(key)] = String(value || '');
    }
    return normalized;
  });

  return validateRows(normalizedRows);
}

function validateRows(rows: Record<string, string>[]): ParseResult {
  if (rows.length === 0) {
    return { success: false, errors: [{ field: 'file', message: 'No data rows found in file' }] };
  }

  // Check that required headers exist in the first row
  const headers = Object.keys(rows[0]);
  const missingHeaders = REQUIRED_FIELDS.filter(f => !headers.includes(f));
  if (missingHeaders.length > 0) {
    return {
      success: false,
      errors: [{ field: 'headers', message: `Missing required columns: ${missingHeaders.join(', ')}` }],
    };
  }

  const allErrors: ValidationError[] = [];
  const validData: ParsedEvaluation[] = [];

  for (let i = 0; i < rows.length; i++) {
    const { data, errors } = validateRow(rows[i], i + 1);
    allErrors.push(...errors);
    if (data) validData.push(data);
  }

  if (allErrors.length > 0) {
    return { success: false, errors: allErrors };
  }

  return { success: true, data: validData };
}

export async function parsePDF(buffer: ArrayBuffer): Promise<ParseResult> {
  try {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

    // Extract text from all pages
    const textLines: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ');
      textLines.push(pageText);
    }
    const fullText = textLines.join('\n');

    // Try to extract form fields from the PDF text
    const data = extractScorecardFromText(fullText);

    if (!data) {
      return {
        success: false,
        errors: [{
          field: 'pdf',
          message: 'Could not extract scorecard data from this PDF. Please ensure the PDF is a filled-in Hilton Train the Trainer evaluation form, or use CSV/Excel format instead.',
        }],
      };
    }

    // Validate the extracted data
    const row: Record<string, string> = {
      trainer_name: data.trainer_name || '',
      trainer_department: data.trainer_department || '',
      hotel_code: data.hotel_code || '',
      manager_name: data.manager_name || '',
      manager_department: data.manager_department || '',
      evaluation_date: data.evaluation_date || '',
      score_work_area: data.score_work_area || '',
      score_appearance: data.score_appearance || '',
      score_body_language: data.score_body_language || '',
      score_voice: data.score_voice || '',
      score_attention: data.score_attention || '',
      score_preparation: data.score_preparation || '',
      score_demonstration: data.score_demonstration || '',
      score_practice: data.score_practice || '',
      score_follow_through: data.score_follow_through || '',
      score_question_techniques: data.score_question_techniques || '',
      strengths: data.strengths || '',
      development_areas: data.development_areas || '',
      notes_work_area: '',
      notes_appearance: '',
      notes_body_language: '',
      notes_voice: '',
      notes_attention: '',
      notes_preparation: '',
      notes_demonstration: '',
      notes_practice: '',
      notes_follow_through: '',
      notes_question_techniques: '',
    };

    return validateRows([row]);
  } catch (error) {
    return {
      success: false,
      errors: [{
        field: 'pdf',
        message: `Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }],
    };
  }
}

function extractScorecardFromText(text: string): Record<string, string> | null {
  const result: Record<string, string> = {};

  // Extract trainer info
  const trainerNameMatch = text.match(/Trainer\s*Name:\s*([^\n]+?)(?:\s*Trainer\s*Department:|$)/i);
  if (trainerNameMatch) result.trainer_name = trainerNameMatch[1].trim();

  const trainerDeptMatch = text.match(/Trainer\s*Department:\s*([^\n]+?)(?:\s*Trainer\s*Hotel:|$)/i);
  if (trainerDeptMatch) result.trainer_department = trainerDeptMatch[1].trim();

  const hotelMatch = text.match(/Trainer\s*Hotel:\s*([^\n]+?)(?:\s*Manager|$)/i);
  if (hotelMatch) {
    const hotelText = hotelMatch[1].trim();
    // Try to match a known hotel code
    const codeMatch = HOTEL_CODES.find(code =>
      hotelText.toUpperCase().includes(code)
    );
    result.hotel_code = codeMatch || hotelText;
  }

  // Extract manager info
  const managerNameMatch = text.match(/Manager\s*Name:\s*([^\n]+?)(?:\s*Manager\s*Department:|$)/i);
  if (managerNameMatch) result.manager_name = managerNameMatch[1].trim();

  const managerDeptMatch = text.match(/Manager\s*Department:\s*([^\n]+?)(?:\s*Date|$)/i);
  if (managerDeptMatch) result.manager_department = managerDeptMatch[1].trim();

  const dateMatch = text.match(/Date\s*(?:of\s*training)?:\s*([^\n]+?)(?:\s*Manager|$)/i);
  if (dateMatch) result.evaluation_date = dateMatch[1].trim();

  // Extract scores - look for numbers 1-5 near criterion labels
  const scorePatterns: [string, string][] = [
    ['Work\\s*Area', 'score_work_area'],
    ['Appearance', 'score_appearance'],
    ['Body\\s*Language', 'score_body_language'],
    ['Voice', 'score_voice'],
    ['Attention', 'score_attention'],
    ['Preparation\\s*\\(has', 'score_preparation'],
    ['Demonstration', 'score_demonstration'],
    ['Practice\\s*\\(allows', 'score_practice'],
    ['Follow\\s*through', 'score_follow_through'],
    ['Question\\s*techniques', 'score_question_techniques'],
  ];

  for (const [pattern, field] of scorePatterns) {
    // Look for a score (1-5) appearing near the criterion text
    const regex = new RegExp(pattern + '[^\\d]*([1-5])', 'i');
    const match = text.match(regex);
    if (match) {
      result[field] = match[1];
    }
  }

  // Extract averages section for scores if individual scores weren't found
  const avgPresentationMatch = text.match(/Presentation\s*skills?:\s*([\d.]+)/i);
  const avgDeliveryMatch = text.match(/Training\s*delivery:\s*([\d.]+)/i);
  const avgCoachingMatch = text.match(/Coaching:\s*([\d.]+)/i);
  const overallMatch = text.match(/Overall\s*Score:\s*([\d.]+)/i);

  // Extract strengths and development areas
  const strengthsMatch = text.match(/Strengths?\s*\(mandatory\):\s*([\s\S]+?)(?:Development|$)/i);
  if (strengthsMatch) result.strengths = strengthsMatch[1].trim();

  const devMatch = text.match(/Development\s*areas?\s*\(Mandatory\):\s*([\s\S]+?)(?:Trainer\s*Name\s*&\s*Signature|$)/i);
  if (devMatch) result.development_areas = devMatch[1].trim();

  // Check if we got enough data to be useful
  const hasTrainer = result.trainer_name && result.trainer_name.length > 0;
  const hasScores = Object.keys(result).filter(k => k.startsWith('score_')).length > 0;

  if (!hasTrainer && !hasScores) {
    return null;
  }

  return result;
}

export function parseFile(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    if (file.name.endsWith('.csv')) {
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(parseCSV(content));
      };
      reader.readAsText(file);
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      reader.onload = (e) => {
        const buffer = e.target?.result as ArrayBuffer;
        resolve(parseXLSX(buffer));
      };
      reader.readAsArrayBuffer(file);
    } else if (file.name.endsWith('.pdf')) {
      reader.onload = async (e) => {
        const buffer = e.target?.result as ArrayBuffer;
        const result = await parsePDF(buffer);
        resolve(result);
      };
      reader.readAsArrayBuffer(file);
    } else {
      resolve({
        success: false,
        errors: [{ field: 'file', message: 'Unsupported file type. Please upload a .csv, .xlsx, or .pdf file.' }],
      });
    }
  });
}
