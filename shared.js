const R6P = (() => {
  const FIELD_LABELS = {
    full_name: 'ชื่อ-นามสกุล', nickname: 'ชื่อเล่น', batch: 'รุ่น', phone: 'เบอร์โทร',
    email: 'อีเมล', pdpa: 'การยินยอม PDPA', slip: 'สลิปโอนเงิน (JPG/PNG)'
  };
  const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

  async function init() {
    await liff.init({ liffId: window.R6P_CONFIG.LIFF_ID });
    if (!liff.isLoggedIn()) {
      liff.login({ redirectUri: location.href });
      await new Promise(() => {}); // the page navigates away
    }
  }

  // text/plain keeps this a CORS "simple request"; Apps Script cannot answer preflight OPTIONS.
  async function api(action, extra) {
    const res = await fetch(window.R6P_CONFIG.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(Object.assign({ action: action, idToken: liff.getIDToken() }, extra || {}))
    });
    return res.json();
  }

  async function resizeImage(file, maxWidth = 1280) {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxWidth / bitmap.width);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    return { base64: dataUrl.split(',')[1], mime: 'image/jpeg' };
  }

  function thaiDate(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return d + ' ' + THAI_MONTHS[m - 1] + ' ' + (y + 543);
  }

  function errorText(r) {
    if (r.error === 'INVALID') return 'กรุณาตรวจสอบ: ' + r.fields.map((f) => FIELD_LABELS[f] || f).join(', ');
    if (r.error === 'PENDING_EXISTS') return 'มีใบสมัครที่รอตรวจสอบอยู่แล้ว กรุณารอผลก่อน';
    if (r.error === 'UNAUTHORIZED') return 'เซสชันหมดอายุ กรุณาปิดแล้วเปิดหน้านี้ใหม่';
    return 'เกิดข้อผิดพลาด (' + r.error + ') กรุณาลองใหม่';
  }

  const addFriendUrl = () => 'https://line.me/R/ti/p/' + encodeURIComponent(window.R6P_CONFIG.BOT_BASIC_ID);

  return { init, api, resizeImage, thaiDate, errorText, addFriendUrl };
})();
