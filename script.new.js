// ===================== ROOT CABS DASHBOARD =====================

// Base API URL
const API_BASE_URL = 'http://localhost:3000/api';

// Current period state
let currentPeriod = 'today';

// ---------- API Fetch Helpers ----------
async function fetchData(endpoint) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}

// ---------- Dashboard Data ----------
const dashboardData = {
    // Will be populated from API
    dailySummary: {},
    driverPerformance: {},
    cityWise: {},
    customerMetrics: {},
    serviceQuality: {},
    financials: {},
    paymentSummary: {},
    operationalEfficiency: {},
    marketingROI: {},
    driverIncentives: {}
};

// Load all data for the current period
async function loadDashboardData(period = 'today') {
    currentPeriod = period;
    
    try {
        // Load all data in parallel
        const [
            dailySummary,
            driverPerformance,
            cityReport,
            customerMetrics,
            serviceQuality,
            paymentSummary,
            financials,
            operationalEfficiency,
            marketingROI,
            driverIncentives
        ] = await Promise.all([
            fetchData(`/daily-summary/${period}`),
            fetchData(`/driver-performance/${period}`),
            fetchData(`/city-report/${period}`),
            fetchData(`/customer-metrics/${period}`),
            fetchData(`/service-quality/${period}`),
            fetchData(`/payment-summary/${period}`),
            fetchData(`/financials/${period}`),
            fetchData(`/operational-efficiency/${period}`),
            fetchData(`/marketing-roi/${period}`),
            fetchData(`/driver-incentives/${period}`)
        ]);

        // Update dashboard data
        if (dailySummary) {
            dashboardData.dailySummary = {
                labels: dailySummary.map(item => item.label),
                rides: dailySummary.map(item => item.rides),
                revenue: dailySummary.map(item => item.revenue)
            };
        }

        if (driverPerformance) {
            dashboardData.driverPerformance = {
                topDrivers: driverPerformance.map(driver => driver.driver_name),
                ridesCompleted: driverPerformance.map(driver => driver.rides_completed),
                ratings: driverPerformance.map(driver => driver.rating)
            };
        }

        if (cityReport) {
            dashboardData.cityWise = {
                cities: cityReport.map(city => city.city),
                rides: cityReport.map(city => city.rides),
                revenue: cityReport.map(city => city.revenue),
                growth: cityReport.map(city => city.growth)
            };
        }

        // Update other data similarly...
        
        // Initialize charts with new data
        initCharts();
        initSummaryCards();
        initQuickStats();
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// ---------- Utility Functions ----------
const formatCurrency = n => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
const formatNumber = n => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// ---------- Global Variables ----------
let revenueRideChart;
window.chartInstances = {}; // Store all chart instances for theme updates

// Store chart instance in global object for theme updates
const storeChartInstance = (id, chart) => {
  if (!window.chartInstances) window.chartInstances = {};
  window.chartInstances[id] = chart;
  return chart;
};

// ---------- Initialize Charts ----------
const initCharts = () => {
  const themeColors = window.theme ? window.theme.getChartColors(window.theme?.current || 'light') : null;
  
  // 1️⃣ Daily Revenue & Ride Summary
  const revCtx = document.getElementById('revenueRideChart').getContext('2d');
  revenueRideChart = storeChartInstance('revenueRideChart', new Chart(revCtx, {
    type: 'line',
    data: {
      labels: dashboardData.dailySummary.today.labels,
      datasets: [
        {
          label: 'Rides',
          data: dashboardData.dailySummary.today.rides,
          borderColor: themeColors?.datasets?.[0] || '#4361ee',
          backgroundColor: themeColors ? `${themeColors.datasets[0].replace('0.8', '0.1')}` : 'rgba(67,97,238,0.1)',
          tension: 0.3,
          fill: true,
          yAxisID: 'y'
        },
        {
          label: 'Revenue',
          data: dashboardData.dailySummary.today.revenue,
          borderColor: themeColors?.datasets?.[1] || '#4cc9f0',
          backgroundColor: themeColors ? `${themeColors.datasets[1].replace('0.8', '0.1')}` : 'rgba(76,201,240,0.1)',
          borderDash: [5, 5],
          tension: 0.3,
          fill: true,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { 
          position: 'top',
          labels: {
            color: themeColors?.text || '#212529'
          }
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              let label = context.dataset.label || '';
              if (label) label += ': ';
              if (context.parsed.y !== null) {
                label += context.dataset.label === 'Revenue' ? formatCurrency(context.parsed.y) : formatNumber(context.parsed.y);
              }
              return label;
            }
          }
        }
      },
      scales: {
        y: { 
          title: { 
            display: true, 
            text: 'Rides',
            color: themeColors?.text || '#212529'
          },
          grid: {
            color: themeColors?.grid || 'rgba(0, 0, 0, 0.1)'
          },
          ticks: {
            color: themeColors?.text || '#212529'
          }
        },
        y1: { 
          position: 'right', 
          grid: { 
            drawOnChartArea: false 
          }, 
          title: { 
            display: true, 
            text: 'Revenue ($)',
            color: themeColors?.text || '#212529'
          },
          ticks: {
            color: themeColors?.text || '#212529'
          }
        },
        x: {
          ticks: {
            color: themeColors?.text || '#212529'
          },
          grid: {
            color: themeColors?.grid || 'rgba(0, 0, 0, 0.1)'
          }
        }
      }
    }
  }));

  // 2️⃣ Driver Performance & Utilization
  storeChartInstance('driverPerformanceChart', new Chart(document.getElementById('driverPerformanceChart'), {
    type: 'bar',
    data: {
      labels: dashboardData.driverPerformance.topDrivers,
      datasets: [{
        label: 'Rides Completed',
        data: dashboardData.driverPerformance.ridesCompleted,
        backgroundColor: themeColors?.datasets?.[0] || 'rgba(67,97,238,0.7)'
      }]
    },
    options: {
      plugins: {
        legend: {
          labels: {
            color: themeColors?.text || '#212529'
          }
        },
        tooltip: {
          callbacks: {
            afterLabel: ctx => `Rating: ${dashboardData.driverPerformance.ratings[ctx.dataIndex]}★`
          }
        }
      },
      scales: {
        y: {
          ticks: {
            color: themeColors?.text || '#212529'
          },
          grid: {
            color: themeColors?.grid || 'rgba(0, 0, 0, 0.1)'
          }
        },
        x: {
          ticks: {
            color: themeColors?.text || '#212529'
          },
          grid: {
            color: themeColors?.grid || 'rgba(0, 0, 0, 0.1)'
          }
        }
      }
    }
  }));

  // 3️⃣ City-wise Business Report
  storeChartInstance('cityWiseChart', new Chart(document.getElementById('cityWiseChart'), {
    type: 'bar',
    data: {
      labels: dashboardData.cityWise.cities,
      datasets: [
        { 
          label: 'Rides', 
          data: dashboardData.cityWise.rides, 
          backgroundColor: themeColors?.datasets?.[0] || 'rgba(67,97,238,0.7)',
          yAxisID: 'y' 
        },
        { 
          label: 'Growth %', 
          data: dashboardData.cityWise.growth, 
          type: 'line', 
          borderColor: themeColors?.datasets?.[1] || '#4cc9f0',
          backgroundColor: themeColors?.datasets?.[1]?.replace('0.8', '0.1') || 'rgba(76,201,240,0.1)',
          yAxisID: 'y1' 
        }
      ]
    },
    options: {
      plugins: {
        legend: {
          labels: {
            color: themeColors?.text || '#212529'
          }
        }
      },
      scales: {
        y: { 
          title: { 
            display: true, 
            text: 'Rides',
            color: themeColors?.text || '#212529'
          },
          ticks: {
            color: themeColors?.text || '#212529'
          },
          grid: {
            color: themeColors?.grid || 'rgba(0, 0, 0, 0.1)'
          }
        },
        y1: { 
          position: 'right', 
          grid: { 
            drawOnChartArea: false 
          }, 
          title: { 
            display: true, 
            text: 'Growth (%)',
            color: themeColors?.text || '#212529'
          },
          ticks: {
            color: themeColors?.text || '#212529'
          }
        },
        x: {
          ticks: {
            color: themeColors?.text || '#212529'
          },
          grid: {
            color: themeColors?.grid || 'rgba(0, 0, 0, 0.1)'
          }
        }
      }
    }
  }));

  // 4️⃣ Customer Growth & Retention
  storeChartInstance('customerGrowthChart', new Chart(document.getElementById('customerGrowthChart'), {
    type: 'line',
    data: {
      labels: dashboardData.customerMetrics.months,
      datasets: [
        { 
          label: 'New Customers', 
          data: dashboardData.customerMetrics.newCustomers, 
          borderColor: themeColors?.datasets?.[0] || '#4361ee',
          backgroundColor: themeColors ? `${themeColors.datasets[0].replace('0.8', '0.1')}` : 'rgba(67,97,238,0.1)',
          fill: true 
        },
        { 
          label: 'Returning Customers', 
          data: dashboardData.customerMetrics.returningCustomers, 
          borderColor: themeColors?.datasets?.[1] || '#4cc9f0',
          backgroundColor: themeColors ? `${themeColors.datasets[1].replace('0.8', '0.1')}` : 'rgba(76,201,240,0.1)',
          fill: true 
        }
      ]
    },
    options: {
      plugins: {
        legend: {
          labels: {
            color: themeColors?.text || '#212529'
          }
        }
      },
      scales: {
        y: {
          ticks: {
            color: themeColors?.text || '#212529'
          },
          grid: {
            color: themeColors?.grid || 'rgba(0, 0, 0, 0.1)'
          }
        },
        x: {
          ticks: {
            color: themeColors?.text || '#212529'
          },
          grid: {
            color: themeColors?.grid || 'rgba(0, 0, 0, 0.1)'
          }
        }
      }
    }
  }));

  // 5️⃣ Cancellation & Service Quality
  storeChartInstance('cancellationChart', new Chart(document.getElementById('cancellationChart'), {
    type: 'doughnut',
    data: {
      labels: dashboardData.serviceQuality.reasons,
      datasets: [{
        data: dashboardData.serviceQuality.counts,
        backgroundColor: themeColors?.datasets?.slice(0, 5) || ['#4361ee', '#4cc9f0', '#f72585', '#7209b7', '#3a0ca3']
      }]
    },
    options: {
      plugins: {
        legend: {
          labels: {
            color: themeColors?.text || '#212529'
          }
        }
      }
    }
  }));

  // 6️⃣ Payment & Settlement
  storeChartInstance('paymentChart', new Chart(document.getElementById('paymentChart'), {
    type: 'bar',
    data: {
      labels: dashboardData.payments.methods,
      datasets: [{
        label: 'Transactions',
        data: dashboardData.payments.transactions,
        backgroundColor: themeColors?.datasets?.[0] || 'rgba(67,97,238,0.7)'
      }]
    },
    options: {
      plugins: {
        legend: {
          labels: {
            color: themeColors?.text || '#212529'
          }
        }
      },
      scales: {
        y: {
          ticks: {
            color: themeColors?.text || '#212529'
          },
          grid: {
            color: themeColors?.grid || 'rgba(0, 0, 0, 0.1)'
          }
        },
        x: {
          ticks: {
            color: themeColors?.text || '#212529'
          },
          grid: {
            color: themeColors?.grid || 'rgba(0, 0, 0, 0.1)'
          }
        }
      }
    }
  }));

  // 7️⃣ Driver Incentive & Payout
  storeChartInstance('incentiveChart', new Chart(document.getElementById('incentiveChart'), {
    type: 'line',
    data: {
      labels: dashboardData.driverIncentives.months,
      datasets: [
        { 
          label: 'Incentives ($)', 
          data: dashboardData.driverIncentives.incentives, 
          borderColor: themeColors?.datasets?.[0] || '#4361ee',
          backgroundColor: themeColors ? `${themeColors.datasets[0].replace('0.8', '0.1')}` : 'rgba(67,97,238,0.1)',
          fill: true 
        },
        { 
          label: 'Payouts ($)', 
          data: dashboardData.driverIncentives.payouts, 
          borderColor: themeColors?.datasets?.[1] || '#4cc9f0',
          backgroundColor: themeColors ? `${themeColors.datasets[1].replace('0.8', '0.1')}` : 'rgba(76,201,240,0.1)',
          borderDash: [5,5], 
          fill: true, 
          yAxisID: 'y1' 
        }
      ]
    },
    options: { 
      plugins: {
        legend: {
          labels: {
            color: themeColors?.text || '#212529'
          }
        }
      },
      scales: { 
        y: { 
          title: { 
            text: 'Incentives ($)', 
            display: true,
            color: themeColors?.text || '#212529'
          },
          ticks: {
            color: themeColors?.text || '#212529'
          },
          grid: {
            color: themeColors?.grid || 'rgba(0, 0, 0, 0.1)'
          }
        }, 
        y1: { 
          position: 'right', 
          grid: { 
            drawOnChartArea: false 
          }, 
          title: { 
            text: 'Payouts ($)', 
            display: true,
            color: themeColors?.text || '#212529'
          },
          ticks: {
            color: themeColors?.text || '#212529'
          }
        },
        x: {
          ticks: {
            color: themeColors?.text || '#212529'
          },
          grid: {
            color: themeColors?.grid || 'rgba(0, 0, 0, 0.1)'
          }
        }
      } 
    } 
  }));

  // 8️⃣ Operational Efficiency
  storeChartInstance('efficiencyChart', new Chart(document.getElementById('efficiencyChart'), {
    type: 'radar',
    data: {
      labels: dashboardData.operations.metrics,
      datasets: [
        { 
          label: 'Current', 
          data: dashboardData.operations.current, 
          backgroundColor: themeColors ? `${themeColors.datasets[0].replace('0.8', '0.3')}` : 'rgba(67,97,238,0.3)', 
          borderColor: themeColors?.datasets?.[0] || '#4361ee' 
        },
        { 
          label: 'Target', 
          data: dashboardData.operations.target, 
          backgroundColor: themeColors ? `${themeColors.datasets[1].replace('0.8', '0.3')}` : 'rgba(76,201,240,0.3)', 
          borderColor: themeColors?.datasets?.[1] || '#4cc9f0', 
          borderDash: [5,5] 
        }
      ]
    },
    options: {
      plugins: {
        legend: {
          labels: {
            color: themeColors?.text || '#212529'
          }
        }
      },
      scales: {
        r: {
          angleLines: {
            color: themeColors?.grid || 'rgba(0, 0, 0, 0.1)'
          },
          grid: {
            color: themeColors?.grid || 'rgba(0, 0, 0, 0.1)'
          },
          pointLabels: {
            color: themeColors?.text || '#212529'
          },
          ticks: {
            backdropColor: themeColors?.background || '#ffffff',
            color: themeColors?.text || '#212529'
          }
        }
      }
    }
  }));

  // 9️⃣ Marketing ROI / Offer Performance
  storeChartInstance('marketingChart', new Chart(document.getElementById('marketingChart'), {
    type: 'bar',
    data: {
      labels: dashboardData.marketing.campaigns,
      datasets: [
        { 
          label: 'Spend ($)', 
          data: dashboardData.marketing.spend, 
          backgroundColor: themeColors?.datasets?.[0] || 'rgba(67,97,238,0.7)', 
          yAxisID: 'y' 
        },
        { 
          label: 'Revenue ($)', 
          data: dashboardData.marketing.revenue, 
          backgroundColor: themeColors?.datasets?.[1] || 'rgba(76,201,240,0.7)', 
          yAxisID: 'y' 
        },
        { 
          label: 'ROI (%)', 
          data: dashboardData.marketing.roi, 
          type: 'line', 
          borderColor: themeColors?.datasets?.[2] || '#f72585',
          backgroundColor: themeColors ? `${themeColors.datasets[2].replace('0.8', '0.1')}` : 'rgba(247, 37, 133, 0.1)',
          yAxisID: 'y1' 
        }
      ]
    },
    options: {
      plugins: {
        legend: {
          labels: {
            color: themeColors?.text || '#212529'
          }
        }
      },
      scales: {
        y: { 
          title: { 
            display: true, 
            text: 'Amount ($)',
            color: themeColors?.text || '#212529'
          },
          ticks: {
            color: themeColors?.text || '#212529'
          },
          grid: {
            color: themeColors?.grid || 'rgba(0, 0, 0, 0.1)'
          }
        },
        y1: { 
          position: 'right', 
          grid: { 
            drawOnChartArea: false 
          }, 
          title: { 
            display: true, 
            text: 'ROI (%)',
            color: themeColors?.text || '#212529'
          },
          ticks: {
            color: themeColors?.text || '#212529'
          }
        },
        x: {
          ticks: {
            color: themeColors?.text || '#212529'
          },
          grid: {
            color: themeColors?.grid || 'rgba(0, 0, 0, 0.1)'
          }
        }
      }
    }
  }));

  // 🔟 Profitability & Cost Report
  storeChartInstance('profitabilityChart', new Chart(document.getElementById('profitabilityChart'), {
    type: 'line',
    data: {
      labels: dashboardData.financials.months,
      datasets: [
        { 
          label: 'Revenue', 
          data: dashboardData.financials.revenue, 
          borderColor: themeColors?.datasets?.[0] || '#4361ee',
          backgroundColor: themeColors ? `${themeColors.datasets[0].replace('0.8', '0.1')}` : 'rgba(67,97,238,0.1)',
          fill: true 
        },
        { 
          label: 'Costs', 
          data: dashboardData.financials.costs, 
          borderColor: themeColors?.datasets?.[2] || '#f72585',
          backgroundColor: themeColors ? `${themeColors.datasets[2].replace('0.8', '0.1')}` : 'rgba(247, 37, 133, 0.1)',
          fill: true 
        },
        { 
          label: 'Profit', 
          data: dashboardData.financials.profit, 
          borderColor: themeColors?.datasets?.[1] || '#4cc9f0',
          backgroundColor: themeColors ? `${themeColors.datasets[1].replace('0.8', '0.1')}` : 'rgba(76,201,240,0.1)',
          fill: true 
        }
      ]
    },
    options: {
      plugins: {
        legend: {
          labels: {
            color: themeColors?.text || '#212529'
          }
        }
      },
      scales: {
        y: {
          ticks: {
            color: themeColors?.text || '#212529'
          },
          grid: {
            color: themeColors?.grid || 'rgba(0, 0, 0, 0.1)'
          }
        },
        x: {
          ticks: {
            color: themeColors?.text || '#212529'
          },
          grid: {
            color: themeColors?.grid || 'rgba(0, 0, 0, 0.1)'
          }
        }
      }
    ];

    const summaryContainer = document.querySelector('.summary-cards');
    if (!summaryContainer) return;

    summaryContainer.innerHTML = summaryCards.map(card => `
      <div class="summary-card">
        <div class="card-content">
          <div class="card-value">${card.value}</div>
          <div class="card-label">${card.label}</div>
          ${card.change ? `
            <div class="card-change ${card.trend}">
              <i class="fas fa-${card.trend === 'up' ? 'arrow-up' : 'arrow-down'}"></i>
              ${card.change}
            </div>
          ` : ''}
        </div>
        <div class="card-icon">
          <i class="fas fa-${getCardIcon(card.id)}"></i>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error initializing summary cards:', error);
  }
};

function getCardIcon(id) {
  const icons = {
    'total-rides': 'taxi',
    'total-revenue': 'money-bill-wave',
    'completed-rides': 'check-circle',
    'cancellation-rate': 'times-circle',
    'avg-fare': 'dollar-sign',
    'driver-performance': 'star'
  };
  return icons[id] || 'chart-line';
}

function calculateChange(prev, current) {
  if (!prev || !current) return '0%';
  const change = ((current - prev) / prev * 100).toFixed(1);
  return `${change}%`;
}

function calculateTrend(prev, current) {
  if (!prev || !current) return 'neutral';
  return current >= prev ? 'up' : 'down';
}

// ---------- Quick Stats ----------
const initQuickStats = async () => {
  try {
    // Fetch operational efficiency data
    const [efficiencyData, paymentData, serviceQuality] = await Promise.all([
      fetchData('/operational-efficiency/today'),
      fetchData('/payment-summary/today'),
      fetchData('/service-quality/today')
    ]);

    if (!efficiencyData || !paymentData) return;

    // Calculate payment method distribution
    const totalPayments = paymentData.reduce((sum, item) => sum + item.transactions, 0);
    const paymentMethods = paymentData.map(item => ({
      method: item.method,
      percentage: Math.round((item.transactions / totalPayments) * 100)
    }));

    // Get top payment method
    const topPaymentMethod = paymentMethods.length > 0 
      ? paymentMethods.reduce((prev, current) => 
          (prev.percentage > current.percentage) ? prev : current
        )
      : { method: 'N/A', percentage: 0 };

    // Get service quality metrics
    const cancellationRate = serviceQuality?.find(item => item.reason === 'Rider Cancelled')?.count || 0;
    const totalServiceIssues = serviceQuality?.reduce((sum, item) => sum + item.count, 0) || 0;
    const serviceQualityScore = totalServiceIssues > 0 
      ? 100 - Math.min(100, (cancellationRate / totalServiceIssues) * 100)
      : 100;

    const quickStats = [
      { 
        icon: 'clock', 
        value: efficiencyData.find(item => item.metric === 'On-time Performance (%)')?.current_value + '%' || 'N/A', 
        label: 'On-time Performance' 
      },
      { 
        icon: 'percentage', 
        value: efficiencyData.find(item => item.metric === 'Ride Completion (%)')?.current_value + '%' || 'N/A', 
        label: 'Ride Completion' 
      },
      { 
        icon: 'gas-pump', 
        value: efficiencyData.find(item => item.metric === 'Fuel Efficiency (km/l)')?.current_value + ' km/l' || 'N/A', 
        label: 'Fuel Efficiency' 
      },
      { 
        icon: 'users', 
        value: efficiencyData.find(item => item.metric === 'Driver Utilization (%)')?.current_value + '%' || 'N/A', 
        label: 'Driver Utilization' 
      },
      { 
        icon: 'credit-card', 
        value: topPaymentMethod.percentage + '%', 
        label: `Top Payment: ${topPaymentMethod.method}` 
      },
      { 
        icon: 'shield-alt', 
        value: Math.round(serviceQualityScore) + '%', 
        label: 'Service Quality' 
      }
    ];

    const quickStatsContainer = document.querySelector('.quick-stats');
    if (!quickStatsContainer) return;

    quickStatsContainer.innerHTML = quickStats.map(stat => `
      <div class="stat-item">
        <div class="stat-icon">
          <i class="fas fa-${stat.icon}"></i>
        </div>
        <div class="stat-details">
          <div class="stat-value">${stat.value}</div>
          <div class="stat-label">${stat.label}</div>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error initializing quick stats:', error);

  }
});

// Initialize event listeners
function initEventListeners() {
    // Time period toggle
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update data based on selected period
            const period = btn.getAttribute('data-period');
            await loadDashboardData(period);
        });
    });
    
    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('change', (e) => {
            const theme = e.target.checked ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
            
            // Reinitialize charts to apply theme changes
            initCharts();
        });
    }
}
// Initialize dashboard when DOM is fully loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.getElementById('theme-toggle').checked = savedTheme === 'dark';
    
    // Initialize dashboard with data loading
    await loadDashboardData('today');
    
    // Initialize components
    initCharts();
    initSummaryCards();
    initQuickStats();
    
    // Initialize event listeners
    initEventListeners();
});
