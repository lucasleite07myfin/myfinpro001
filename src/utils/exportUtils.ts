/**
 * Utility functions for exporting data to different formats (CSV, Excel, PDF)
 * Ensures proper encoding, formatting, and sorting of data
 */

import { toast } from 'sonner';

/**
 * UTF-8 BOM (Byte Order Mark) for CSV files
 * Ensures proper encoding when opening in Excel
 */
export const UTF8_BOM = '\ufeff';

/**
 * Meta charset tag for Excel HTML exports
 * Ensures proper display of special characters
 */
export const EXCEL_META_CHARSET = '<meta charset="UTF-8">';

/**
 * Escapes a CSV cell value by wrapping it in quotes and escaping internal quotes
 * @param cell - The cell value to escape
 * @returns The escaped cell value
 */
export const escapeCSVCell = (cell: string | number | null | undefined): string => {
  const value = String(cell ?? '');
  // Always wrap in quotes and escape internal quotes
  return `"${value.replace(/"/g, '""')}"`;
};

/**
 * Generates a CSV string with proper BOM and escaped cells
 * @param headers - Array of header strings
 * @param rows - Array of row arrays
 * @returns Complete CSV content with BOM
 */
export const generateCSV = (headers: string[], rows: (string | number | null | undefined)[][]): string => {
  const headerLine = headers.map(h => escapeCSVCell(h)).join(',');
  const dataLines = rows.map(row => row.map(escapeCSVCell).join(',')).join('\n');
  return UTF8_BOM + headerLine + '\n' + dataLines;
};

/**
 * Generates an Excel-compatible HTML string with proper charset
 * @param sheetName - Name of the Excel worksheet
 * @param headers - Array of header strings
 * @param rows - Array of row arrays
 * @returns Complete Excel HTML content
 */
export const generateExcelHTML = (sheetName: string, headers: string[], rows: (string | number | null | undefined)[][]): string => {
  let content = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
  content += '<head>';
  content += EXCEL_META_CHARSET;
  content += `<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>${sheetName}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->`;
  content += '</head>';
  content += '<body>';
  content += '<table>';
  
  // Headers
  content += '<tr>';
  headers.forEach(header => {
    content += `<th>${header}</th>`;
  });
  content += '</tr>';
  
  // Data rows
  rows.forEach(row => {
    content += '<tr>';
    row.forEach(cell => {
      content += `<td>${cell ?? ''}</td>`;
    });
    content += '</tr>';
  });
  
  content += '</table></body></html>';
  return content;
};

/**
 * Downloads a file with the given content
 * @param content - The file content
 * @param filename - The filename for download
 * @param mimeType - The MIME type of the file
 */
export const downloadFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Sorts an array of objects by date field
 * @param items - Array of objects with a date field
 * @param order - Sort order ('asc' or 'desc')
 * @returns Sorted array
 */
export const sortByDate = <T extends { date: Date }>(items: T[], order: 'asc' | 'desc' = 'asc'): T[] => {
  return [...items].sort((a, b) => {
    const timeA = a.date.getTime();
    const timeB = b.date.getTime();
    return order === 'asc' ? timeA - timeB : timeB - timeA;
  });
};

/**
 * Generates a PDF-style HTML document with proper charset
 * @param title - Document title
 * @param subtitle - Document subtitle (optional)
 * @param headers - Table headers
 * @param rows - Table rows
 * @param footer - Optional footer rows (for totals, etc.)
 * @returns Complete HTML document
 */
export const generatePDFHTML = (
  title: string,
  subtitle: string | null,
  headers: string[],
  rows: (string | number | null | undefined)[][],
  footer?: (string | number | null | undefined)[][]
): string => {
  let content = `
    <html>
    <head>
      ${EXCEL_META_CHARSET}
      <style>
        body { font-family: Arial, sans-serif; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .total { font-weight: bold; background-color: #f9f9f9; }
        h1 { color: #333; margin-bottom: 5px; }
        .subtitle { color: #666; margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
  `;
  
  if (subtitle) {
    content += `<p class="subtitle">${subtitle}</p>`;
  }
  
  content += '<table><thead><tr>';
  
  // Headers
  headers.forEach(header => {
    content += `<th>${header}</th>`;
  });
  content += '</tr></thead><tbody>';
  
  // Data rows
  rows.forEach(row => {
    content += '<tr>';
    row.forEach(cell => {
      content += `<td>${cell ?? ''}</td>`;
    });
    content += '</tr>';
  });
  
  content += '</tbody>';
  
  // Footer (totals)
  if (footer && footer.length > 0) {
    content += '<tfoot>';
    footer.forEach(row => {
      content += '<tr class="total">';
      row.forEach(cell => {
        content += `<td>${cell ?? ''}</td>`;
      });
      content += '</tr>';
    });
    content += '</tfoot>';
  }
  
  content += '</table></body></html>';
  return content;
};
