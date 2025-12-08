import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import Papa from 'papaparse';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const employer = searchParams.get('employer');
    const postcode = searchParams.get('postcode');
    const size = searchParams.get('size');
    // const since = searchParams.get('since');
    const date = searchParams.get('year') || '2025'; // default year

  // Build CSV URL based on year
  const csvUrl = `https://gender-pay-gap.service.gov.uk/viewing/download-data/${date}`;

  // Fetch the CSV
  const response = await fetch(csvUrl);
  if (!response.ok) {
    return new Response(JSON.stringify({ error: 'Failed to fetch CSV' }), { status: 500 });
  }

  const csvText = await response.text();

  // Parse CSV
  const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  let rows = parsed.data || [];

    rows = rows.map((r) => {
      const safe = { ...r };
      const numericFields = [
        'DiffMeanHourlyPercent',
        'DiffMedianHourlyPercent',
        'DiffMeanBonusPercent',
        'DiffMedianBonusPercent',
        'MaleBonusPercent',
        'FemaleBonusPercent',
      ];

      numericFields.forEach((f) => {
        if (safe[f] !== undefined && safe[f] !== null && safe[f] !== '') {
          const n = Number(String(safe[f]).replace(/[^0-9eE+\-\.]/g, ''));
          safe[f] = isNaN(n) ? null : n;
        } else {
          safe[f] = null;
        }
      });

      return safe;
    });

    if (employer) rows = rows.filter((r) => (r.EmployerName || '').toLowerCase().includes(employer.toLowerCase()));
    if (postcode) rows = rows.filter((r) => (r.PostCode || '').toLowerCase().includes(postcode.toLowerCase()));
    if (size) rows = rows.filter((r) => (r.EmployerSize || '').toLowerCase().includes(size.toLowerCase()));
    // if (since) {
    //   const sDate = new Date(since);
    //   rows = rows.filter((r) => {
    //     try {
    //       const ds = new Date(r.DateSubmitted);
    //       return ds >= sDate;
    //     } catch (e) {
    //       return false;
    //     }
    //   });
    // }

   const aggregated = {
      count: rows.length,
      avgDiffMeanHourly: rows.reduce(
        (acc, cur) => acc + (Number(cur.DiffMeanHourlyPercent) || 0),
        0
      ) / (rows.length || 1),
      avgDiffMedianHourly: rows.reduce(
        (acc, cur) => acc + (Number(cur.DiffMedianHourlyPercent) || 0),
        0
      ) / (rows.length || 1),

      avgMaleBonus: rows.reduce(
        (acc, cur) => acc + (Number(cur.MaleBonusPercent) || 0),
        0
      ) / (rows.length || 1),

      avgFemaleBonus: rows.reduce(
        (acc, cur) => acc + (Number(cur.FemaleBonusPercent) || 0),
        0
      ) / (rows.length || 1),

      avgBonusGap: rows.reduce(
        (acc, cur) => acc + ((Number(cur.MaleBonusPercent) || 0) - (Number(cur.FemaleBonusPercent) || 0)),
        0
      ) / (rows.length || 1),
    };

    return NextResponse.json({ rows, aggregated });
  } catch (err) {
    console.error('Error processing request:', err);
    return NextResponse.json({ error: 'An error occurred while processing the data.' }, { status: 500 });
  }
}
