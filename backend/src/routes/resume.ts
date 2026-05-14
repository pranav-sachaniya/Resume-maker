import { Router, Request, Response } from 'express';
import multer from 'multer';
import { parseDocument } from '../utils/parser';
import { generateDocx, generatePdf } from '../utils/generator';
import { parseResumeToJSON, optimizeResume, calculateATSScore } from '../services/ai';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Upload and Parse Master Resume
router.post('/upload', upload.single('resume'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No resume file uploaded' });
      return;
    }

    // 1. Extract raw text from PDF/DOCX
    const rawText = await parseDocument(req.file.buffer, req.file.mimetype);

    // 2. Parse text to structured JSON using AI Agent 1
    const parsedResume = await parseResumeToJSON(rawText);

    res.json({ message: 'Resume parsed successfully', data: parsedResume });
  } catch (error: any) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: error.message || 'Failed to process resume' });
  }
});

// Optimize Resume against JD
router.post('/optimize', async (req: Request, res: Response): Promise<void> => {
  try {
    const { parsedResume, analyzedJD } = req.body;

    if (!parsedResume || !analyzedJD) {
      res.status(400).json({ error: 'Missing parsedResume or analyzedJD in request body' });
      return;
    }

    // 1. Optimize resume using AI Agent 3
    const optimizedResume = await optimizeResume(parsedResume, analyzedJD);

    // 2. Calculate ATS Score using AI Agent 4
    const scores = await calculateATSScore(parsedResume, optimizedResume, analyzedJD);

    res.json({
      message: 'Resume optimized successfully',
      data: {
        optimizedResume,
        scores
      }
    });
  } catch (error: any) {
    console.error('Optimize Error:', error);
    res.status(500).json({ error: error.message || 'Failed to optimize resume' });
  }
});

// Export Optimized Resume
router.post('/export', async (req: Request, res: Response): Promise<void> => {
  try {
    const { optimizedResume, format } = req.body;

    if (!optimizedResume || !format) {
      res.status(400).json({ error: 'Missing optimizedResume or format in request body' });
      return;
    }

    if (format === 'docx') {
      const buffer = await generateDocx(optimizedResume);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', 'attachment; filename=optimized_resume.docx');
      res.send(Buffer.from(buffer));
    } else if (format === 'pdf') {
      const uint8array = await generatePdf(optimizedResume);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=optimized_resume.pdf');
      res.send(Buffer.from(uint8array));
    } else {
      res.status(400).json({ error: 'Unsupported format. Use docx or pdf.' });
    }
  } catch (error: any) {
    console.error('Export Error:', error);
    res.status(500).json({ error: error.message || 'Failed to export resume' });
  }
});

export default router;
