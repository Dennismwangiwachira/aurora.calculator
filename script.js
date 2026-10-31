// Premium Calculator - core logic (no eval)
// ---------------------------------------------------
// UI element references
// ---------------------------------------------------
const display = document.getElementById('display');
const copyBtn = document.getElementById('copy-result');
const themeToggle = document.getElementById('theme-toggle');
const historyToggle = document.getElementById('history-toggle');
const historyPanel = document.getElementById('history-panel');
const historyList = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clear-history');

// ---------------------------------------------------
// State variables
// ---------------------------------------------------
let currentInput = '';
let previousValue = null; // first operand
let operator = null; // '+', '-', '*', '/'
let resetDisplay = false; // after operator press
let memory = 0; // simple memory register
let history = [];

// ---------------------------------------------------
// Theme handling (light / dark)
// ---------------------------------------------------
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('calc-theme', theme);
    themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
}
const savedTheme = localStorage.getItem('calc-theme') || 'light';
setTheme(savedTheme);

themeToggle.addEventListener('click', () => {
    const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
});

// ---------------------------------------------------
// Helper UI functions
// ---------------------------------------------------
function updateDisplay() {
    display.value = currentInput || '0';
}

function addToHistory(expr, result) {
    // Avoid duplicate consecutive entries
    if (history.length && history[history.length - 1].expr === expr && history[history.length - 1].result === result) return;
    history.push({ expr, result });
    const li = document.createElement('li');
    li.textContent = `${expr} = ${result}`;
    li.addEventListener('click', () => {
        // Load the result back into calculator when user selects a history line
        currentInput = result.toString();
        previousValue = null;
        operator = null;
        resetDisplay = false;
        updateDisplay();
    });
    historyList.appendChild(li);
}

function toggleHistoryPanel() {
    historyPanel.classList.toggle('show');
}

historyToggle.addEventListener('click', toggleHistoryPanel);
clearHistoryBtn.addEventListener('click', () => {
    history = [];
    historyList.innerHTML = '';
    historyPanel.classList.remove('show');
});

copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(display.value).catch(() => {});
});

// ---------------------------------------------------
// Core calculator functions (with bug‑fixes)
// ---------------------------------------------------
function appendNumber(num) {
    if (resetDisplay) {
        currentInput = '';
        resetDisplay = false;
    }
    // Prevent multiple leading zeros (except "0.")
    if (currentInput === '0' && num !== '.') {
        currentInput = '';
    }
    // Allow only a single decimal point
    if (num === '.' && currentInput.includes('.')) return;
    currentInput += num;
    updateDisplay();
}

function chooseOperator(op) {
    // No operand yet – ignore
    if (currentInput === '' && previousValue === null) return;
    // If we are waiting for the second operand and user presses another operator,
    // simply replace the pending operator.
    if (resetDisplay && operator) {
        operator = op;
        return;
    }
    // If we already have a stored value and a new number, compute first.
    if (previousValue !== null && currentInput !== '') {
        compute();
    } else if (currentInput !== '') {
        previousValue = parseFloat(currentInput);
    }
    operator = op;
    resetDisplay = true;
}

function compute() {
    const current = parseFloat(currentInput);
    if (!operator || previousValue === null || isNaN(current)) return;
    const expr = `${previousValue}${operator}${current}`;
    let result;
    switch (operator) {
        case '+': result = previousValue + current; break;
        case '-': result = previousValue - current; break;
        case '*': result = previousValue * current; break;
        case '/':
            if (current === 0) {
                result = 'Error';
            } else {
                result = previousValue / current;
            }
            break;
        default: result = current;
    }
    // Guard against Infinity / NaN
    if (typeof result === 'number' && !Number.isFinite(result)) {
        result = 'Error';
    }
    currentInput = result.toString();
    previousValue = null;
    operator = null;
    updateDisplay();
    if (result !== 'Error') addToHistory(expr, result);
}

function clearAll() {
    currentInput = '';
    previousValue = null;
    operator = null;
    resetDisplay = false;
    updateDisplay();
}

function deleteLast() {
    if (resetDisplay) return;
    currentInput = currentInput.slice(0, -1);
    updateDisplay();
}

function toggleSign() {
    if (currentInput.startsWith('-')) {
        currentInput = currentInput.slice(1);
    } else if (currentInput !== '' && currentInput !== '0') {
        currentInput = '-' + currentInput;
    }
    updateDisplay();
}

function percentage() {
    if (currentInput === '') return;
    const value = parseFloat(currentInput) / 100;
    currentInput = value.toString();
    updateDisplay();
}

// ---------------------------------------------------
// Memory functions (MC, MR, M+, M-)
// ---------------------------------------------------
function memoryClear() { memory = 0; }
function memoryRecall() {
    currentInput = memory.toString();
    resetDisplay = false;
    updateDisplay();
}
function memoryAdd() {
    const val = parseFloat(currentInput) || 0;
    memory += val;
}
function memorySubtract() {
    const val = parseFloat(currentInput) || 0;
    memory -= val;
}

// ---------------------------------------------------
// Event handling (buttons + keyboard)
// ---------------------------------------------------
function handleButtonClick(e) {
    const action = e.target.dataset.action;
    if (!action) return;
    if (!isNaN(action) || action === '.') {
        appendNumber(action);
    } else if (['+', '-', '*', '/'].includes(action)) {
        chooseOperator(action);
    } else if (action === '=') {
        compute();
    } else if (action === 'clear') {
        clearAll();
    } else if (action === 'delete') {
        deleteLast();
    } else if (action === '+/-') {
        toggleSign();
    } else if (action === '%') {
        percentage();
    } else if (action === 'memory-clear') {
        memoryClear();
    } else if (action === 'memory-recall') {
        memoryRecall();
    } else if (action === 'memory-add') {
        memoryAdd();
    } else if (action === 'memory-subtract') {
        memorySubtract();
    }
}

function handleKey(e) {
    const key = e.key;
    if (!isNaN(key) || key === '.') {
        appendNumber(key);
    } else if (['+', '-', '*', '/'].includes(key)) {
        chooseOperator(key);
    } else if (key === 'Enter' || key === '=') {
        compute();
    } else if (key === 'Backspace') {
        deleteLast();
    } else if (key === 'Escape') {
        clearAll();
    } else if (key.toLowerCase() === 'c') {
        clearAll();
    } else if (key.toLowerCase() === 'm') {
        // Shortcut for memory recall
        memoryRecall();
    }
}

document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', handleButtonClick);
});

document.addEventListener('keydown', handleKey);

// Initialise display on first load
updateDisplay();