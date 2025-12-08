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
  const { employer, postcode, size } = filters;
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

    const aggregated = {
      count: rows.length,
      avgDiffMeanHourly:
        rows.reduce(
          (acc, cur) => acc + (Number(cur.DiffMeanHourlyPercent) || 0),
          0
        ) / (rows.length || 1),
      avgDiffMedianHourly:
        rows.reduce(
          (acc, cur) => acc + (Number(cur.DiffMedianHourlyPercent) || 0),
          0
        ) / (rows.length || 1),

      avgMaleBonus:
        rows.reduce(
          (acc, cur) => acc + (Number(cur.MaleBonusPercent) || 0),
          0
        ) / (rows.length || 1),

      avgFemaleBonus:
        rows.reduce(
          (acc, cur) => acc + (Number(cur.FemaleBonusPercent) || 0),
          0
        ) / (rows.length || 1),

      avgBonusGap:
        rows.reduce(
          (acc, cur) =>
            acc +
            ((Number(cur.MaleBonusPercent) || 0) -
              (Number(cur.FemaleBonusPercent) || 0)),
          0
        ) / (rows.length || 1),
    };

    return NextResponse.json({ rows, aggregated });
}
