'use strict';

const form = document.querySelector('#login-form');
const password = document.querySelector('#password');
const toggle = document.querySelector('#toggle-password');

toggle.addEventListener('click', () => {
  const visible = password.type === 'password';
  password.type = visible ? 'text' : 'password';
  toggle.textContent = visible ? 'Ocultar' : 'Mostrar';
  toggle.setAttribute('aria-pressed', String(visible));
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  // This is a UI demonstration, not an authentication boundary.
  form.reset();
  password.type = 'password';
  toggle.textContent = 'Mostrar';
  toggle.setAttribute('aria-pressed', 'false');
  form.querySelector('[type="submit"]').disabled = true;
  document.querySelector('#login-status').textContent = 'Abrindo a fazenda de demonstração…';
  window.location.assign('/');
});

window.addEventListener('pageshow', () => {
  form.querySelector('[type="submit"]').disabled = false;
  document.querySelector('#login-status').textContent = '';
});
