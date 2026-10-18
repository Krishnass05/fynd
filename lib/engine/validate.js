'use strict';
// Validation for sign-up and log-in. The SAME rules run in the browser (to show messages as you type) and on the server
// (which is the one that counts). Each function returns an error message, or '' when the value is fine.
// Plain JavaScript, no dependencies, tested.

const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password123', '12345678', '123456789', '1234567890', 'qwerty123', 'qwertyuiop', 'iloveyou1',
  'admin123', 'welcome1', 'welcome123', 'letmein123', 'abc12345', 'abcd1234', 'passw0rd', 'p@ssw0rd', 'demo1234', 'test1234',
]);

const MAX_EMAIL = 254;
// Practical check: something@something.tld with no spaces. Real proof an address works comes from the verification email.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function normalizeEmail(v) {
  return String(v == null ? '' : v).trim().toLowerCase();
}

function validateEmail(v) {
  const e = normalizeEmail(v);
  if (!e) return 'Enter your email address';
  if (e.length > MAX_EMAIL) return 'That email address is too long';
  if (!EMAIL.test(e) || e.includes('..') || e.startsWith('.') || e.split('@').length !== 2) return 'That does not look like an email address';
  return '';
}

function validateName(v) {
  const n = String(v == null ? '' : v).trim().replace(/\s+/g, ' ');
  if (!n) return 'Enter your name';
  if (n.length < 2) return 'Your name must have at least 2 letters';
  if (n.length > 80) return 'Your name must be 80 characters or fewer';
  if (!/^[\p{L}][\p{L}\p{M} .'-]*$/u.test(n)) return 'Use letters, spaces, dots, apostrophes and hyphens only';
  return '';
}

// Rules: 8 to 72 characters, at least one letter and one number, not your email or name, not a common password.
function validatePassword(v, ctx) {
  const p = String(v == null ? '' : v);
  if (!p) return 'Enter a password';
  if (p.length < 8) return 'Use at least 8 characters';
  if (p.length > 72) return 'Use 72 characters or fewer';
  if (/\s/.test(p) && p.trim() !== p) return 'The password cannot start or end with a space';
  if (!/[A-Za-z]/.test(p)) return 'Add at least one letter';
  if (!/\d/.test(p)) return 'Add at least one number';
  if (COMMON_PASSWORDS.has(p.toLowerCase())) return 'That password is too common. Choose another';
  const c = ctx || {};
  const email = normalizeEmail(c.email);
  if (email && (p.toLowerCase() === email || (email.includes('@') && p.toLowerCase() === email.split('@')[0] && p.length < 12))) return 'The password cannot be your email';
  const name = String(c.name || '').trim().toLowerCase();
  if (name.length >= 4 && p.toLowerCase().includes(name.replace(/\s+/g, ''))) return 'The password cannot contain your name';
  return '';
}

// How strong a password looks, for the meter on the sign-up page: 0 (empty) to 4.
function passwordStrength(v) {
  const p = String(v == null ? '' : v);
  if (!p) return 0;
  let s = 0;
  if (p.length >= 8) s += 1;
  if (p.length >= 12) s += 1;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s += 1;
  if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) s += 1;
  if (COMMON_PASSWORDS.has(p.toLowerCase())) return 1;
  return Math.max(1, Math.min(4, s));
}

const ACCOUNT_TYPES = ['client', 'freelancer', 'both'];

// The whole sign-up form. Returns { errors: { field: message }, values: cleaned values }.
function validateRegister(input) {
  const i = input || {};
  const errors = {};
  const email = normalizeEmail(i.email);
  const name = String(i.name == null ? '' : i.name).trim().replace(/\s+/g, ' ');
  const set = (k, msg) => { if (msg) errors[k] = msg; };
  set('name', validateName(name));
  set('email', validateEmail(email));
  set('password', validatePassword(i.password, { email, name }));
  if (!errors.password && String(i.password) !== String(i.confirmPassword == null ? '' : i.confirmPassword)) errors.confirmPassword = 'The two passwords do not match';
  else if (!i.confirmPassword && !errors.password) errors.confirmPassword = 'Type the password again';
  if (!ACCOUNT_TYPES.includes(i.accountType)) errors.accountType = 'Choose how you will use the site';
  if (i.acceptedTerms !== true) errors.acceptedTerms = 'Please accept the terms to create an account';
  return { errors, values: { name, email, accountType: i.accountType, password: String(i.password == null ? '' : i.password) } };
}

// The log-in form. Only checks that the fields are filled in properly: whether they are right is the server's call.
function validateLogin(input) {
  const i = input || {};
  const errors = {};
  const email = normalizeEmail(i.email);
  const emailErr = validateEmail(email);
  if (emailErr) errors.email = emailErr;
  if (!i.password) errors.password = 'Enter your password';
  else if (String(i.password).length > 72) errors.password = 'That password is too long';
  if (i.role !== 'client' && i.role !== 'freelancer') errors.role = 'Choose Client or Freelancer';
  return { errors, values: { email, password: String(i.password == null ? '' : i.password), role: i.role } };
}

module.exports = { normalizeEmail, validateEmail, validateName, validatePassword, passwordStrength, validateRegister, validateLogin, ACCOUNT_TYPES };
