document.getElementById('sign-in-button').addEventListener('click', () => {
  window.api.send('open-auth-window', '');
});