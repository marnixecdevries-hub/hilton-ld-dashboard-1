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

  // Try DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const euMatch = str.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
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

    // DEBUG: Log extracted text to understand PDF structure
    console.log('=== PDF EXTRACTED TEXT ===');
    console.log(fullText);
    console.log('=== END PDF TEXT ===');

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

    // For PDFs, use lenient validation — fill defaults for missing fields
    const dateStr = data.evaluation_date || '';
    let evaluationDate = '';
    if (dateStr) {
      const parsedDate = parseDate(dateStr);
      evaluationDate = parsedDate ? formatDateISO(parsedDate) : new Date().toISOString().split('T')[0];
    } else {
      evaluationDate = new Date().toISOString().split('T')[0];
    }

    // Default missing scores to 0 (will show as needing review)
    const getScore = (field: string) => {
      const val = parseInt(data[field], 10);
      return (val >= 1 && val <= 5) ? val : 0;
    };

    // Validate hotel code — try fuzzy matching for OCR errors
    let hotelCode = (data.hotel_code || '').trim().toUpperCase();
    if (hotelCode && !HOTEL_CODES.includes(hotelCode as typeof HOTEL_CODES[number])) {
      // Try to find closest match (1-character difference)
      const fuzzy = HOTEL_CODES.find(code => {
        if (Math.abs(code.length - hotelCode.length) > 1) return false;
        let diffs = 0;
        const longer = code.length >= hotelCode.length ? code : hotelCode;
        const shorter = code.length < hotelCode.length ? code : hotelCode;
        let si = 0;
        for (let li = 0; li < longer.length && diffs <= 1; li++) {
          if (shorter[si] === longer[li]) { si++; }
          else { diffs++; if (code.length === hotelCode.length) si++; }
        }
        return diffs <= 1;
      });
      hotelCode = fuzzy || '';
    }

    // Collect warnings for missing data (non-blocking)
    const warnings: ValidationError[] = [];
    if (!data.trainer_name) warnings.push({ field: 'trainer_name', message: 'Could not extract trainer name from PDF — please verify after upload' });
    if (!hotelCode) warnings.push({ field: 'hotel_code', message: 'Could not extract hotel code from PDF — please verify after upload' });

    const scoreFields = SCORE_FIELDS;
    const missingScores = scoreFields.filter(f => getScore(f) === 0);
    if (missingScores.length > 0) {
      warnings.push({ field: 'scores', message: `Could not extract ${missingScores.length} score(s) from PDF — please verify after upload` });
    }

    // Check that we have at least some useful data (scores or trainer name)
    const hasAnyScore = scoreFields.some(f => getScore(f) > 0);
    if (!data.trainer_name && !hasAnyScore) {
      return {
        success: false,
        errors: [{
          field: 'pdf',
          message: 'Could not extract any meaningful data from this PDF. Please ensure the PDF is a Hilton Train the Trainer evaluation form, or use CSV/Excel format instead.',
        }],
      };
    }

    const evaluation: ParsedEvaluation = {
      trainer_name: data.trainer_name || 'Unknown Trainer',
      trainer_department: data.trainer_department || 'Unknown',
      hotel_code: hotelCode || 'AMSAP',
      manager_name: data.manager_name || 'Unknown Manager',
      manager_department: data.manager_department || 'Unknown',
      evaluation_date: evaluationDate,
      score_work_area: getScore('score_work_area') || 3,
      score_appearance: getScore('score_appearance') || 3,
      score_body_language: getScore('score_body_language') || 3,
      score_voice: getScore('score_voice') || 3,
      score_attention: getScore('score_attention') || 3,
      score_preparation: getScore('score_preparation') || 3,
      score_demonstration: getScore('score_demonstration') || 3,
      score_practice: getScore('score_practice') || 3,
      score_follow_through: getScore('score_follow_through') || 3,
      score_question_techniques: getScore('score_question_techniques') || 3,
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

    return {
      success: true,
      data: [evaluation],
      errors: warnings,
    };
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

  // PDF text extraction concatenates items with spaces — no real newlines.
  // Use flexible patterns that capture values between known labels.

  // Helper: extract value between a label and the next known label/keyword
  function extract(labelPattern: string, stopWords: string[]): string | null {
    const stopPattern = stopWords.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const regex = new RegExp(labelPattern + '\\s*:?\\s*(.+?)\\s*(?:' + stopPattern + '|$)', 'i');
    const m = text.match(regex);
    return m ? m[1].trim() : null;
  }

  // Extract trainer info — try multiple possible label orderings
  const trainerName = extract('Trainer\\s*Name', ['Trainer\\s*Department', 'Department', 'Hotel', 'Manager', 'Date']);
  if (trainerName) result.trainer_name = trainerName;

  const trainerDept = extract('Trainer\\s*Department', ['Hotel', 'Manager', 'Date', 'Trainer\\s*Hotel']);
  if (trainerDept) result.trainer_department = trainerDept;

  // Hotel code — look for any known hotel code anywhere in the text
  const hotelCodeDirect = HOTEL_CODES.find(code => text.toUpperCase().includes(code));
  if (hotelCodeDirect) {
    result.hotel_code = hotelCodeDirect;
  } else {
    const hotelVal = extract('(?:Trainer\\s*)?Hotel', ['Manager', 'Date', 'Name', 'Presentation']);
    if (hotelVal) {
      const codeMatch = HOTEL_CODES.find(code => hotelVal.toUpperCase().includes(code));
      result.hotel_code = codeMatch || hotelVal;
    }
  }

  // Extract manager info
  const managerName = extract('Manager\\s*Name', ['Manager\\s*Department', 'Department', 'Date', 'Presentation']);
  if (managerName) result.manager_name = managerName;

  const managerDept = extract('Manager\\s*Department', ['Date', 'Presentation', 'Score', 'Training']);
  if (managerDept) result.manager_department = managerDept;

  // Date — try multiple patterns
  const datePatterns = [
    /Date\s*(?:of\s*(?:training|evaluation))?\s*:?\s*(\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4})/i,
    /Date\s*:?\s*(\d{4}-\d{1,2}-\d{1,2})/i,
    /(\d{1,2}\.\d{1,2}\.\d{4})/,
    /(\d{1,2}\/\d{1,2}\/\d{4})/,
  ];
  for (const dp of datePatterns) {
    const dm = text.match(dp);
    if (dm) {
      result.evaluation_date = dm[1].trim();
      break;
    }
  }

  // Extract scores — look for numbers 1-5 near criterion labels
  // PDF text may have the score right after the label text or nearby
  const scorePatterns: [string, string][] = [
    ['Work\\s*(?:Area|area)', 'score_work_area'],
    ['Appearance', 'score_appearance'],
    ['Body\\s*[Ll]anguage', 'score_body_language'],
    ['Voice', 'score_voice'],
    ['Attention', 'score_attention'],
    ['Preparation', 'score_preparation'],
    ['Demonstration', 'score_demonstration'],
    ['Practice', 'score_practice'],
    ['Follow\\s*[Tt]hrough', 'score_follow_through'],
    ['Question\\s*[Tt]echniques', 'score_question_techniques'],
  ];

  for (const [pattern, field] of scorePatterns) {
    // Look for a score (1-5) within ~80 chars after the criterion text
    const regex = new RegExp(pattern + '(?:[^\\d]{0,80}?)([1-5])(?:\\s|\\b)', 'i');
    const match = text.match(regex);
    if (match) {
      result[field] = match[1];
    }
  }

  // Extract strengths and development areas — very flexible patterns
  const strengthPatterns = [
    /Strengths?\s*\(?\s*[Mm]andatory\s*\)?\s*:?\s*([\s\S]+?)(?:Development|$)/i,
    /Strengths?\s*:?\s*([\s\S]+?)(?:Development|Areas?\s*to|$)/i,
  ];
  for (const sp of strengthPatterns) {
    const sm = text.match(sp);
    if (sm && sm[1].trim().length > 0) {
      result.strengths = sm[1].trim();
      break;
    }
  }

  const devPatterns = [
    /Development\s*[Aa]reas?\s*\(?\s*[Mm]andatory\s*\)?\s*:?\s*([\s\S]+?)(?:Trainer\s*Name\s*&|Signature|$)/i,
    /Development\s*[Aa]reas?\s*:?\s*([\s\S]+?)(?:Trainer\s*Name|Signature|$)/i,
    /Areas?\s*(?:to|for)\s*[Ii]mprov(?:e|ement)\s*:?\s*([\s\S]+?)(?:Trainer\s*Name|Signature|$)/i,
  ];
  for (const dp of devPatterns) {
    const dm = text.match(dp);
    if (dm && dm[1].trim().length > 0) {
      result.development_areas = dm[1].trim();
      break;
    }
  }

  // Return whatever we found — even partial data is OK
  return Object.keys(result).length > 0 ? result : null;
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
