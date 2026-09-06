const Formatters = {
  currency(amount) {
    if (isNaN(amount) || amount === null || amount === undefined) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  },

  duration(seconds) {
    const sec = Math.max(0, Math.floor(Number(seconds) || 0));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return [
      h.toString().padStart(2, '0'),
      m.toString().padStart(2, '0'),
      s.toString().padStart(2, '0')
    ].join(':');
  },

  dateTime(dateStr) {
    if (!dateStr) return '--';
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? dateStr
      : new Intl.DateTimeFormat('vi-VN', {
          dateStyle: 'short',
          timeStyle: 'medium'
        }).format(d);
  },

  secondsDelta(delta) {
    const num = Number(delta) || 0;
    return (num > 0 ? `+${num}` : `${num}`) + 's';
  },

  buildVietQRUrl({ bankCode, accountNumber, amount, memo, template = 'compact2' }) {
    const bank = encodeURIComponent(bankCode || 'MBBank');
    const acc = encodeURIComponent(accountNumber || '0000000000');
    const amt = encodeURIComponent(amount || 0);
    const desc = encodeURIComponent(memo || '');
    return `https://img.vietqr.io/image/${bank}-${acc}-${template}.png?amount=${amt}&addInfo=${desc}`;
  }
};
