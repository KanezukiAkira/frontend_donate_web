/**
 * Admin Module: Overview Tab & OBS Setup
 * Quản lý thiết lập OBS Overlays, sao chép URL, accordion thông số khuyên dùng và test alert.
 */

const AdminOverview = (() => {
  const origin = window.location.origin;

  function buildSubathonObsUrl(token) {
    if (!token) return `${origin}/widgets/subathon-timer.html`;
    const customSub = localStorage.getItem('subathon_custom_subtitle') || '';
    const subParam = customSub ? `&subtitle=${encodeURIComponent(customSub)}` : '';
    return `${origin}/widgets/subathon-timer.html?token=${token}${subParam}`;
  }

  function updateSubathonOverviewWidget(token) {
    const subathonWidgetUrl = document.getElementById('subathonWidgetUrl');
    const subathonWidgetBtn = document.getElementById('subathonWidgetActionBtn');
    const subathonWidgetHint = document.getElementById('subathonWidgetHint');
    if (!subathonWidgetUrl || !subathonWidgetBtn) return;

    if (token) {
      const obsUrl = buildSubathonObsUrl(token);
      subathonWidgetUrl.value = obsUrl;
      subathonWidgetBtn.className = 'btn btn-gold copy-widget-btn';
      subathonWidgetBtn.setAttribute('data-target', 'subathonWidgetUrl');
      subathonWidgetBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        <span>Sao chép</span>
      `;
      if (subathonWidgetHint) {
        subathonWidgetHint.innerHTML = 'Khuyến nghị: 450×220px. Nền trong suốt, đặt ở góc màn hình.';
      }
    } else {
      subathonWidgetUrl.value = `${origin}/widgets/subathon-timer.html`;
      subathonWidgetBtn.className = 'btn btn-gold goto-subathon-btn';
      subathonWidgetBtn.removeAttribute('data-target');
      subathonWidgetBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        <span>Tạo phiên</span>
      `;
      if (subathonWidgetHint) {
        subathonWidgetHint.innerHTML = '<span style="color:var(--gold);display:inline-flex;align-items:center;gap:4px;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>Chưa có phiên hoạt động.</span> Nhấn <strong>Tạo phiên</strong> để thiết lập ca đếm ngược và lấy link OBS.';
      }
    }
  }

  function updateAlertWidgetUrl(voiceId) {
    const alertWidgetUrl = document.getElementById('alertWidgetUrl');
    if (!alertWidgetUrl) return;
    const selectedVoice = voiceId || localStorage.getItem('obs_selected_tts_voice') || 'vi-VN-HoaiMyNeural';
    const voiceParam = selectedVoice ? `?voice=${encodeURIComponent(selectedVoice)}` : '';
    alertWidgetUrl.value = `${origin}/widgets/donate-alert.html${voiceParam}`;
  }

  function init() {
    const alertWidgetUrl = document.getElementById('alertWidgetUrl');
    const subathonWidgetUrl = document.getElementById('subathonWidgetUrl');
    const subathonWidgetBtn = document.getElementById('subathonWidgetActionBtn');
    const copyPreviewAlertBtn = document.getElementById('copyPreviewAlertBtn');
    const toggleObsSpecsBtn = document.getElementById('toggleObsSpecsBtn');
    const obsSpecsCollapse = document.getElementById('obsSpecsCollapse');
    const testDonateAlertBtn = document.getElementById('testDonateAlertBtn');
    const obsVoiceSelect = document.getElementById('obsVoiceSelect');
    const btnPreviewVoice = document.getElementById('btnPreviewVoice');
    const obsVoiceDesc = document.getElementById('obsVoiceDesc');

    let voicesList = [];
    const savedVoice = localStorage.getItem('obs_selected_tts_voice') || 'vi-VN-HoaiMyNeural';

    async function loadVoices() {
      if (typeof TtsService === 'undefined' || !obsVoiceSelect) return;
      try {
        voicesList = await TtsService.getVoices();
        if (Array.isArray(voicesList) && voicesList.length > 0) {
          obsVoiceSelect.innerHTML = voicesList.map(v => {
            const isSelected = v.id === savedVoice ? 'selected' : '';
            const star = v.recommended ? ' ★ Khuyên dùng' : '';
            return `<option value="${v.id}" ${isSelected}>${v.name} (${v.language})${star}</option>`;
          }).join('');

          const current = voicesList.find(v => v.id === obsVoiceSelect.value);
          if (current && obsVoiceDesc) {
            obsVoiceDesc.textContent = current.description || '';
          }
        }
      } catch (err) {
        console.warn('Lỗi tải danh sách voices trong admin overview:', err);
      }
    }

    loadVoices();
    updateAlertWidgetUrl(savedVoice);

    obsVoiceSelect?.addEventListener('change', () => {
      const chosen = obsVoiceSelect.value;
      localStorage.setItem('obs_selected_tts_voice', chosen);
      updateAlertWidgetUrl(chosen);

      const voiceObj = voicesList.find(v => v.id === chosen);
      if (voiceObj && obsVoiceDesc) {
        obsVoiceDesc.textContent = voiceObj.description || '';
      }
      if (typeof SoundManager !== 'undefined' && typeof SoundManager.setVoice === 'function') {
        SoundManager.setVoice(chosen);
      }
    });

    btnPreviewVoice?.addEventListener('click', async () => {
      const chosenVoice = obsVoiceSelect?.value || 'vi-VN-HoaiMyNeural';
      const origHtml = btnPreviewVoice.innerHTML;
      btnPreviewVoice.disabled = true;
      btnPreviewVoice.innerHTML = `
        <span style="display:inline-block;width:12px;height:12px;border:2px solid #fff;border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;"></span>
        <span>Đang đọc...</span>
      `;
      try {
        if (typeof TtsService !== 'undefined') {
          await TtsService.play({
            text: 'Cảm ơn bạn đã donate ủng hộ buổi livestream!',
            voice: chosenVoice
          });
        }
      } catch (err) {
        console.warn('Lỗi nghe thử giọng:', err);
      } finally {
        btnPreviewVoice.innerHTML = origHtml;
        btnPreviewVoice.disabled = false;
      }
    });

    updateSubathonOverviewWidget(null);

    subathonWidgetBtn?.addEventListener('click', async (e) => {
      e.preventDefault();
      if (subathonWidgetBtn.classList.contains('goto-subathon-btn')) {
        if (typeof window.switchTab === 'function') {
          window.switchTab('subathon');
        }
        if (window.AdminSubathon && typeof window.AdminSubathon.showCreateView === 'function') {
          window.AdminSubathon.showCreateView();
        }
        setTimeout(() => {
          const titleInput = document.getElementById('createTitle');
          if (titleInput) {
            titleInput.focus();
            titleInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 150);
        return;
      }

      if (subathonWidgetUrl && subathonWidgetUrl.value) {
        const origHTML = subathonWidgetBtn.innerHTML;
        const copyDone = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg> <span>Đã chép</span>`;
        try {
          await navigator.clipboard.writeText(subathonWidgetUrl.value);
          subathonWidgetBtn.innerHTML = copyDone;
          setTimeout(() => { subathonWidgetBtn.innerHTML = origHTML; }, 2000);
        } catch {
          subathonWidgetUrl.select();
          document.execCommand('copy');
          subathonWidgetBtn.innerHTML = copyDone;
          setTimeout(() => { subathonWidgetBtn.innerHTML = origHTML; }, 2000);
        }
      }
    });

    document.querySelectorAll('.copy-widget-btn').forEach((btn) => {
      if (btn.id === 'subathonWidgetActionBtn') return;
      btn.addEventListener('click', async () => {
        const targetId = btn.getAttribute('data-target');
        const inputEl = document.getElementById(targetId);
        if (inputEl && inputEl.value) {
          const origHTML = btn.innerHTML;
          const copyDone = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg> Đã chép`;
          try {
            await navigator.clipboard.writeText(inputEl.value);
            btn.innerHTML = copyDone;
            setTimeout(() => { btn.innerHTML = origHTML; }, 2000);
          } catch {
            inputEl.select();
            document.execCommand('copy');
            btn.innerHTML = copyDone;
            setTimeout(() => { btn.innerHTML = origHTML; }, 2000);
          }
        }
      });
    });

    if (copyPreviewAlertBtn && alertWidgetUrl) {
      copyPreviewAlertBtn.addEventListener('click', async () => {
        const baseUrl = alertWidgetUrl.value || `${origin}/widgets/donate-alert.html`;
        const previewUrl = baseUrl.includes('?') ? `${baseUrl}&preview=1` : `${baseUrl}?preview=1`;
        const origHTML = copyPreviewAlertBtn.innerHTML;
        const copyDone = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg> Đã sao chép!`;
        try {
          await navigator.clipboard.writeText(previewUrl);
          copyPreviewAlertBtn.innerHTML = copyDone;
        } catch {
          const temp = document.createElement('textarea');
          temp.value = previewUrl;
          document.body.appendChild(temp);
          temp.select();
          document.execCommand('copy');
          document.body.removeChild(temp);
          copyPreviewAlertBtn.innerHTML = copyDone;
        }
        setTimeout(() => { copyPreviewAlertBtn.innerHTML = origHTML; }, 2000);
      });
    }

    if (toggleObsSpecsBtn && obsSpecsCollapse) {
      toggleObsSpecsBtn.addEventListener('click', () => {
        const isOpen = obsSpecsCollapse.classList.toggle('open');
        toggleObsSpecsBtn.classList.toggle('active', isOpen);
        toggleObsSpecsBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });
    }

    if (testDonateAlertBtn) {
      const sampleDonors = ['Nguyễn Văn A', 'Fan Cứng 20 Năm', 'Một Người Giấu Tên', 'Hoàng Nam', 'Thảo Nhi'];
      const sampleAmounts = [20000, 50000, 100000, 200000, 500000];
      const sampleMessages = [
        'Chúc streamer buổi tối vui vẻ và tràn đầy năng lượng!',
        'Streamer chơi game đỉnh quá, gửi tặng ly trà sữa nhé!',
        'Ủng hộ kênh ngày càng phát triển và sớm đạt 100k sub!',
        'Cố lên streamer ơi, subathon hôm nay cháy hết mình luôn!',
        'Gửi chút động lực cho idol tối nay!'
      ];

      testDonateAlertBtn.addEventListener('click', async () => {
        const randomDonor = sampleDonors[Math.floor(Math.random() * sampleDonors.length)];
        const randomAmount = sampleAmounts[Math.floor(Math.random() * sampleAmounts.length)];
        const randomMsg = sampleMessages[Math.floor(Math.random() * sampleMessages.length)];

        if (typeof BroadcastChannel !== 'undefined') {
          try {
            const testChannel = new BroadcastChannel('donate-test');
            testChannel.postMessage({
              _type: 'test-donate',
              full_name: randomDonor,
              amount: randomAmount,
              message: randomMsg
            });
            testChannel.close();
          } catch (e) {
            console.warn('BroadcastChannel error:', e);
          }
        }

        try {
          await DonateService.triggerTestAlert({
            full_name: randomDonor,
            amount: randomAmount,
            message: randomMsg
          });
        } catch (err) {
          console.warn('Không thể kích hoạt test alert qua Pusher API:', err);
        }

        const origHTML = testDonateAlertBtn.innerHTML;
        testDonateAlertBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg> Đã gửi Test!`;
        testDonateAlertBtn.disabled = true;

        setTimeout(() => {
          testDonateAlertBtn.innerHTML = origHTML;
          testDonateAlertBtn.disabled = false;
        }, 1800);
      });
    }
  }

  return {
    init,
    buildSubathonObsUrl,
    updateSubathonOverviewWidget
  };
})();

window.AdminOverview = AdminOverview;
