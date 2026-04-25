// 日历路由

import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const calendarRouter = Router();

calendarRouter.get('/workouts', async (_req, res) => {
  try {
    const records = await prisma.workoutLog.findMany({
      orderBy: { date: 'asc' },
    });
    res.json({
      success: true,
      items: records.map(r => ({
        date: r.date,
        exercises: r.exercises,
        duration: r.duration,
      })),
      count: records.length,
      source: 'database',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[calendar-workouts]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

calendarRouter.get('/studies', async (_req, res) => {
  try {
    const records = await prisma.studyLog.findMany({
      orderBy: { date: 'asc' },
    });
    res.json({
      success: true,
      items: records.map(r => ({
        date: r.date,
        subject: r.subject,
        duration: r.duration,
      })),
      count: records.length,
      source: 'database',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[calendar-studies]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});
