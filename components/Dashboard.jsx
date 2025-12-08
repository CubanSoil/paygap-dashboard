"use client";
import React, { useEffect, useState, useCallback } from "react";
import Sidebar from "./sidebar/Sidebar";
import Filters from "./filters/Filters";
import PayGapChart from "./charts/PayGapChart";
import Card from "./cards/Card";
import SummaryCard from "./cards/SummaryCard"

export default function Dashboard() {
  const [rows, setRows] = useState([]);
  const [aggregated, setAggregated] = useState(null);


  const fetchReports = useCallback(async (q = {}) => {
    const params = new URLSearchParams(q);
    const res = await fetch(`/api/reports?${params.toString()}`);
    const json = await res.json();
     setRows(json.rows || []);
    setAggregated(json.aggregated || null);
  }, []);

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-6">
      {/* Sidebar collapses on mobile */}
      <div className="md:w-64">
        <div className="hidden md:block">
          <Sidebar />
        </div>
      </div>

      <div className="flex-1 px-2 md:px-0">
        <div
          className="
            sticky top-0 z-50 
    
            border-b 
            py-2 
            mb-4 
            shadow-sm
          "
        >
          <Filters onApply={(q) => fetchReports(q)} />
        </div>

        <div className="grid grid-cols-1 gap-4 text-gray-900">
          {/* Summary Card */}
          <SummaryCard
            title="Total reports"
            value={aggregated?.count}
            subtitle={`Avg mean gap: ${
              aggregated?.avgDiffMeanHourly?.toFixed(2) || "—"
            }%`}
          />

          {/* Bonus Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Card title="Average Male Bonus" value={aggregated?.avgMaleBonus} />
            <Card
              title="Average Female Bonus"
              value={aggregated?.avgFemaleBonus}
            />
            <Card title="Average Bonus Gap" value={aggregated?.avgBonusGap} />
          </div>

          {/* Chart */}
          <div className="w-full overflow-x-auto">
            <PayGapChart data={rows.slice(0, 12)} />
          </div>

          {/* Table */}
          <div className="p-4 bg-white rounded shadow text">
            <h3 className="font-semibold mb-2">Raw sample rows</h3>

            <div className="overflow-x-auto max-h-64">
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left pr-4">Employer</th>
                    <th className="text-left pr-4">Mean %</th>
                    <th className="text-left pr-4">Median %</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-t">
                      <td className="py-2">{r.EmployerName}</td>
                      <td className="py-2">{r.DiffMeanHourlyPercent}</td>
                      <td className="py-2">{r.DiffMedianHourlyPercent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
