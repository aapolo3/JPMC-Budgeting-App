// ---- Firebase (ES module, no-auth dev setup) ----
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import {
    getDatabase, ref, set, push, update, onValue, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js";

const incomeInput = document.getElementById('income');
    const calculateBtn = document.getElementById('calculate');
    const billForm = document.getElementById('bill-form');
    const goalForm = document.getElementById('goal-form');
    const netAfterBillsEl = document.getElementById('net-after-bills');
    const plannedSavingsEl = document.getElementById('planned-savings');
    const leewayEl = document.getElementById('leeway');
    const adviceEl = document.getElementById('advice');

    // Validate and sanitize number inputs
    function sanitizeNumberInput(input) {
      // Remove non-numeric characters except decimal point and minus sign
      let value = input.value.replace(/[^0-9.-]/g, '');
      
      // Ensure only one decimal point
      const parts = value.split('.');
      if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
      }
      
      input.value = value;
    }

    // Validate number on blur (when user leaves the field)
    function validateNumberOnBlur(input) {
      let value = parseFloat(input.value);
      
      // If negative or NaN, set to 0
      if (isNaN(value) || value < 0) {
        input.value = '0';
      } else {
        // Format to 2 decimal places
        input.value = value.toFixed(2);
      }
    }

    // Add input validation to income field
    incomeInput.addEventListener('input', function() {
      sanitizeNumberInput(this);
    });

    incomeInput.addEventListener('blur', function() {
      validateNumberOnBlur(this);
    });

    // Function to add input validation to dynamically added fields
    function addValidationToNumberInputs(container) {
      const numberInputs = container.querySelectorAll('input[type="number"]');
      
      numberInputs.forEach(input => {
        input.addEventListener('input', function() {
          sanitizeNumberInput(this);
        });
        
        input.addEventListener('blur', function() {
          validateNumberOnBlur(this);
        });
      });
    }

    // Initialize validation for existing inputs
    addValidationToNumberInputs(document);

    // Calculate monthly income based on frequency
    function getMonthlyIncome() {
      const income = parseFloat(incomeInput.value) || 0;
      const frequency = document.querySelector('input[name="frequency"]:checked').value;
      
      let monthlyIncome = 0;
      
      switch(frequency) {
        case 'weekly':
          monthlyIncome = income * 52 / 12; // 52 weeks per year / 12 months
          break;
        case 'biweekly':
          monthlyIncome = income * 26 / 12; // 26 biweekly periods per year / 12 months
          break;
        case 'monthly':
          monthlyIncome = income;
          break;
      }
      
      return monthlyIncome;
    }

    // Calculate total bills
    function getTotalBills() {
      const billRows = billForm.querySelectorAll('.entry-row');
      let total = 0;
      
      billRows.forEach(row => {
        const amountInput = row.querySelector('input[type="number"]');
        if (amountInput) {
          const amount = parseFloat(amountInput.value) || 0;
          total += Math.max(0, amount); // Ensure no negative values
        }
      });
      
      return total;
    }

    // Calculate total goals (planned savings)
    function getTotalGoals() {
      const goalRows = goalForm.querySelectorAll('.entry-row');
      let total = 0;
      
      goalRows.forEach(row => {
        const amountInput = row.querySelector('input[type="number"]');
        if (amountInput) {
          const amount = parseFloat(amountInput.value) || 0;
          total += Math.max(0, amount); // Ensure no negative values
        }
      });
      
      return total;
    }

    // Update summary calculations
    function updateSummary() {
      const monthlyIncome = getMonthlyIncome();
      const totalBills = getTotalBills();
      const totalGoals = getTotalGoals();
      
      const netAfterBills = monthlyIncome - totalBills;
      const leeway = netAfterBills - totalGoals;
      
      // Update display
      netAfterBillsEl.textContent = `$${netAfterBills.toFixed(2)}`;
      plannedSavingsEl.textContent = `$${totalGoals.toFixed(2)}`;
      leewayEl.textContent = `$${leeway.toFixed(2)}`;
      
      // Update advice
      if (monthlyIncome === 0) {
        adviceEl.textContent = 'Enter your info to see if you have room to save or need to trim entertainment.';
      } else if (leeway > 0) {
        adviceEl.textContent = `Great! You have $${leeway.toFixed(2)} left over each month for entertainment, additional savings, or unexpected expenses.`;
      } else if (leeway === 0) {
        adviceEl.textContent = 'Your budget is perfectly balanced. Consider building an emergency fund if you haven\'t already.';
      } else {
        adviceEl.textContent = `You're over budget by $${Math.abs(leeway).toFixed(2)}. Consider reducing expenses or adjusting your goals.`;
      }
    }

    // Calculate button click handler
    calculateBtn.addEventListener('click', updateSummary);

    // Add new bill row
    function addBillRow() {
      const template = billForm.querySelector('.entry-row').cloneNode(true);
      
      // Reset values
      template.querySelectorAll('input, select').forEach(input => {
        input.value = '';
        if (input.tagName === 'SELECT') {
          input.selectedIndex = 0;
        }
      });
      
      billForm.appendChild(template);
      addValidationToNumberInputs(template);
      setupRowButtons(template);
    }

    // Add new goal row
    function addGoalRow() {
      const template = goalForm.querySelector('.entry-row').cloneNode(true);
      
      // Reset values
      template.querySelectorAll('input, select').forEach(input => {
        input.value = '';
        if (input.tagName === 'SELECT') {
          input.selectedIndex = 0;
        }
      });
      
      goalForm.appendChild(template);
      addValidationToNumberInputs(template);
      setupRowButtons(template);
    }

    // Setup add/remove buttons for a row
    function setupRowButtons(row) {
      const addBtn = row.querySelector('.add-line');
      const removeBtn = row.querySelector('.remove-line');
      const parentForm = row.closest('form');
      
      if (addBtn) {
        addBtn.addEventListener('click', function() {
          if (parentForm.id === 'bill-form') {
            addBillRow();
          } else {
            addGoalRow();
          }
        });
      }
      
      if (removeBtn) {
        removeBtn.addEventListener('click', function() {
          const rows = parentForm.querySelectorAll('.entry-row');
          if (rows.length > 1) {
            row.remove();
            updateSummary();
          }
        });
      }
    }

    // Initialize buttons for existing rows
    document.querySelectorAll('.entry-row').forEach(row => {
      setupRowButtons(row);
    });

    // Auto-calculate on input changes
    document.addEventListener('input', function(e) {
      if (e.target.matches('#income, input[type="number"]')) {
        updateSummary();
      }
    });

    // Auto-calculate on frequency change
    document.querySelectorAll('input[name="frequency"]').forEach(radio => {
      radio.addEventListener('change', updateSummary);
    });

    // Initial calculation
    updateSummary();