(function () {
  'use strict';

  let supabaseClient = null;

  // --------------------------------------------------
  // Supabase configuration
  // --------------------------------------------------

  const supabaseUrl = window.RXCLOTHS_SUPABASE_URL;
  const supabaseAnonKey = window.RXCLOTHS_SUPABASE_ANON_KEY;

  function isConfigured() {
    return (
      typeof supabaseUrl === 'string' &&
      typeof supabaseAnonKey === 'string' &&
      supabaseUrl.trim() !== '' &&
      supabaseAnonKey.trim() !== '' &&
      !supabaseUrl.includes('PASTE_') &&
      !supabaseAnonKey.includes('PASTE_')
    );
  }

  function showMessage(message) {
    window.alert(message);
  }

  function getErrorMessage(error) {
    if (!error) {
      return 'Something went wrong. Please try again.';
    }

    console.error('Supabase error:', error);

    return (
      error.message ||
      error.error_description ||
      'Something went wrong. Please try again.'
    );
  }

  // --------------------------------------------------
  // Initialize Supabase
  // --------------------------------------------------

  function initializeSupabase() {
    if (!isConfigured()) {
      console.error(
        'Supabase is not configured. Check supabase-config.js'
      );
      return false;
    }

    if (
      !window.supabase ||
      typeof window.supabase.createClient !== 'function'
    ) {
      console.error(
        'Supabase JavaScript library was not loaded.'
      );

      showMessage(
        'Supabase library is not loaded. Please check your HTML file.'
      );

      return false;
    }

    try {
      supabaseClient = window.supabase.createClient(
        supabaseUrl,
        supabaseAnonKey
      );

      return true;
    } catch (error) {
      console.error(
        'Supabase initialization error:',
        error
      );

      showMessage(
        'Unable to connect to Supabase. Please check your configuration.'
      );

      return false;
    }
  }

  // --------------------------------------------------
  // SIGN UP
  // --------------------------------------------------

  async function signUp(form) {
    if (!supabaseClient) {
      showMessage(
        'Supabase is not connected. Please check supabase-config.js.'
      );
      return;
    }

    const name = form.elements.name
      ? form.elements.name.value.trim()
      : '';

    const email = form.elements.email
      ? form.elements.email.value.trim().toLowerCase()
      : '';

    const password = form.elements.password
      ? form.elements.password.value
      : '';

    const confirmPassword = form.elements['confirm-password']
      ? form.elements['confirm-password'].value
      : '';

    // Basic validation
    if (!name) {
      showMessage('Please enter your full name.');
      return;
    }

    if (!email) {
      showMessage('Please enter your email address.');
      return;
    }

    if (!password) {
      showMessage('Please enter a password.');
      return;
    }

    if (password.length < 6) {
      showMessage(
        'Password must contain at least 6 characters.'
      );
      return;
    }

    if (password !== confirmPassword) {
      showMessage('Passwords do not match.');
      return;
    }

    // Disable submit button while request is running
    const submitButton = form.querySelector(
      'button[type="submit"], input[type="submit"]'
    );

    if (submitButton) {
      submitButton.disabled = true;
    }

    try {
      console.log('Creating Supabase account...');

      const { data, error } =
        await supabaseClient.auth.signUp({
          email: email,
          password: password,

          options: {
            data: {
              full_name: name
            }
          }
        });

      if (error) {
        console.error(
          'Supabase signup error:',
          error
        );

        showMessage(
          'Signup failed:\n\n' +
          getErrorMessage(error)
        );

        return;
      }

      console.log(
        'Supabase signup response:',
        data
      );

      // Email confirmation enabled
      if (data.user && !data.session) {
        showMessage(
          'Account created successfully!\n\n' +
          'Please check your email and confirm your account before logging in.'
        );

        window.location.href = 'login.html';
        return;
      }

      // Email confirmation disabled
      if (data.user && data.session) {
        showMessage(
          'Account created successfully!'
        );

        window.location.href = 'index.html';
        return;
      }

      showMessage(
        'Account created. Please check your email.'
      );

      window.location.href = 'login.html';

    } catch (error) {
      console.error(
        'Unexpected signup error:',
        error
      );

      showMessage(
        'Unexpected error:\n\n' +
        getErrorMessage(error)
      );

    } finally {
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  }

  // --------------------------------------------------
  // SIGN IN
  // --------------------------------------------------

  async function signIn(form) {
    if (!supabaseClient) {
      showMessage(
        'Supabase is not connected. Please check supabase-config.js.'
      );
      return;
    }

    const email = form.elements.email
      ? form.elements.email.value.trim().toLowerCase()
      : '';

    const password = form.elements.password
      ? form.elements.password.value
      : '';

    if (!email) {
      showMessage(
        'Please enter your email address.'
      );
      return;
    }

    if (!password) {
      showMessage(
        'Please enter your password.'
      );
      return;
    }

    const submitButton = form.querySelector(
      'button[type="submit"], input[type="submit"]'
    );

    if (submitButton) {
      submitButton.disabled = true;
    }

    try {
      console.log('Signing in...');

      const { data, error } =
        await supabaseClient.auth.signInWithPassword({
          email: email,
          password: password
        });

      if (error) {
        console.error(
          'Supabase login error:',
          error
        );

        showMessage(
          'Login failed:\n\n' +
          getErrorMessage(error)
        );

        return;
      }

      console.log(
        'Login successful:',
        data
      );

      // IMPORTANT:
      // If you rename INDEX.HTML to index.html,
      // keep this as index.html.
      window.location.href = 'index.html';

    } catch (error) {
      console.error(
        'Unexpected login error:',
        error
      );

      showMessage(
        'Unexpected error:\n\n' +
        getErrorMessage(error)
      );

    } finally {
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  }

  async function updateAccountUI() {
    if (!supabaseClient) {
      return;
    }

    const { data, error } = await supabaseClient.auth.getSession();

    if (error) {
      console.error('Unable to load the current session:', error);
      return;
    }

    const user = data.session ? data.session.user : null;
    const accountLink = document.querySelector('.header .account');

    if (!user) {
      return;
    }

    renderAccountPage(user);
  }

  function renderAccountPage(user) {
    const accountView = document.querySelector('[data-account-view]');

    if (!accountView) {
      return;
    }

    const loginForm = document.querySelector('form[action="supabase-login"]');
    const loginSignup = document.querySelector('.login-signup');
    const loginTitle = document.querySelector('#login-title');
    const loginIntro = document.querySelector('.login-intro');
    const fullName = user.user_metadata && user.user_metadata.full_name;
    const profileValues = {
      name: fullName || '',
      email: user.email || '',
      age: user.user_metadata && user.user_metadata.age || '',
      gender: user.user_metadata && user.user_metadata.gender || '',
      phone: user.user_metadata && user.user_metadata.phone || '',
      address: user.user_metadata && user.user_metadata.address || ''
    };

    if (loginForm) {
      loginForm.hidden = true;
    }

    if (loginSignup) {
      loginSignup.hidden = true;
    }

    if (loginTitle) {
      loginTitle.innerHTML = 'Your<br><em>Account.</em>';
    }

    if (loginIntro) {
      loginIntro.textContent = `Welcome back, ${profileValues.name || user.email}. Update your details below.`;
    }

    accountView.hidden = false;

    accountView.querySelectorAll('[data-profile-field]').forEach(function (field) {
      const fieldName = field.getAttribute('data-profile-field');
      field.value = profileValues[fieldName] || '';
    });

    const editButton = accountView.querySelector('[data-edit-profile]');
    const saveButton = accountView.querySelector('[data-save-profile]');
    const logoutButton = accountView.querySelector('[data-logout]');

    if (editButton) {
      editButton.addEventListener('click', function () {
        accountView.querySelectorAll('[data-profile-field]:not([data-email-field])').forEach(function (field) {
          field.disabled = false;
        });
        editButton.hidden = true;
        saveButton.hidden = false;
      });
    }

    if (saveButton) {
      saveButton.addEventListener('click', async function () {
        saveButton.disabled = true;

        const profileData = {};
        accountView.querySelectorAll('[data-profile-field]:not([data-email-field])').forEach(function (field) {
          profileData[field.getAttribute('data-profile-field')] = field.value.trim();
        });

        const { error } = await supabaseClient.auth.updateUser({
          data: {
            full_name: profileData.name,
            age: profileData.age,
            gender: profileData.gender,
            phone: profileData.phone,
            address: profileData.address
          }
        });

        saveButton.disabled = false;

        if (error) {
          showMessage('Profile update failed:\n\n' + getErrorMessage(error));
          return;
        }

        accountView.querySelectorAll('[data-profile-field]:not([data-email-field])').forEach(function (field) {
          field.disabled = true;
        });
        saveButton.hidden = true;
        editButton.hidden = false;
        showMessage('Your profile has been updated.');
      });
    }

    if (logoutButton) {
      logoutButton.addEventListener('click', async function () {
        const { error } = await supabaseClient.auth.signOut();

        if (error) {
          showMessage('Logout failed:\n\n' + getErrorMessage(error));
          return;
        }

        window.location.href = 'login.html';
      });
    }
  }

  // --------------------------------------------------
  // PAGE LOAD
  // --------------------------------------------------

  document.addEventListener(
    'DOMContentLoaded',
    function () {

      if (!initializeSupabase()) {
        return;
      }

      // Signup form
      const signupForm =
        document.querySelector(
          'form[action="supabase-signup"]'
        );

      // Login form
      const loginForm =
        document.querySelector(
          'form[action="supabase-login"]'
        );

      // ----------------------------------------------
      // Signup
      // ----------------------------------------------

      if (signupForm) {
        signupForm.addEventListener(
          'submit',
          function (event) {
            event.preventDefault();

            signUp(signupForm);
          }
        );
      }

      // ----------------------------------------------
      // Login
      // ----------------------------------------------

      if (loginForm) {
        loginForm.addEventListener(
          'submit',
          function (event) {
            event.preventDefault();

            signIn(loginForm);
          }
        );
      }

      updateAccountUI();

      console.log(
        'RX CLOTHS authentication initialized successfully.'
      );
    }
  );

})();