import React from 'react'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const Chart = ({ data, type = 'line', height = 400, options = {} }) => {
  // Default options for dark mode support
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151',
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        titleColor: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#111827',
        bodyColor: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#111827',
        borderColor: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: {
          color: document.documentElement.classList.contains('dark') ? '#374151' : '#f3f4f6',
          drawBorder: false
        },
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280'
        }
      },
      y: {
        grid: {
          color: document.documentElement.classList.contains('dark') ? '#374151' : '#f3f4f6',
          drawBorder: false
        },
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280'
        }
      }
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 6
      },
      line: {
        tension: 0.4
      }
    },
    ...options
  }

  // Remove scales for doughnut charts
  if (type === 'doughnut') {
    delete defaultOptions.scales
  }

  const ChartComponent = () => {
    switch (type) {
      case 'bar':
        return <Bar data={data} options={defaultOptions} />
      case 'doughnut':
        return <Doughnut data={data} options={defaultOptions} />
      case 'line':
      default:
        return <Line data={data} options={defaultOptions} />
    }
  }

  return (
    <div style={{ height: `${height}px` }} className="w-full">
      <ChartComponent />
    </div>
  )
}

export default Chart