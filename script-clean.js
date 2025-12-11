// ======================================================
// 📊 DASHBOARD SCRIPT — COMPLETE 10 REPORTS
// ======================================================
const API_BASE_URL = "http://localhost:5000";
let currentPeriod = "today";
window.chartInstances = {};

// ===== FETCH DATA FROM API =====
async function fetchData(table, period) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/${table}/${period}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`❌ Error fetching ${table}:`, err);
    return [];
  }
}

// ===== UPDATE DASHBOARD =====
async function updateDashboardData(period) {
  currentPeriod = period;
  console.log(`🔄 Fetching dashboard data for: ${period}`);

  try {
    // Show loading state
    document.body.style.cursor = 'wait';
    document.getElementById('loadingOverlay').style.display = 'flex';
    
    // First, fetch the daily_summary2 data separately
    const [dailySummary2] = await Promise.all([
      fetchData("daily_summary2", period).then(data => {
        console.log('Fetched dailySummary2 data:', data);
        return data;
      }).catch(err => {
        console.error('Error fetching daily_summary2:', err);
        return [{}]; // Return empty object in array on error
      })
    ]);
    
    // Then fetch all other data in parallel
    const [
      daily_summary2,
      dailySummary,
      driverPerformance,
      cityReport,
      customerMetrics,
      serviceQuality,
      paymentSummary,
      driverIncentives,
      operationalEfficiency,
      marketingRoi,
      financials
    ] = await Promise.all([
      fetchData("daily_summary2", period),
      fetchData("daily_summary", period),
      fetchData("driver_performance", period),
      fetchData("city_report", period),
      fetchData("customer_metrics", period),
      fetchData("service_quality", period),
      fetchData("payment_summary", period),
      fetchData("driver_incentives", period),
      fetchData("operational_efficiency", period),
      fetchData("marketing_roi", period),
      fetchData("financials", period)
    ]);

    // Update UI components
    renderQuickStats(dailySummary2);
    renderRevenueRideChart(dailySummary);
    renderDriverPerformanceChart(driverPerformance);
    renderCityChart(cityReport);
    renderCustomerChart(customerMetrics);
    renderServiceQualityChart(serviceQuality);
    renderPaymentSummaryChart(paymentSummary);
    renderDriverIncentivesChart(driverIncentives);
    renderOperationalEfficiencyChart(operationalEfficiency);
    renderMarketingRoiChart(marketingRoi);
    renderFinancialsChart(financials);

    // Update last refreshed time
    document.getElementById("lastRefreshed").textContent = new Date().toLocaleString();
    console.log(`✅ Dashboard updated for: ${period}`);
  } catch (error) {
    console.error("Error updating dashboard:", error);
    alert("Failed to load dashboard data. Please try again.");
  } finally {
    document.body.style.cursor = 'default';
    document.getElementById('loadingOverlay').style.display = 'none';
  }
}

// ===== RENDER FUNCTIONS =====

async function renderQuickStats(dailySummary2Data) {
  console.log('renderQuickStats called with data:', dailySummary2Data);
  const container = document.getElementById("quickStats");
  if (!container) {
    console.error('quickStats container not found');
    return;
  }

  try {
    // Show loading state if no data is provided
    if (!dailySummary2Data || !dailySummary2Data.length) {
      console.log('No data provided to renderQuickStats, showing loading state');
      container.innerHTML = `
        <div class="col-12 text-center">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>`;
      return;
    }

    // Get the first record (it's already an array with one item from the API)
    const summary = Array.isArray(dailySummary2Data) ? dailySummary2Data[0] : dailySummary2Data;
    
    // Extract the rates (they should be pre-calculated in the database)
    const completionRate = parseFloat(summary.completion_rate || 0).toFixed(1);
    const cancellationRate = parseFloat(summary.cancellation_rate || 0).toFixed(1);

    // Create the HTML with the rates
    container.innerHTML = `
      <div class="row g-3">
        <div class="col-md-6">
          <div class="card bg-success text-white h-100">
            <div class="card-body text-center">
              <h6 class="card-title">Completion Rate</h6>
              <h2 class="mb-0">${completionRate}%</h2>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card bg-warning text-dark h-100">
            <div class="card-body text-center">
              <h6 class="card-title">Cancellation Rate</h6>
              <h2 class="mb-0">${cancellationRate}%</h2>
            </div>
          </div>
        </div>
      </div>`;
  } catch (error) {
    console.error('Error fetching quick stats:', error);
    container.innerHTML = `
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        Error loading rates. Please try again later.
      </div>`;
  }
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

// ... [Keep all other existing chart rendering functions as they are] ...

// Helper function to destroy existing charts
function destroyChart(id) {
  if (window.chartInstances[id]) {
    window.chartInstances[id].destroy();
    delete window.chartInstances[id];
  }
}

// Initialize dashboard when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Set initial period to 'today'
    updateDashboardData('today');
    
    // Add event listeners for period selector buttons
    document.querySelectorAll('.time-btn').forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            document.querySelectorAll('.time-btn').forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            // Update dashboard with selected period
            updateDashboardData(this.dataset.period);
        });
    });
});
