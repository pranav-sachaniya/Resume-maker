import { Router, Request, Response } from 'express';
import { analyzeJobDescription } from '../services/ai';

const router = Router();

router.post('/analyze', async (req: Request, res: Response): Promise<void> => {
  try {
    const { jdText } = req.body;

    if (!jdText) {
      res.status(400).json({ error: 'Missing jdText in request body' });
      return;
    }

    const analyzedJD = await analyzeJobDescription(jdText);

    res.json({ message: 'JD analyzed successfully', data: analyzedJD });
  } catch (error: any) {
    console.error('JD Analyze Error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze JD' });
  }
});

export default router;
