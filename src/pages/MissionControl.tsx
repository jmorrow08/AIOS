import React from 'react';
import { useUser } from '@/context/UserContext';
import { RadialMenu } from '@/components/RadialMenu';
import { CosmicBackground } from '@/components/CosmicBackground';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
);

const MissionControl: React.FC = () => {
  const { user } = useUser();

  // Get user's display name
  const getUserDisplayName = () => {
    if (!user) return 'Guest';
    return user.email || 'Admin';
  };

  // Dummy data for charts
  const barChartData = {
    labels: ['Completed', 'Pending'],
    datasets: [
      {
        label: 'Jobs',
        data: [45, 12],
        backgroundColor: ['rgba(93, 139, 244, 0.8)', 'rgba(244, 241, 187, 0.8)'],
        borderColor: ['rgba(93, 139, 244, 1)', 'rgba(244, 241, 187, 1)'],
        borderWidth: 1,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Jobs Completed vs Pending',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Jobs',
        },
      },
    },
  };

  const lineChartData = {
    labels: ['July', 'August', 'September', 'October', 'November', 'December'],
    datasets: [
      {
        label: 'Monthly Revenue ($)',
        data: [12000, 15000, 18000, 22000, 19000, 25000],
        borderColor: 'rgba(93, 139, 244, 1)',
        backgroundColor: 'rgba(93, 139, 244, 0.2)',
        tension: 0.4,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Monthly Revenue (Past 6 Months)',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Revenue ($)',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Month',
        },
      },
    },
  };

  const pieChartData = {
    labels: ['Cleaning', 'Consulting', 'Maintenance', 'Installation', 'Other'],
    datasets: [
      {
        data: [35, 25, 20, 15, 5],
        backgroundColor: [
          'rgba(93, 139, 244, 0.8)',
          'rgba(244, 241, 187, 0.8)',
          'rgba(14, 21, 58, 0.8)',
          'rgba(2, 12, 27, 0.8)',
          'rgba(125, 143, 244, 0.8)',
        ],
        borderColor: [
          'rgba(93, 139, 244, 1)',
          'rgba(244, 241, 187, 1)',
          'rgba(14, 21, 58, 1)',
          'rgba(2, 12, 27, 1)',
          'rgba(125, 143, 244, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      title: {
        display: true,
        text: 'Job Distribution by Service Type',
      },
    },
  };

  return (
    <div className="relative min-h-screen bg-cosmic-dark text-white">
      <CosmicBackground />
      <RadialMenu />

      <div className="relative z-10 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-cosmic-highlight mb-2">Mission Control</h1>
          <p className="text-xl text-cosmic-accent">Welcome back, {getUserDisplayName()}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {/* Bar Chart */}
          <div className="bg-cosmic-light bg-opacity-20 rounded-lg p-6 shadow-lg">
            <Bar data={barChartData} options={barChartOptions} />
          </div>

          {/* Line Chart */}
          <div className="bg-cosmic-light bg-opacity-20 rounded-lg p-6 shadow-lg">
            <Line data={lineChartData} options={lineChartOptions} />
          </div>

          {/* Pie Chart */}
          <div className="bg-cosmic-light bg-opacity-20 rounded-lg p-6 shadow-lg lg:col-span-2 xl:col-span-1">
            <Pie data={pieChartData} options={pieChartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MissionControl;
