'use client';
import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register the necessary Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function PayGapChart({ data }) {
  // Build dataset grouped by employer or quartile
  const labels = data.map((r) => r.EmployerName?.slice(0, 20) || 'Unknown');
  const meanDiffs = data.map((r) => Number(r.DiffMeanHourlyPercent) || 0);
  const medianDiffs = data.map((r) => Number(r.DiffMedianHourlyPercent) || 0);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Mean hourly % diff (M-F)',
        data: meanDiffs,
        stack: 'a',
        backgroundColor: [
        'rgba(255, 99, 132, 0.6)', // Red
      ],
      },
      {
        label: 'Median hourly % diff (M-F)',
        data: medianDiffs,
        stack: 'a',
        backgroundColor: [
        'rgba(54, 162, 235, 0.6)', // Blue
      ],
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Pay Gap Overview',
      },
    },
  };

  return (
    <div className=" p-4 bg-white rounded shadow">
      <h3 className="font-semibold mb-2">Pay Gap Overview</h3>
      <Bar data={chartData} options={options} />
    </div>
  );
}
