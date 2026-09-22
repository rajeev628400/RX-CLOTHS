(function () {
  'use strict';

  var supabaseUrl = window.RXCLOTHS_SUPABASE_URL;
  var supabaseAnonKey = window.RXCLOTHS_SUPABASE_ANON_KEY;
  var supabaseClient;

  function configured() {
    return supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('PASTE_') && !supabaseAnonKey.includes('PASTE_');
  }

  function showError(message) {
    window.alert(message);
  }

  async function signUp(form) {
    if (!configured()) {
      showError('Add your Supabase URL and anon key in supabase-config.js first.');
      return;
    }

    var password = form.elements.password.value;
    if (password !== form.elements['confirm-password'].value) {
      showError('Passwords do not match.');
      return;
    }

    var result = await supabaseClient.auth.signUp({
      email: form.elements.email.value.trim().toLowerCase(),
      password: password,
      options: { data: { full_name: form.elements.name.value.trim() } }
    });

    if (result.error) {
      showError(result.error.message);
      return;
    }

    showError('Account created. Check your email, then sign in.');
    window.location.href = 'login.html';
  }

  async function signIn(form) {
    if (!configured()) {
      showError('Add your Supabase URL and anon key in supabase-config.js first.');
      return;
    }

    var result = await supabaseClient.auth.signInWithPassword({
      email: form.elements.email.value.trim().toLowerCase(),
      password: form.elements.password.value
    });

    if (result.error) {
      showError(result.error.message);
      return;
    }

    window.location.href = 'INDEX.HTML';
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (configured()) {
      supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
    }

    var signupForm = document.querySelector('form[action="supabase-signup"]');
    var loginForm = document.querySelector('form[action="supabase-login"]');

    if (signupForm) {
      signupForm.addEventListener('submit', function (event) {
        event.preventDefault();
        signUp(signupForm);
      });
    }

    if (loginForm) {
      loginForm.addEventListener('submit', function (event) {
        event.preventDefault();
        signIn(loginForm);
      });
    }
  });
}());
