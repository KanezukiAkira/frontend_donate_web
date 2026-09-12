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

  parseUtc7Date(dateStr) {
    if (!dateStr) return null;
    let d;
    if (dateStr instanceof Date) {
      d = dateStr;
    } else if (typeof dateStr === 'number') {
      d = new Date(dateStr);
    } else if (typeof dateStr === 'string') {
      let s = dateStr.trim();
      // Nếu chuỗi ngày giờ (ISO/SQL) không có timezone suffix (Z hoặc offset +/-), backend Render/MySQL sinh theo UTC nên gắn Z
      if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/.test(s) && !s.endsWith('Z') && !/[+-]\d{2}(:?\d{2})?$/.test(s)) {
        s = s.replace(' ', 'T') + 'Z';
      }
      d = new Date(s);
    } else {
      d = new Date(dateStr);
    }
    return isNaN(d.getTime()) ? null : d;
  },

  getUtc7Components(dateStr) {
    const d = this.parseUtc7Date(dateStr);
    if (!d) return null;
    // Chuyển đổi chính xác sang UTC+7 (GMT+7)
    const utc7Ms = d.getTime() + 7 * 60 * 60 * 1000;
    const u7 = new Date(utc7Ms);
    const pad = (n) => String(n).padStart(2, '0');
    return {
      day: pad(u7.getUTCDate()),
      month: pad(u7.getUTCMonth() + 1),
      year: u7.getUTCFullYear(),
      hours: pad(u7.getUTCHours()),
      minutes: pad(u7.getUTCMinutes()),
      seconds: pad(u7.getUTCSeconds()),
      rawDate: u7
    };
  },

  dateTime(dateStr, options = {}) {
    if (!dateStr) return '--';
    const c = this.getUtc7Components(dateStr);
    if (!c) return String(dateStr);

    if (options.dateFirst) {
      return `${c.day}/${c.month}/${c.year} ${c.hours}:${c.minutes}:${c.seconds}`;
    }
    return `${c.hours}:${c.minutes}:${c.seconds} ${c.day}/${c.month}/${c.year}`;
  },

  dateOnly(dateStr) {
    if (!dateStr) return '--';
    const c = this.getUtc7Components(dateStr);
    if (!c) return String(dateStr);
    return `${c.day}/${c.month}/${c.year}`;
  },

  timeOnly(dateStr, includeSeconds = true) {
    if (!dateStr) return '--';
    const c = this.getUtc7Components(dateStr);
    if (!c) return String(dateStr);
    if (includeSeconds) {
      return `${c.hours}:${c.minutes}:${c.seconds}`;
    }
    return `${c.hours}:${c.minutes}`;
  },

  secondsDelta(delta) {
    const num = Number(delta) || 0;
    return (num > 0 ? `+${num}` : `${num}`) + 's';
  },

  subathonEventType(type) {
    const raw = String(type || '').trim().toLowerCase();
    switch (raw) {
      case 'donation':
        return `<span class="badge badge-type-donation" title="Lượt ủng hộ"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>Ủng hộ</span>`;
      case 'gacha':
        return `<span class="badge badge-type-gacha" title="Quay gacha"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><circle cx="12" cy="12" r="9"/><path d="m10 15 5-3-5-3v6Z"/></svg>Vòng quay</span>`;
      case 'manual_add':
      case 'adjust_add':
      case 'manual':
        return `<span class="badge badge-type-manual-add" title="Admin cộng thời gian"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="12" height="12"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>Cộng tay</span>`;
      case 'manual_sub':
      case 'adjust_sub':
        return `<span class="badge badge-type-manual-sub" title="Admin trừ thời gian"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="12" height="12"><circle cx="12" cy="12" r="9"/><path d="M8 12h8"/></svg>Trừ tay</span>`;
      case 'start':
        return `<span class="badge badge-live" title="Bắt đầu phiên"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><polygon points="5 3 19 12 5 21 5 3"/></svg>Bắt đầu</span>`;
      case 'pause':
        return `<span class="badge badge-paused" title="Tạm dừng phiên"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>Tạm dừng</span>`;
      case 'resume':
        return `<span class="badge badge-live" title="Tiếp tục phiên"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><polygon points="5 3 19 12 5 21 5 3"/></svg>Tiếp tục</span>`;
      case 'end':
        return `<span class="badge badge-ended" title="Kết thúc phiên"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><rect x="5" y="5" width="14" height="14" rx="2"/></svg>Kết thúc</span>`;
      default:
        return `<span class="badge badge-user">${type || '--'}</span>`;
    }
  },

  buildVietQRUrl({ bankCode, accountNumber, amount, memo, template = 'compact2' }) {
    const bank = encodeURIComponent(bankCode || 'MBBank');
    const acc = encodeURIComponent(accountNumber || '0000000000');
    const amt = encodeURIComponent(amount || 0);
    const desc = encodeURIComponent(memo || '');
    return `https://img.vietqr.io/image/${bank}-${acc}-${template}.png?amount=${amt}&addInfo=${desc}`;
  }
};
