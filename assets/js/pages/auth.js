document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const submitBtn = loginForm.querySelector('button[type="submit"]');

    if (!email || !password) {
      if (typeof Toast !== 'undefined') Toast.error('Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Đang đăng nhập...';

    try {
      await AuthService.login(email, password);
      if (typeof Toast !== 'undefined') Toast.success('Đăng nhập thành công! Đang chuyển hướng...');
      setTimeout(() => {
        window.location.href = '../../pages/dashboard/index.html';
      }, 1000);
    } catch (err) {
      if (typeof Toast !== 'undefined') Toast.error(err.message || 'Email hoặc mật khẩu không chính xác');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Đang nhập';
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
      if (typeof Toast !== 'undefined') Toast.error('Vui lòng điền đầy đủ các thông tin bắt buộc');
      return;
    }

    if (password.length < 6) {
      if (typeof Toast !== 'undefined') Toast.error('Mật khẩu phải có tối thiểu 6 ký tự');
      return;
    }

    if (password !== confirmPassword) {
      if (typeof Toast !== 'undefined') Toast.error('Mật khẩu xác nhận không khớp');
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

      if (typeof Toast !== 'undefined') Toast.success('Đăng ký thành công! Đang chuyển sang trang đăng nhập...');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1200);
    } catch (err) {
      if (typeof Toast !== 'undefined') Toast.error(err.message || 'Lỗi khi đăng ký tài khoản');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Đăng ký tài khoản';
    }
  });
});
