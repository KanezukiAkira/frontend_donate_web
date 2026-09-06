document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const submitBtn = loginForm.querySelector('button[type="submit"]');

    if (!email || !password) {
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Đang đăng nhập...';

    try {
      await AuthService.login(email, password);
      setTimeout(() => {
        window.location.href = '../../pages/dashboard/index.html';
      }, 500);
    } catch (err) {
      console.error('Lỗi đăng nhập:', err);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Đăng nhập';
    }
  });

  registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const submitBtn = registerForm.querySelector('button[type="submit"]');

    if (!fullName || !email || !password) {
      return;
    }

    if (password.length < 6) {
      return;
    }

    if (password !== confirmPassword) {
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Đang tạo tài khoản...';

    try {
      await AuthService.register({
        email: email,
        password: password,
        full_name: fullName
      });

      setTimeout(() => {
        window.location.href = 'login.html';
      }, 500);
    } catch (err) {
      console.error('Lỗi đăng ký:', err);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Đăng ký tài khoản';
    }
  });
});
