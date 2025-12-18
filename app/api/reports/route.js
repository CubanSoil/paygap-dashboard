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
    const date = searchParams.get("year") || "2025";

    // return cached parsed objects if available
    if (globalThis.__GPG_CSV_CACHE[date]) {
      console.log("Cache Hit");
      return filterAndRespond(globalThis.__GPG_CSV_CACHE[date], { employer, postcode, size });
    }

    const csvUrl = `https://gender-pay-gap.service.gov.uk/viewing/download-data/${date}`;

    const response = await fetch(csvUrl);
    if (!response.ok) {
      return new Response(JSON.stringify({ error: "Failed to fetch CSV" }), {
        status: 500,
      });
    }

    const csvText = await response.text();
    const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
    let rows = parsed.data || [];

    globalThis.__GPG_CSV_CACHE[date] = rows;

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
  const employer = filters.employer?.toLowerCase();
  const postcode = filters.postcode?.toLowerCase();
  const size = filters.size?.toLowerCase();

  const filtered = [];

  let count = 0;
  let sumMean = 0;
  let sumMedian = 0;
  let sumMaleBonus = 0;
  let sumFemaleBonus = 0;
  let sumBonusGap = 0;

  for (const r of rows) {
    const employerName = r.EmployerName?.toLowerCase() || "";
    const post = r.PostCode?.toLowerCase() || "";
    const empSize = r.EmployerSize?.toLowerCase() || "";

    if (employer && !employerName.includes(employer)) continue;
    if (postcode && !post.includes(postcode)) continue;
    if (size && !empSize.includes(size)) continue;

    filtered.push(r);
    count++;

    const mean = Number(r.DiffMeanHourlyPercent) || 0;
    const median = Number(r.DiffMedianHourlyPercent) || 0;
    const maleBonus = Number(r.MaleBonusPercent) || 0;
    const femaleBonus = Number(r.FemaleBonusPercent) || 0;

    sumMean += mean;
    sumMedian += median;
    sumMaleBonus += maleBonus;
    sumFemaleBonus += femaleBonus;
    sumBonusGap += maleBonus - femaleBonus;
  }

  const divisor = count || 1;

  return NextResponse.json({
    rows: filtered,
    aggregated: {
      count,
      avgDiffMeanHourly: sumMean / divisor,
      avgDiffMedianHourly: sumMedian / divisor,
      avgMaleBonus: sumMaleBonus / divisor,
      avgFemaleBonus: sumFemaleBonus / divisor,
      avgBonusGap: sumBonusGap / divisor,
    },
  });
}


