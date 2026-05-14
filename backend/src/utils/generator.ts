import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont } from 'pdf-lib';

// Replace Unicode characters that WinAnsi (pdf-lib standard fonts) cannot encode
function sanitizeText(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u2018\u2019\u02bc\u02b9\u0060\u00b4]/g, "'")  // curly/modifier apostrophes → '
    .replace(/[\u201c\u201d]/g, '"')                            // curly quotes → "
    .replace(/\u2013/g, '-')                                    // en dash → -
    .replace(/\u2014/g, '--')                                   // em dash → --
    .replace(/\u2026/g, '...')                                  // ellipsis → ...
    .replace(/\u2022/g, '*')                                    // bullet → *
    .replace(/\u00a0/g, ' ')                                    // non-breaking space → space
    .replace(/[^\x00-\xFF]/g, '');                              // strip anything else outside Latin-1
}

export async function generateDocx(resumeJson: any): Promise<Buffer> {
  const children: any[] = [];

  // Personal Info
  if (resumeJson.personalInfo) {
    children.push(
      new Paragraph({
        text: resumeJson.personalInfo.name || 'Candidate Name',
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun(`${resumeJson.personalInfo.email || ''} | ${resumeJson.personalInfo.phone || ''}`),
        ],
      })
    );
  }

  // Summary
  if (resumeJson.summary) {
    children.push(
      new Paragraph({ text: 'Professional Summary', heading: HeadingLevel.HEADING_2, spacing: { before: 400 } }),
      new Paragraph({ text: resumeJson.summary })
    );
  }

  // Skills
  if (resumeJson.skills && resumeJson.skills.length > 0) {
    children.push(
      new Paragraph({ text: 'Skills', heading: HeadingLevel.HEADING_2, spacing: { before: 400 } }),
      new Paragraph({ text: resumeJson.skills.join(' • ') })
    );
  }

  // Experience
  if (resumeJson.experience && resumeJson.experience.length > 0) {
    children.push(new Paragraph({ text: 'Experience', heading: HeadingLevel.HEADING_2, spacing: { before: 400 } }));
    
    resumeJson.experience.forEach((exp: any) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: exp.title || '', bold: true }),
            new TextRun({ text: ` at ${exp.company || ''}` }),
          ],
          spacing: { before: 200 }
        }),
        new Paragraph({
          text: `${exp.startDate || ''} - ${exp.endDate || ''}`,
          italics: true,
        })
      );
      
      if (exp.description && exp.description.length > 0) {
        exp.description.forEach((desc: string) => {
          children.push(
            new Paragraph({
              text: desc,
              bullet: { level: 0 }
            })
          );
        });
      }
    });
  }

  const doc = new Document({
    sections: [{
      properties: {},
      children: children,
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
}

// Helper: wrap text into lines that fit within maxWidth
function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const lineWidth = font.widthOfTextAtSize(testLine, fontSize);
    if (lineWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

export async function generatePdf(resumeJson: any): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const regularFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  const margin = 50;
  const pageWidth = 595;
  const pageHeight = 842;
  const contentWidth = pageWidth - margin * 2;
  const lineHeight = 18;
  const sectionGap = 12;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const ensureSpace = (needed: number) => {
    if (y - needed < margin) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
  };

  const drawWrapped = (text: string, x: number, font: PDFFont, size: number, color = rgb(0, 0, 0)) => {
    const safe = sanitizeText(text);
    const lines = wrapText(safe, font, size, contentWidth - (x - margin));
    for (const line of lines) {
      ensureSpace(size + 4);
      page.drawText(line, { x, y, size, font, color });
      y -= size + 4;
    }
  };

  const drawSectionHeader = (title: string) => {
    y -= sectionGap;
    ensureSpace(20);
    page.drawText(sanitizeText(title), { x: margin, y, size: 14, font: boldFont, color: rgb(0, 0, 0) });
    y -= 16;
    page.drawLine({ start: { x: margin, y }, end: { x: pageWidth - margin, y }, thickness: 0.8, color: rgb(0.3, 0.3, 0.3) });
    y -= 8;
  };

  // ── Personal Info ──
  if (resumeJson.personalInfo) {
    const name = sanitizeText(resumeJson.personalInfo.name || 'Candidate Name');
    const nameWidth = boldFont.widthOfTextAtSize(name, 22);
    page.drawText(name, { x: (pageWidth - nameWidth) / 2, y, size: 22, font: boldFont });
    y -= 28;

    const contactParts: string[] = [];
    if (resumeJson.personalInfo.email)     contactParts.push(sanitizeText(resumeJson.personalInfo.email));
    if (resumeJson.personalInfo.phone)     contactParts.push(sanitizeText(resumeJson.personalInfo.phone));
    if (resumeJson.personalInfo.linkedin)  contactParts.push(sanitizeText(resumeJson.personalInfo.linkedin));
    if (resumeJson.personalInfo.portfolio) contactParts.push(sanitizeText(resumeJson.personalInfo.portfolio));

    const contactLine = contactParts.join('  |  ');
    const contactWidth = regularFont.widthOfTextAtSize(contactLine, 10);
    page.drawText(contactLine, { x: Math.max(margin, (pageWidth - contactWidth) / 2), y, size: 10, font: regularFont, color: rgb(0.3, 0.3, 0.3) });
    y -= 20;
  }

  // ── Summary ──
  if (resumeJson.summary) {
    drawSectionHeader('Professional Summary');
    drawWrapped(resumeJson.summary, margin, regularFont, 11);
  }

  // ── Skills ──
  if (resumeJson.skills && resumeJson.skills.length > 0) {
    drawSectionHeader('Skills');
    const skillsText = resumeJson.skills.map((s: string) => sanitizeText(s)).join('  -  ');
    const lines = wrapText(skillsText, regularFont, 11, contentWidth);
    for (const line of lines) {
      ensureSpace(15);
      page.drawText(line, { x: margin, y, size: 11, font: regularFont });
      y -= 15;
    }
  }

  // ── Experience ──
  if (resumeJson.experience && resumeJson.experience.length > 0) {
    drawSectionHeader('Work Experience');
    for (const exp of resumeJson.experience) {
      ensureSpace(50);
      const titleLine = sanitizeText(`${exp.title || ''}  -  ${exp.company || ''}`);
      page.drawText(titleLine, { x: margin, y, size: 12, font: boldFont });
      y -= 16;
      if (exp.startDate || exp.endDate) {
        const dateStr = sanitizeText(`${exp.startDate || ''} - ${exp.endDate || 'Present'}`);
        page.drawText(dateStr, { x: margin, y, size: 10, font: regularFont, color: rgb(0.4, 0.4, 0.4) });
        y -= 14;
      }
      if (exp.description && exp.description.length > 0) {
        for (const bullet of exp.description) {
          ensureSpace(lineHeight);
          page.drawText('*', { x: margin, y, size: 11, font: regularFont });
          drawWrapped(bullet, margin + 14, regularFont, 11);
        }
      }
      y -= sectionGap / 2;
    }
  }

  // ── Education ──
  if (resumeJson.education && resumeJson.education.length > 0) {
    drawSectionHeader('Education');
    for (const edu of resumeJson.education) {
      ensureSpace(36);
      page.drawText(sanitizeText(edu.degree || ''), { x: margin, y, size: 12, font: boldFont });
      y -= 16;
      const instText = sanitizeText(`${edu.institution || ''}${edu.year ? '  -  ' + edu.year : ''}`);
      page.drawText(instText, { x: margin, y, size: 10, font: regularFont, color: rgb(0.4, 0.4, 0.4) });
      y -= 18;
    }
  }

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

