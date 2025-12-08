import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import Papa from "papaparse";

globalThis.__GPG_CSV_CACHE = globalThis.__GPG_CSV_CACHE || {};

export const runtime = "edge";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const employer = searchParams.get("employer");
    const postcode = searchParams.get("postcode");
    const size = searchParams.get("size");
    const date = searchParams.get("year") || "2025"; // default year

    // return cached parsed objects if available
    if (globalThis.__GPG_CSV_CACHE[date]) {
      return filterAndRespond(globalThis.__GPG_CSV_CACHE[date], { employer, postcode, size });
    }

    // Build CSV URL based on year
    const csvUrl = `https://gender-pay-gap.service.gov.uk/viewing/download-data/${date}`;

    // Fetch the CSV
    const response = await fetch(csvUrl);
    if (!response.ok) {
      return new Response(JSON.stringify({ error: "Failed to fetch CSV" }), {
        status: 500,
      });
    }

    const csvText = await response.text();

    // Parse CSV
    const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
    let rows = parsed.data || [];

    globalThis.__GPG_CSV_CACHE[date] = rows;

    if (employer)
      rows = rows.filter((r) =>
        (r.EmployerName || "").toLowerCase().includes(employer.toLowerCase())
      );
    if (postcode)
      rows = rows.filter((r) =>
        (r.PostCode || "").toLowerCase().includes(postcode.toLowerCase())
      );
    if (size)
      rows = rows.filter((r) =>
        (r.EmployerSize || "").toLowerCase().includes(size.toLowerCase())
      );

    return filterAndRespond(rows,{ employer, postcode, size })
  } catch (err) {
    console.error("Error processing request:", err);
    return NextResponse.json(
      { error: "An error occurred while processing the data." },
      { status: 500 }
    );
  }
}

function filterAndRespond(rows, filters) {
  const employer = filters.employer?.toLowerCase() || null;
  const postcode = filters.postcode?.toLowerCase() || null;
  const size = filters.size?.toLowerCase() || null;

  // --- 1. Filter in a single pass ---
  const filtered = rows.filter((r) => {
    const employerName = r.EmployerName?.toLowerCase() || "";
    const post = r.PostCode?.toLowerCase() || "";
    const empSize = r.EmployerSize?.toLowerCase() || "";

    if (employer && !employerName.includes(employer)) return false;
    if (postcode && !post.includes(postcode)) return false;
    if (size && !empSize.includes(size)) return false;

    return true;
  });

  // --- 2. Aggregate in a single pass ---
  const stats = {
    count: filtered.length,
    sumMean: 0,
    sumMedian: 0,
    sumMaleBonus: 0,
    sumFemaleBonus: 0,
    sumBonusGap: 0,
  };

  for (const r of filtered) {
    const mean = Number(r.DiffMeanHourlyPercent) || 0;
    const median = Number(r.DiffMedianHourlyPercent) || 0;
    const maleBonus = Number(r.MaleBonusPercent) || 0;
    const femaleBonus = Number(r.FemaleBonusPercent) || 0;

    stats.sumMean += mean;
    stats.sumMedian += median;
    stats.sumMaleBonus += maleBonus;
    stats.sumFemaleBonus += femaleBonus;
    stats.sumBonusGap += maleBonus - femaleBonus;
  }

  const divisor = stats.count || 1;

  const aggregated = {
    count: stats.count,
    avgDiffMeanHourly: stats.sumMean / divisor,
    avgDiffMedianHourly: stats.sumMedian / divisor,
    avgMaleBonus: stats.sumMaleBonus / divisor,
    avgFemaleBonus: stats.sumFemaleBonus / divisor,
    avgBonusGap: stats.sumBonusGap / divisor,
  };

  return NextResponse.json({
    rows: filtered,
    aggregated,
  });
}

