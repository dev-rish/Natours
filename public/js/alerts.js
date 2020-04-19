/* eslint-disable */
export const hideAlert = () => {
  const el = document.querySelector('.alert');
  if (el) el.parentElement.removeChild(el);
};

export const showAlert = (type, msg) => {
  // Hide existing alert if any
  hideAlert();
  const markup = `<div class="alert alert--${type}">${msg}</div>`;
  // Inside body, at the beginning
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
  // Hide alert after 5000ms
  window.setTimeout(hideAlert, 5000);
};