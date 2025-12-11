// ======================================================
// 📊 DASHBOARD SCRIPT — COMPLETE 10 REPORTS
// ======================================================
const API_BASE_URL = "http://localhost:5000";
const API_TIMEOUT = 10000; // 10 seconds
let currentPeriod = "today";
window.chartInstances = {};

// ===== FETCH DATA FROM API =====
async function fetchData(table, period) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
  
  try {
    const endpoint = table === 'daily_summary2' 
      ? `${API_BASE_URL}/api/daily_summary2/${period}`
      : `${API_BASE_URL}/api/${table}/${period}`;
      
    console.log(`🔍 [${new Date().toISOString()}] Fetching data from: ${endpoint}`);
    
    const response = await fetch(endpoint, {
      signal: controller.signal,
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error ${response.status} fetching ${table}:`, errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    
    // Log successful data fetch with data size
    const dataSize = JSON.stringify(data).length / 1024; // Size in KB
    console.log(`✅ [${new Date().toISOString()}] Successfully fetched ${table} (${dataSize.toFixed(2)} KB)`, data);
    
    // Handle empty or invalid responses
    if (!data) {
      console.warn(`⚠️ No data returned for ${table}`);
      return table === 'daily_summary2' ? [{}] : [];
    }
    
    // For daily_summary2, ensure we return an array with the first item
    if (table === 'daily_summary2') {
      return Array.isArray(data) ? data : [data || {}];
    }
    
    return Array.isArray(data) ? data : [data];
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      console.error(`⏰ Timeout (${API_TIMEOUT}ms) while fetching ${table}`);
      throw new Error(`Request timed out after ${API_TIMEOUT}ms`);
    }
    
    console.error(`❌ Error in fetchData for ${table}:`, error);
    
    // Return appropriate empty structure based on expected return type
    return table === 'daily_summary2' ? [{}] : [];
  }
}

// Helper function to safely parse numeric values
function safeNumber(value, defaultValue = 0) {
  const num = parseFloat(value);
  return isNaN(num) ? defaultValue : num;
}

// ===== UPDATE DASHBOARD =====
async function updateDashboardData(period) {
  currentPeriod = period;
  console.log(`🔄 [${new Date().toISOString()}] Fetching dashboard data for: ${period}`);

  // Show loading state
  document.body.style.cursor = 'wait';
  const loadingOverlay = document.getElementById('loadingOverlay');
  if (loadingOverlay) loadingOverlay.style.display = 'flex';
  
  // Clear any existing error messages
  const errorElements = document.querySelectorAll('.error-message');
  errorElements.forEach(el => el.remove());
  
  try {
    // Define all data endpoints to fetch
    const endpoints = [
      { key: 'daily_summary2', func: fetchData },
      { key: 'daily_summary', func: fetchData },
      { key: 'driver_performance', func: fetchData },
      { key: 'city_report', func: fetchData },
      { key: 'customer_metrics', func: fetchData },
      { key: 'service_quality', func: fetchData },
      { key: 'payment_summary', func: fetchData },
      { key: 'driver_incentives', func: fetchData },
      { key: 'operational_efficiency', func: fetchData },
      { key: 'marketing_roi', func: fetchData },
      { key: 'financials', func: fetchData }
    ];
    
    // Create an object to store all fetched data
    const data = {};
    
    // Fetch data with progress tracking
    const results = await Promise.allSettled(
      endpoints.map(endpoint => 
        endpoint.func(endpoint.key, period)
          .then(result => ({ key: endpoint.key, data: result }))
      )
    );
    
    // Process results
    results.forEach((result, index) => {
      const endpoint = endpoints[index];
      if (result.status === 'fulfilled') {
        data[endpoint.key] = result.value.data;
      } else {
        console.error(`❌ Failed to load ${endpoint.key}:`, result.reason);
        data[endpoint.key] = endpoint.key === 'daily_summary2' ? [{}] : [];
        showError(`Failed to load ${endpoint.key.replace(/_/g, ' ')} data`);
      }
    });
    
    console.log('📊 All data loaded successfully:', Object.keys(data));
    
    // Update UI components with error handling
    try {
      if (data.daily_summary && data.daily_summary[0]) {
        renderSummaryCards(data.daily_summary[0]);
      }
      
      if (data.daily_summary2) {
        renderQuickStats(data.daily_summary2);
      }
      
      // Render charts with error handling
      const renderFunctions = [
        { fn: renderRevenueRideChart, data: data.daily_summary, name: 'Revenue Chart' },
        { fn: renderDriverPerformanceChart, data: data.driver_performance, name: 'Driver Performance' },
        { fn: renderCityChart, data: data.city_report, name: 'City Report' },
        { fn: renderCustomerChart, data: data.customer_metrics, name: 'Customer Metrics' },
        { fn: renderServiceQualityChart, data: data.service_quality, name: 'Service Quality' },
        { fn: renderPaymentSummaryChart, data: data.payment_summary, name: 'Payment Summary' },
        { fn: renderDriverIncentivesChart, data: data.driver_incentives, name: 'Driver Incentives' },
        { fn: renderOperationalEfficiencyChart, data: data.operational_efficiency, name: 'Operational Efficiency' },
        { fn: renderMarketingRoiChart, data: data.marketing_roi, name: 'Marketing ROI' },
        { fn: renderFinancialsChart, data: data.financials, name: 'Financials' }
      ];
      
      renderFunctions.forEach(({ fn, data, name }) => {
        try {
          if (data && data.length > 0) {
            fn(data);
          } else {
            console.warn(`⚠️ No data available for ${name}`);
          }
        } catch (error) {
          console.error(`❌ Error rendering ${name}:`, error);
          showError(`Error rendering ${name}`);
        }
      });
      
      // Update last refreshed time
      const lastRefreshed = document.getElementById("lastRefreshed");
      if (lastRefreshed) {
        lastRefreshed.textContent = new Date().toLocaleString();
      }
      
      console.log(`✅ [${new Date().toISOString()}] Dashboard updated for: ${period}`);
      
    } catch (renderError) {
      console.error('Error rendering dashboard components:', renderError);
      showError('Error rendering dashboard components');
    }
    
  } catch (error) {
    console.error("❌ Fatal error updating dashboard:", error);
    showError('Failed to load dashboard data. Please check console for details.');
  } finally {
    document.body.style.cursor = 'default';
    if (loadingOverlay) loadingOverlay.style.display = 'none';
  }
}

// Helper function to show error messages in the UI
function showError(message) {
  console.error('Displaying error:', message);
  const errorDiv = document.createElement('div');
  errorDiv.className = 'alert alert-danger error-message m-3';
  errorDiv.role = 'alert';
  errorDiv.textContent = message;
  
  // Insert after the header or at the top of the container
  const header = document.querySelector('header');
  const container = document.querySelector('.container-fluid');
  
  if (header && header.nextSibling) {
    container.insertBefore(errorDiv, header.nextSibling);
  } else if (container) {
    container.insertBefore(errorDiv, container.firstChild);
  } else {
    document.body.insertBefore(errorDiv, document.body.firstChild);
  }
  
  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (errorDiv.parentNode) {
      errorDiv.style.opacity = '0';
      setTimeout(() => errorDiv.remove(), 500);
    }
  }, 10000);
}

// ===== RENDER FUNCTIONS =====
function renderSummaryCards(data) {
  const container = document.getElementById("summaryCards");
  if (!container) return;

  container.innerHTML = `
    <div class="col-md-3">
      <div class="card shadow-sm h-100">
        <div class="card-body">
          <h6 class="text-muted">Total Rides</h6>
          <h3 class="mb-0">${data.total_rides || 0}</h3>
        </div>
      </div>
    </div>
    <div class="col-md-3">
      <div class="card shadow-sm h-100">
        <div class="card-body">
          <h6 class="text-muted">Completed</h6>
          <h3 class="mb-0 text-success">${data.completed_rides || 0}</h3>
        </div>
      </div>
    </div>
    <div class="col-md-3">
      <div class="card shadow-sm h-100">
        <div class="card-body">
          <h6 class="text-muted">Cancelled</h6>
          <h3 class="mb-0 text-danger">${data.cancelled_rides || 0}</h3>
        </div>
      </div>
    </div>
    <div class="col-md-3">
      <div class="card shadow-sm h-100">
        <div class="card-body">
          <h6 class="text-muted">Avg. Fare</h6>
          <h3 class="mb-0">₹${data.average_fare || 0}</h3>
        </div>
      </div>
    </div>`;
}

function renderQuickStats(data) {
  console.log('Rendering quick stats with data:', data);
  const container = document.getElementById("quickStats");
  if (!container) {
    console.error('Quick stats container not found');
    return;
  }
  
  // Clear the container to remove any existing content
  container.innerHTML = '';
}

// Chart rendering functions
function renderRevenueRideChart(data) {
  const ctx = document.getElementById("revenueRideChart");
  if (!ctx) return;
  destroyChart("revenueRideChart");

  const labels = data.map(d => d.label || '');
  const rides = data.map(d => d.rides || 0);
  const revenue = data.map(d => d.revenue || 0);

  window.chartInstances["revenueRideChart"] = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        { 
          label: "Rides", 
          data: rides, 
          borderColor: "#4361ee", 
          backgroundColor: "rgba(67, 97, 238, 0.1)",
          tension: 0.3
        },
        { 
          label: "Revenue (₹)", 
          data: revenue, 
          borderColor: "#4cc9f0", 
          backgroundColor: "rgba(76, 201, 240, 0.1)",
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

function renderDriverPerformanceChart(data) {
  const ctx = document.getElementById("driverPerformanceChart");
  if (!ctx) return;
  destroyChart("driverPerformanceChart");

  const labels = data.map(d => d.driver_name || '');
  const rides = data.map(d => d.rides_completed || 0);

  window.chartInstances["driverPerformanceChart"] = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Rides Completed",
        data: rides,
        backgroundColor: "rgba(67, 97, 238, 0.7)"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

function renderCityChart(data) {
  const ctx = document.getElementById("cityWiseChart");
  if (!ctx) return;
  destroyChart("cityWiseChart");

  const labels = data.map(d => d.city || '');
  const rides = data.map(d => d.rides || 0);

  window.chartInstances["cityWiseChart"] = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data: rides,
        backgroundColor: [
          '#4361ee', '#3a0ca3', '#4cc9f0', '#4895ef', '#f72585',
          '#b5179e', '#7209b7', '#560bad', '#480ca8', '#3a0ca3'
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right' }
      }
    }
  });
}

function renderCustomerChart(data) {
  const ctx = document.getElementById("customerGrowthChart");
  if (!ctx) return;
  destroyChart("customerGrowthChart");

  const labels = data.map(d => d.label || '');
  const newCustomers = data.map(d => d.new_customers || 0);
  const returningCustomers = data.map(d => d.returning_customers || 0);

  window.chartInstances["customerGrowthChart"] = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "New Customers",
          data: newCustomers,
          borderColor: "#4cc9f0",
          backgroundColor: "rgba(76, 201, 240, 0.1)",
          tension: 0.3
        },
        {
          label: "Returning Customers",
          data: returningCustomers,
          borderColor: "#f72585",
          backgroundColor: "rgba(247, 37, 133, 0.1)",
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

function renderServiceQualityChart(data) {
  const ctx = document.getElementById("serviceQualityChart");
  if (!ctx) return;
  destroyChart("serviceQualityChart");

  const labels = data.map(d => d.reason || '');
  const counts = data.map(d => d.count || 0);

  window.chartInstances["serviceQualityChart"] = new Chart(ctx, {
    type: "pie",
    data: {
      labels,
      datasets: [{
        data: counts,
        backgroundColor: [
          '#f72585', '#b5179e', '#7209b7', '#560bad', '#480ca8',
          '#3a0ca3', '#4361ee', '#4cc9f0', '#4895ef', '#3a0ca3'
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right' }
      }
    }
  });
}

function renderPaymentSummaryChart(data) {
  const ctx = document.getElementById("paymentSummaryChart");
  if (!ctx) return;
  destroyChart("paymentSummaryChart");

  const labels = data.map(d => d.method || '');
  const amounts = data.map(d => d.amount || 0);

  window.chartInstances["paymentSummaryChart"] = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data: amounts,
        backgroundColor: [
          '#4361ee', '#4cc9f0', '#4895ef', '#f72585', '#b5179e',
          '#7209b7', '#560bad', '#480ca8', '#3a0ca3', '#3a0ca3'
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right' }
      }
    }
  });
}

function renderDriverIncentivesChart(data) {
  const ctx = document.getElementById("driverIncentivesChart");
  if (!ctx) return;
  destroyChart("driverIncentivesChart");

  const labels = data.map(d => d.driver_name || '');
  const incentives = data.map(d => d.incentives || 0);
  const payouts = data.map(d => d.payouts || 0);

  window.chartInstances["driverIncentivesChart"] = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Incentives (₹)",
          data: incentives,
          backgroundColor: "rgba(67, 97, 238, 0.7)"
        },
        {
          label: "Payouts (₹)",
          data: payouts,
          backgroundColor: "rgba(76, 201, 240, 0.7)"
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true }
      },
      plugins: {
        legend: { position: 'top' }
      }
    }
  });
}

function renderOperationalEfficiencyChart(data) {
  const ctx = document.getElementById("operationalEfficiencyChart");
  if (!ctx) return;
  destroyChart("operationalEfficiencyChart");

  const labels = data.map(d => d.metric || '');
  const current = data.map(d => d.current_value || 0);
  const target = data.map(d => d.target_value || 0);

  window.chartInstances["operationalEfficiencyChart"] = new Chart(ctx, {
    type: "radar",
    data: {
      labels,
      datasets: [
        {
          label: "Current",
          data: current,
          backgroundColor: "rgba(67, 97, 238, 0.2)",
          borderColor: "#4361ee",
          pointBackgroundColor: "#4361ee",
          pointBorderColor: "#fff",
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: "#4361ee"
        },
        {
          label: "Target",
          data: target,
          backgroundColor: "rgba(76, 201, 240, 0.2)",
          borderColor: "#4cc9f0",
          pointBackgroundColor: "#4cc9f0",
          pointBorderColor: "#fff",
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: "#4cc9f0"
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      elements: {
        line: {
          borderWidth: 3
        }
      }
    }
  });
}

function renderMarketingRoiChart(data) {
  const ctx = document.getElementById("marketingRoiChart");
  if (!ctx) return;
  destroyChart("marketingRoiChart");

  const labels = data.map(d => d.campaign || '');
  const spend = data.map(d => d.spend || 0);
  const revenue = data.map(d => d.revenue || 0);
  const roi = data.map(d => d.roi || 0);

  window.chartInstances["marketingRoiChart"] = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Spend (₹)",
          data: spend,
          backgroundColor: "rgba(247, 37, 133, 0.7)"
        },
        {
          label: "Revenue (₹)",
          data: revenue,
          backgroundColor: "rgba(76, 201, 240, 0.7)"
        },
        {
          label: "ROI (%)",
          data: roi,
          type: 'line',
          borderColor: "#4361ee",
          backgroundColor: "transparent",
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: 'Amount (₹)'
          }
        },
        y1: {
          beginAtZero: true,
          type: 'linear',
          display: true,
          position: 'right',
          grid: {
            drawOnChartArea: false
          },
          title: {
            display: true,
            text: 'ROI (%)'
          }
        }
      },
      plugins: {
        legend: { position: 'top' }
      }
    }
  });
}

function renderFinancialsChart(data) {
  const ctx = document.getElementById("financialsChart");
  if (!ctx) return;
  destroyChart("financialsChart");

  const labels = data.map(d => d.label || '');
  const revenue = data.map(d => d.revenue || 0);
  const costs = data.map(d => d.costs || 0);
  const profit = data.map(d => d.profit || 0);

  window.chartInstances["financialsChart"] = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Revenue (₹)",
          data: revenue,
          backgroundColor: "rgba(67, 97, 238, 0.7)"
        },
        {
          label: "Costs (₹)",
          data: costs,
          backgroundColor: "rgba(247, 37, 133, 0.7)"
        },
        {
          label: "Profit (₹)",
          data: profit,
          backgroundColor: "rgba(46, 213, 115, 0.7)"
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true }
      },
      plugins: {
        legend: { position: 'top' }
      }
    }
  });
}

// Helper function to destroy existing charts
function destroyChart(id) {
  if (window.chartInstances[id]) {
    window.chartInstances[id].destroy();
    delete window.chartInstances[id];
  }
}