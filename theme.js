// Check for saved user preference, if any, on load
document.addEventListener('DOMContentLoaded', function() {
  const themeToggle = document.getElementById('themeToggle');
  const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
  const currentTheme = localStorage.getItem('theme') || (prefersDarkScheme.matches ? 'dark' : 'light');
  
  // Apply the current theme
  document.documentElement.setAttribute('data-bs-theme', currentTheme);
  
  // Update the toggle button state
  if (themeToggle) {
    themeToggle.checked = currentTheme === 'dark';
  }
  
  // Add event listener for theme toggle
  if (themeToggle) {
    themeToggle.addEventListener('change', function() {
      const newTheme = this.checked ? 'dark' : 'light';
      document.documentElement.setAttribute('data-bs-theme', newTheme);
      localStorage.setItem('theme', newTheme);
    });
  }
});