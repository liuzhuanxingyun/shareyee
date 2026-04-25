// 中国地图路由

import { Router } from 'express';
import { fetchJsonWithUA } from '../utils/fetch.js';

export const chinaMapRouter = Router();

chinaMapRouter.get('/', async (_req, res) => {
  const mapSources = [
    'https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json',
    'https://fastly.jsdelivr.net/npm/echarts@5/map/json/china.json',
    'https://unpkg.com/echarts@5/map/json/china.json',
  ];

  for (const url of mapSources) {
    try {
      const geojson = await fetchJsonWithUA(url);
      return res.json({ success: true, source: url, geojson });
    } catch (err) {
      console.error('[china-map]', url, err.message);
    }
  }

  return res.status(503).json({
    success: false,
    error: 'All china map sources unavailable',
  });
});
