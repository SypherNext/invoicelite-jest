// Loaded before every test file (setupFilesAfterEnv in jest.config.js).
// DOM matchers such as toBeInTheDocument() and toHaveTextContent():
import '@testing-library/jest-dom/jest-globals';
// InvoiceLite's own matchers, such as toBeMoney():
import './money-matchers';
