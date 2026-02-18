// ==========================================
// Sünger Metreküp Hesaplama - Ana Uygulama
// ==========================================

// === Sabitler ===
const COS30 = Math.cos(Math.PI / 6);
const SIN30 = Math.sin(Math.PI / 6);
const SQRT6_2 = Math.sqrt(6) / 2;
const SQRT2_2 = Math.sqrt(2) / 2;

// === Durum ===
let activeTab = 'plaka';
let itemList = [];
let nextId = 1;
let editingId = null;  // Düzenleme modundaki ürün ID'si

// === DOM Hazır ===
document.addEventListener('DOMContentLoaded', init);

function init() {
    setupTabs();
    setupInputs();
    setupButtons();
    setupContainer();
    loadList();
    renderInputCardIcons();
    renderTabIcons();
    renderContainerTypeIcons();
    renderTypeTotalIcons();
    resizeCanvas();
    render3D();
    setupLanguageSelector();

    window.addEventListener('resize', () => {
        resizeCanvas();
        render3D();
    });

    // PWA Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
}

// ==========================================
// TAB YÖNETİMİ
// ==========================================

function setupTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });
}

function switchTab(tab) {
    activeTab = tab;

    // Tab butonları
    document.querySelectorAll('.tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === tab);
    });

    // Input panelleri
    document.getElementById('plaka-inputs').classList.toggle('hidden', tab !== 'plaka');
    document.getElementById('rulo-inputs').classList.toggle('hidden', tab !== 'rulo');
    document.getElementById('rollpack-inputs').classList.toggle('hidden', tab !== 'rollpack');

    // Yeniden hesapla ve çiz
    calculate();
    render3D();
}

// ==========================================
// INPUT İŞLEMLERİ
// ==========================================

function setupInputs() {
    // Tüm input'lara dinleyici ekle
    const allInputs = document.querySelectorAll('input[type="number"]');
    allInputs.forEach(input => {
        input.addEventListener('input', onInputChange);
        input.addEventListener('change', onInputChange);
        // Tıklayınca içeriği seç (direkt yazabilmek için)
        input.addEventListener('focus', function() {
            this.select();
        });
    });

    // Rulo en validasyonu
    const ruloEnInput = document.getElementById('rulo-en');
    const ruloEnWarning = document.getElementById('rulo-en-warning');
    if (ruloEnInput && ruloEnWarning) {
        ruloEnInput.addEventListener('input', function() {
            const val = parseFloat(this.value);
            if (this.value !== '' && val < 5) {
                ruloEnWarning.textContent = t('warnMinEn');
                ruloEnWarning.classList.add('show');
                this.classList.add('input-error');
            } else if (this.value !== '' && val > 220) {
                ruloEnWarning.textContent = t('warnMaxEn');
                ruloEnWarning.classList.add('show');
                this.classList.add('input-error');
            } else {
                ruloEnWarning.textContent = '';
                ruloEnWarning.classList.remove('show');
                this.classList.remove('input-error');
            }
        });
    }

    // Rollpack en validasyonu
    const rollpackEnInput = document.getElementById('rollpack-en');
    const rollpackEnWarning = document.getElementById('rollpack-en-warning');
    if (rollpackEnInput && rollpackEnWarning) {
        rollpackEnInput.addEventListener('input', function() {
            const val = parseFloat(this.value);
            if (this.value !== '' && val < 5) {
                rollpackEnWarning.textContent = t('warnMinEn');
                rollpackEnWarning.classList.add('show');
                this.classList.add('input-error');
            } else if (this.value !== '' && val > 220) {
                rollpackEnWarning.textContent = t('warnMaxEn');
                rollpackEnWarning.classList.add('show');
                this.classList.add('input-error');
            } else {
                rollpackEnWarning.textContent = '';
                rollpackEnWarning.classList.remove('show');
                this.classList.remove('input-error');
            }
        });
    }
}

function onInputChange() {
    calculate();
    render3D();
}

// ==========================================
// HESAPLAMA
// ==========================================

function calculate() {
    if (activeTab === 'plaka') {
        calculatePlaka();
    } else if (activeTab === 'rollpack') {
        calculateRollpack();
    } else {
        calculateRulo();
    }
}

function calculatePlaka() {
    const en = parseFloat(document.getElementById('plaka-en').value) || 0;
    const boy = parseFloat(document.getElementById('plaka-boy').value) || 0;
    const kalinlik = parseFloat(document.getElementById('plaka-kalinlik').value) || 0;
    const adet = parseInt(document.getElementById('plaka-adet').value) || 1;

    const resultEl = document.getElementById('result');
    const detailEl = document.getElementById('result-detail');
    const btnAdd = document.getElementById('btn-add');

    if (en <= 0 || boy <= 0 || kalinlik <= 0) {
        resultEl.textContent = '0.000 m³';
        resultEl.classList.remove('has-value');
        detailEl.textContent = t('resultHint');
        btnAdd.disabled = true;
        return;
    }

    const hacimCm3 = en * boy * kalinlik;
    const birimM3 = hacimCm3 / 1000000;
    const toplamM3 = birimM3 * adet;

    resultEl.textContent = formatVolume(toplamM3) + ' m³';
    resultEl.classList.add('has-value');

    let detail = `${en} × ${boy} × ${kalinlik} = ${formatNumber(hacimCm3)} cm³ = ${formatVolume(birimM3)} m³`;
    if (adet > 1) {
        detail += ` × ${adet} ${t('adetLabel').toLowerCase()} = ${formatVolume(toplamM3)} m³`;
    }
    detailEl.textContent = detail;
    btnAdd.disabled = false;
}

function calculateRulo() {
    const en = parseFloat(document.getElementById('rulo-en').value) || 0;
    const kalinlik = parseFloat(document.getElementById('rulo-kalinlik').value) || 0;
    const ruloBoyu = parseFloat(document.getElementById('rulo-boyu').value) || 0;
    const adet = parseInt(document.getElementById('rulo-adet').value) || 1;

    const resultEl = document.getElementById('result');
    const detailEl = document.getElementById('result-detail');
    const btnAdd = document.getElementById('btn-add');

    if (en <= 0 || kalinlik <= 0 || ruloBoyu <= 0) {
        resultEl.textContent = '0.000 m³';
        resultEl.classList.remove('has-value');
        detailEl.textContent = t('resultHint');
        btnAdd.disabled = true;
        return;
    }

    const ruloBoyuCm = ruloBoyu * 100;
    const hacimCm3 = en * kalinlik * ruloBoyuCm;
    const hacimM3 = hacimCm3 / 1000000;
    const toplamM3 = hacimM3 * adet;

    resultEl.textContent = formatVolume(toplamM3) + ' m³';
    resultEl.classList.add('has-value');

    const alanCm2 = kalinlik * ruloBoyuCm;
    let detail = `(${kalinlik} cm × ${ruloBoyu} m [${ruloBoyuCm} cm]) × ${en} cm = ${formatNumber(hacimCm3)} cm³ = ${formatVolume(hacimM3)} m³`;
    if (adet > 1) {
        detail += ` × ${adet} ${t('adetLabel').toLowerCase()} = ${formatVolume(toplamM3)} m³`;
    }
    detailEl.textContent = detail;
    btnAdd.disabled = false;

    // Vakum bilgisi güncelle
    const vakum = parseFloat(document.getElementById('rulo-vakum').value) || 0;
    const vakumInfo = document.getElementById('vakum-info');
    if (vakumInfo) {
        const ruloBoyuCmCalc = ruloBoyu * 100;
        const capNormal = Math.sqrt(kalinlik * ruloBoyuCmCalc / Math.PI) * 2;
        if (capNormal > 0 && vakum > 0) {
            const capVakumlu = capNormal * (1 - vakum / 100);
            vakumInfo.innerHTML = t('vakumCapVakumlu', { cap: capNormal.toFixed(1), vcap: capVakumlu.toFixed(1) });
        } else if (capNormal > 0) {
            vakumInfo.innerHTML = t('vakumCapNormal', { cap: capNormal.toFixed(1) });
        } else {
            vakumInfo.innerHTML = t('vakumCapDefault');
        }
    }
}

function calculateRollpack() {
    const en = parseFloat(document.getElementById('rollpack-en').value) || 0;
    const cap = parseFloat(document.getElementById('rollpack-cap').value) || 0;
    const paketAdet = parseInt(document.getElementById('rollpack-paket-adet').value) || 1;
    const urunEn = parseFloat(document.getElementById('rollpack-urun-en').value) || 0;
    const urunBoy = parseFloat(document.getElementById('rollpack-urun-boy').value) || 0;
    const urunYukseklik = parseFloat(document.getElementById('rollpack-urun-yukseklik').value) || 0;
    const urunAdet = parseInt(document.getElementById('rollpack-urun-adet').value) || 1;

    const resultEl = document.getElementById('result');
    const detailEl = document.getElementById('result-detail');
    const btnAdd = document.getElementById('btn-add');

    if (en <= 0 || cap <= 0) {
        resultEl.textContent = '0.000 m³';
        resultEl.classList.remove('has-value');
        detailEl.textContent = t('resultHint');
        btnAdd.disabled = true;
        return;
    }

    const r = cap / 2;
    const birimHacimCm3 = Math.PI * r * r * en;
    const birimHacimM3 = birimHacimCm3 / 1000000;
    const rollpackToplamM3 = birimHacimM3 * paketAdet;

    // Ürün hacmi: her pakette urunAdet kadar ürün var → toplam = paketAdet × urunAdet
    let urunBirimM3 = 0;
    let urunToplamM3 = 0;
    let toplamUrunSayisi = 0;
    if (urunEn > 0 && urunBoy > 0 && urunYukseklik > 0) {
        urunBirimM3 = (urunEn * urunBoy * urunYukseklik) / 1000000;
        toplamUrunSayisi = paketAdet * urunAdet;
        urunToplamM3 = urunBirimM3 * toplamUrunSayisi;
    }

    resultEl.textContent = formatVolume(rollpackToplamM3) + ' m³';
    resultEl.classList.add('has-value');

    let detail = `${t('rollpackM3Label')}: π×(${cap}/2)²×${en} × ${paketAdet} = ${formatVolume(rollpackToplamM3)} m³`;
    if (urunToplamM3 > 0) {
        detail += `\n${t('urunM3Label')}: ${urunEn}×${urunBoy}×${urunYukseklik} × ${toplamUrunSayisi} (${paketAdet}×${urunAdet}) = ${formatVolume(urunToplamM3)} m³`;
    }
    detailEl.innerHTML = detail.replace(/\n/g, '<br>');
    btnAdd.disabled = false;


}

// ==========================================
// 3D İZOMETRİK ÇİZİM
// ==========================================

function resizeCanvas() {
    const canvas = document.getElementById('preview3d');
    const container = canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const w = rect.width - 24; // padding
    const h = 280;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
}

function render3D() {
    const canvas = document.getElementById('preview3d');
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.width / dpr;
    const H = canvas.height / dpr;

    // Temizle
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // ===== SAHNE ARKA PLANI =====
    // Beyaz arka plan
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    // Hafif gri kenar vignette (sahne hissi)
    const vignetteGrad = ctx.createRadialGradient(W / 2, H / 2, W * 0.2, W / 2, H / 2, W * 0.75);
    vignetteGrad.addColorStop(0, 'rgba(255,255,255,0)');
    vignetteGrad.addColorStop(1, 'rgba(220, 225, 235, 0.5)');
    ctx.fillStyle = vignetteGrad;
    ctx.fillRect(0, 0, W, H);

    // ===== SPOT IŞIK (Yukarıdan) =====
    const spotX = W / 2;

    // Spot ışık konisi (belirgin üçgen koni)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(spotX - 8, 0);
    ctx.lineTo(spotX - W * 0.32, H * 0.88);
    ctx.lineTo(spotX + W * 0.32, H * 0.88);
    ctx.lineTo(spotX + 8, 0);
    ctx.closePath();
    const coneGrad = ctx.createLinearGradient(0, 0, 0, H * 0.88);
    coneGrad.addColorStop(0, 'rgba(255, 245, 200, 0.55)');
    coneGrad.addColorStop(0.15, 'rgba(255, 245, 200, 0.25)');
    coneGrad.addColorStop(0.4, 'rgba(255, 248, 220, 0.12)');
    coneGrad.addColorStop(0.7, 'rgba(255, 250, 230, 0.05)');
    coneGrad.addColorStop(1, 'rgba(255, 250, 240, 0)');
    ctx.fillStyle = coneGrad;
    ctx.fill();
    ctx.restore();

    // Koni kenar çizgileri (çok ince, yarı saydam)
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 230, 150, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(spotX - 8, 0);
    ctx.lineTo(spotX - W * 0.32, H * 0.88);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(spotX + 8, 0);
    ctx.lineTo(spotX + W * 0.32, H * 0.88);
    ctx.stroke();
    ctx.restore();

    // Spot ışık merkez parlak alan (radyal)
    const spotGrad = ctx.createRadialGradient(spotX, H * 0.35, 0, spotX, H * 0.4, W * 0.35);
    spotGrad.addColorStop(0, 'rgba(255, 248, 210, 0.35)');
    spotGrad.addColorStop(0.4, 'rgba(255, 245, 200, 0.12)');
    spotGrad.addColorStop(1, 'rgba(255, 245, 200, 0)');
    ctx.fillStyle = spotGrad;
    ctx.fillRect(0, 0, W, H);

    // ===== SAHNE ZEMİNİ =====
    const floorY = H * 0.82;
    // Zemin üzerinde ışık yansıması (oval parlak alan)
    const floorSpotGrad = ctx.createRadialGradient(spotX, floorY, 0, spotX, floorY, W * 0.3);
    floorSpotGrad.addColorStop(0, 'rgba(255, 245, 210, 0.3)');
    floorSpotGrad.addColorStop(0.5, 'rgba(255, 245, 220, 0.1)');
    floorSpotGrad.addColorStop(1, 'rgba(255, 245, 220, 0)');
    ctx.fillStyle = floorSpotGrad;
    ctx.beginPath();
    ctx.ellipse(spotX, floorY, W * 0.3, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Zemin çizgisi
    ctx.save();
    const lineGrad = ctx.createLinearGradient(W * 0.15, 0, W * 0.85, 0);
    lineGrad.addColorStop(0, 'rgba(0,0,0,0)');
    lineGrad.addColorStop(0.5, 'rgba(0,0,0,0.07)');
    lineGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W * 0.1, floorY);
    ctx.lineTo(W * 0.9, floorY);
    ctx.stroke();
    ctx.restore();

    // ===== SPOT LAMBA FİZİKSEL GÖRSELİ =====
    ctx.save();

    // Lamba asma çubuğu (tavan bağlantısı)
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(spotX, 0);
    ctx.lineTo(spotX, 14);
    ctx.stroke();

    // Lamba gövdesi (trapez şekil)
    ctx.beginPath();
    ctx.moveTo(spotX - 6, 10);   // sol üst
    ctx.lineTo(spotX + 6, 10);   // sağ üst
    ctx.lineTo(spotX + 14, 24);  // sağ alt
    ctx.lineTo(spotX - 14, 24);  // sol alt
    ctx.closePath();
    const lambaGrad = ctx.createLinearGradient(0, 10, 0, 24);
    lambaGrad.addColorStop(0, '#555');
    lambaGrad.addColorStop(1, '#333');
    ctx.fillStyle = lambaGrad;
    ctx.fill();
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Lamba alt yüzey (parlak ışık yüzey)
    ctx.beginPath();
    ctx.moveTo(spotX - 14, 24);
    ctx.lineTo(spotX + 14, 24);
    ctx.lineTo(spotX + 12, 27);
    ctx.lineTo(spotX - 12, 27);
    ctx.closePath();
    ctx.fillStyle = '#222';
    ctx.fill();

    // Ampul parlaması (alt kısımda)
    const bulbGrad = ctx.createRadialGradient(spotX, 26, 0, spotX, 26, 10);
    bulbGrad.addColorStop(0, 'rgba(255, 245, 180, 0.95)');
    bulbGrad.addColorStop(0.5, 'rgba(255, 235, 140, 0.5)');
    bulbGrad.addColorStop(1, 'rgba(255, 230, 100, 0)');
    ctx.fillStyle = bulbGrad;
    ctx.beginPath();
    ctx.arc(spotX, 26, 10, 0, Math.PI * 2);
    ctx.fill();

    // Lamba kenar yansımaları (metalik parlama)
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(spotX - 5, 11);
    ctx.lineTo(spotX - 13, 23);
    ctx.stroke();

    ctx.restore();

    // ===== 3D ÇİZİM =====
    if (activeTab === 'plaka') {
        drawIsometricBox(ctx, W, H);
    } else if (activeTab === 'rollpack') {
        drawIsometricCylinder(ctx, W, H, 'rollpack');
    } else {
        drawIsometricCylinder(ctx, W, H, 'rulo');
    }

    ctx.restore();
}

// --- Plaka Sünger: Profesyonel İzometrik Kutu ---
function drawIsometricBox(ctx, W, H) {
    const en = parseFloat(document.getElementById('plaka-en').value) || 0;
    const boy = parseFloat(document.getElementById('plaka-boy').value) || 0;
    const kalinlik = parseFloat(document.getElementById('plaka-kalinlik').value) || 0;

    // Varsayılan ölçüler: 240x120x14
    const isDefault = (en <= 0 && boy <= 0 && kalinlik <= 0);

    const w = en || 240;
    const h = kalinlik || 14;
    const d = boy || 120;

    const isoBoundW = (w + d) * COS30;
    const isoBoundH = h + (w + d) * SIN30;
    const padding = 120;
    const scale = Math.min((W - padding) / isoBoundW, (H - padding) / isoBoundH, 3);

    function rawProj(x, y, z) {
        return {
            x: (x - z) * COS30 * scale,
            y: -y * scale + (x + z) * SIN30 * scale
        };
    }

    const rawPts = [
        rawProj(0,0,0), rawProj(w,0,0), rawProj(w,h,0), rawProj(0,h,0),
        rawProj(0,0,d), rawProj(w,0,d), rawProj(w,h,d), rawProj(0,h,d)
    ];
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    rawPts.forEach(p => {
        minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
    });
    const offsetX = W / 2 - (minX + maxX) / 2;
    const offsetY = H / 2 - (minY + maxY) / 2 + 28;

    function proj(x, y, z) {
        const r = rawProj(x, y, z);
        return { x: Math.round(r.x + offsetX), y: Math.round(r.y + offsetY) };
    }

    // 8 köşe - tam piksel hizalama
    const v = {
        fbl: proj(0,0,0), fbr: proj(w,0,0), ftr: proj(w,h,0), ftl: proj(0,h,0),
        bbl: proj(0,0,d), bbr: proj(w,0,d), btr: proj(w,h,d), btl: proj(0,h,d)
    };

    // Kenar rengi ve kalınlığı
    const EDGE_COLOR = '#6B4E0A';
    const EDGE_WIDTH = 1.0;

    // ═══════════════════════════════════
    // 1) GÖLGE - Alt taban (bbl-bbr-fbr-fbl değil, Z=d ve X=w izdüşümü)
    // ═══════════════════════════════════
    // Gölge, cismin taban köşe noktalarına göre olmalı: bbl, bbr, fbr (ve görünmeyen arka köşe fbl)
    // Bizim gördüğümüz taban kenarları bbl-bbr ve bbr-fbr.
    ctx.save();
    for (let i = 5; i >= 1; i--) {
        const sp = i * 2.5;
        ctx.fillStyle = `rgba(0,0,0,${0.012 * i})`;
        ctx.beginPath();
        // Gölgeyi taban elması etrafında oluştur
        ctx.moveTo(v.bbl.x - sp, v.bbl.y + sp);
        ctx.lineTo(v.bbr.x + sp, v.bbr.y + sp * 1.5);
        ctx.lineTo(v.fbr.x + sp, v.fbr.y + sp);
        ctx.lineTo(v.fbl.x - sp, v.fbl.y - sp/2); // Arka taraf (çok önemli değil)
        ctx.closePath();
        ctx.fill();
    }
    ctx.restore();

    // ═══════════════════════════════════
    // 2) SOL YÜZ (Z=d) - Sol Ön Yüz
    // ═══════════════════════════════════
    // Köşeler: btl, btr, bbr, bbl
    ctx.beginPath();
    ctx.moveTo(v.btl.x, v.btl.y);
    ctx.lineTo(v.btr.x, v.btr.y);
    ctx.lineTo(v.bbr.x, v.bbr.y);
    ctx.lineTo(v.bbl.x, v.bbl.y);
    ctx.closePath();
    
    const leftGrad = ctx.createLinearGradient(v.btl.x, v.btl.y, v.bbr.x, v.bbr.y);
    leftGrad.addColorStop(0, '#FFE260');
    leftGrad.addColorStop(1, '#E0BC28');
    ctx.fillStyle = leftGrad;
    ctx.fill();
    
    ctx.strokeStyle = EDGE_COLOR;
    ctx.lineWidth = EDGE_WIDTH;
    ctx.lineJoin = 'miter';
    ctx.stroke();

    // ═══════════════════════════════════
    // 3) SAĞ YÜZ (X=w) - Sağ Ön Yüz
    // ═══════════════════════════════════
    // Köşeler: ftr, btr, bbr, fbr
    ctx.beginPath();
    ctx.moveTo(v.ftr.x, v.ftr.y);
    ctx.lineTo(v.btr.x, v.btr.y);
    ctx.lineTo(v.bbr.x, v.bbr.y);
    ctx.lineTo(v.fbr.x, v.fbr.y);
    ctx.closePath();
    
    const rightGrad = ctx.createLinearGradient(v.fbr.x, v.ftr.y, v.bbr.x, v.bbr.y);
    rightGrad.addColorStop(0, '#E8B830');
    rightGrad.addColorStop(1, '#B89018');
    ctx.fillStyle = rightGrad;
    ctx.fill();
    
    ctx.strokeStyle = EDGE_COLOR;
    ctx.lineWidth = EDGE_WIDTH;
    ctx.lineJoin = 'miter';
    ctx.stroke();

    // ═══════════════════════════════════
    // 4) ÜST YÜZ (Y=h)
    // ═══════════════════════════════════
    // Köşeler: ftl, ftr, btr, btl
    ctx.beginPath();
    ctx.moveTo(v.ftl.x, v.ftl.y);
    ctx.lineTo(v.ftr.x, v.ftr.y);
    ctx.lineTo(v.btr.x, v.btr.y);
    ctx.lineTo(v.btl.x, v.btl.y);
    ctx.closePath();
    
    const topGrad = ctx.createLinearGradient(v.btl.x, v.btl.y, v.ftr.x, v.ftr.y);
    topGrad.addColorStop(0, '#FFF0A0');
    topGrad.addColorStop(0.5, '#FFE460');
    topGrad.addColorStop(1, '#FFD93D');
    ctx.fillStyle = topGrad;
    ctx.fill();
    
    ctx.strokeStyle = EDGE_COLOR;
    ctx.lineWidth = EDGE_WIDTH;
    ctx.lineJoin = 'miter';
    ctx.stroke();

    // ═══════════════════════════════════
    // 5) SÜNGER DOKU
    // ═══════════════════════════════════
    drawSpongeTexture(ctx, [v.btl, v.btr, v.bbr, v.bbl], 0.16); // Sol yüz
    drawSpongeTexture(ctx, [v.ftr, v.btr, v.bbr, v.fbr], 0.18); // Sağ yüz
    drawSpongeTexture(ctx, [v.ftl, v.ftr, v.btr, v.btl], 0.10); // Üst yüz

    // ═══════════════════════════════════
    // 6) KENARLAR (Wireframe - En üste)
    // ═══════════════════════════════════
    ctx.save();
    ctx.strokeStyle = EDGE_COLOR;
    ctx.lineWidth = EDGE_WIDTH;
    ctx.lineJoin = 'miter';
    ctx.lineCap = 'square';

    // Dış Siluet
    ctx.beginPath();
    ctx.moveTo(v.btl.x, v.btl.y); // Sol üst arka
    ctx.lineTo(v.ftl.x, v.ftl.y); // Sol üst ön (Pardon, projeksiyona göre ftl -> ftr ye gidiyor)
    // Siluet sırası: btl -> ftl -> ftr -> fbr -> bbr -> bbl -> btl
    // Konumlar:
    // btl: Sol, Yukarı
    // ftl: En üst, Orta (HAYIR, rawProj(0,h,0) -> y=-h. ÜST. x=0. ORTA.)
    // ftr: Sağ, Orta-Üst
    // fbr: Sağ, Alt
    // bbr: Orta, En Alt
    // bbl: Sol, Alt
    
    // Projeksiyona Dikkat:
    // fbl(0,0,0) -> Origin
    // fbr(w,0,0) -> Sağ
    // bbl(0,0,d) -> Sol
    // bbr(w,0,d) -> Alt
    
    // Yükseklik eklenince (h):
    // ftl(0,h,0) -> Üst Merkez
    // ftr(w,h,0) -> Sağ Üst
    // btl(0,h,d) -> Sol Üst
    // btr(w,h,d) -> Merkez (bize en yakın köşe)
    
    // Görünen yüzler: Top, Left(Z=d), Right(X=w)?
    // O ZAMAN ANA KÖŞE 'btr' (w,h,d) MERKEZDE.
    // 'Y' şeklindeki birleşim 'btr' noktasında.
    
    // Siluet: ftl -> ftr -> fbr -> bbr -> bbl -> btl -> ftl.
    // Evet, tüm dış sınır bu.
    
    ctx.moveTo(v.ftl.x, v.ftl.y);
    ctx.lineTo(v.ftr.x, v.ftr.y);
    ctx.lineTo(v.fbr.x, v.fbr.y);
    ctx.lineTo(v.bbr.x, v.bbr.y);
    ctx.lineTo(v.bbl.x, v.bbl.y);
    ctx.lineTo(v.btl.x, v.btl.y);
    ctx.closePath();
    ctx.stroke();

    // İç Kenarlar (Merkez 'btr' de birleşenler)
    // btr -> btl (Sol-Üst ayrımı)
    drawLine(ctx, v.btr, v.btl); 
    // btr -> ftr (Sağ-Üst ayrımı)
    drawLine(ctx, v.btr, v.ftr);
    // btr -> bbr (Sol-Sağ ayrımı / Ön Dikey)
    drawLine(ctx, v.btr, v.bbr);

    ctx.restore();

    // ═══════════════════════════════════
    // 7) PARLAMA
    // ═══════════════════════════════════
    ctx.save();
    ctx.lineCap = 'round';
    // Üst yüz ön kenarları
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    // ftl-ftr kenarı (Üst arka sağ?)
    // ftl-btl kenarı (Üst arka sol?)
    // btr-ftl kenarı (İÇ)
    // btr-ftr kenarı (İÇ)
    // Parlama genellikle ışık alan üst kenarlarda olur.
    // Işık üst sol'dan geliyorsa: ftl -> ftr ve ftl -> btl parlar.
    
    ctx.moveTo(v.ftl.x + 3, v.ftl.y);
    ctx.lineTo(v.ftr.x - 3, v.ftr.y);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(v.ftl.x - 3, v.ftl.y);
    ctx.lineTo(v.btl.x + 3, v.btl.y);
    ctx.stroke();
    ctx.restore();

    // ══════════════════════════════════════
    // 6) BOYUT ÇİZGİLERİ (Profesyonel Mühendislik Stili)
    // ══════════════════════════════════════
    ctx.save();
    const dimOffset = 22;  // Ana çizgi uzaklığı
    // ══════════════════════════════════════
    // 6) BOYUT ÇİZGİLERİ (KENARLARIN DIŞINDA - ZEMİNE PARALEL)
    // ══════════════════════════════════════
    ctx.save();
    
    // Dışarı taşma mesafesi
    const dimDist = 30; 
    
    // En (Front Edge): Dışarı doğru (-Z yönü: Sağ-Yukarı)
    const extEn = { x: COS30 * dimDist, y: -SIN30 * dimDist };
    
    // Boy (Right Edge): Dışarı doğru (+X yönü: Sağ-Aşağı)
    const extBoy = { x: COS30 * dimDist, y: SIN30 * dimDist };

    // --- En (genişlik) - Üst Geriye Doğru ---
    if (w > 0) {
        // Hedef noktalar (Dışarıda)
        const p1 = { x: v.ftl.x + extEn.x, y: v.ftl.y + extEn.y };
        const p2 = { x: v.ftr.x + extEn.x, y: v.ftr.y + extEn.y };

        // Uzantı çizgileri
        ctx.strokeStyle = 'rgba(192, 57, 43, 0.5)';
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
        
        ctx.beginPath();
        ctx.moveTo(v.ftl.x, v.ftl.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.moveTo(v.ftr.x, v.ftr.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        // Boyut çizgisi
        ctx.strokeStyle = '#c0392b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        // Oklar
        drawArrowHead(ctx, p1.x, p1.y, p2.x, p2.y, '#c0392b');
        drawArrowHead(ctx, p2.x, p2.y, p1.x, p1.y, '#c0392b');

        // Etiket
        const midEn = midpoint(p1, p2);
        drawDimLabel(ctx, midEn.x + extEn.x * 0.3, midEn.y + extEn.y * 0.3, `En: ${w} cm`, '#c0392b');
    }

    // --- Boy (derinlik) - Sağ Dışarı Doğru ---
    if (d > 0) {
        // Hedef noktalar (Dışarıda)
        const p1 = { x: v.ftr.x + extBoy.x, y: v.ftr.y + extBoy.y };
        const p2 = { x: v.btr.x + extBoy.x, y: v.btr.y + extBoy.y };

        // Uzantı çizgileri
        ctx.strokeStyle = 'rgba(41, 128, 185, 0.5)';
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        ctx.moveTo(v.ftr.x, v.ftr.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.moveTo(v.btr.x, v.btr.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        // Boyut çizgisi
        ctx.strokeStyle = '#2980b9';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        // Oklar
        drawArrowHead(ctx, p1.x, p1.y, p2.x, p2.y, '#2980b9');
        drawArrowHead(ctx, p2.x, p2.y, p1.x, p1.y, '#2980b9');

        // Etiket
        const midBoy = midpoint(p1, p2);
        drawDimLabel(ctx, midBoy.x + extBoy.x * 0.3, midBoy.y + extBoy.y * 0.3, `Boy: ${d} cm`, '#2980b9');
    }

    // --- Kalınlık (yükseklik) - Sol Dışarı Doğru ---
    if (h > 0) {
        const xOff = -35;
        const p1 = { x: v.fbl.x + xOff, y: v.fbl.y };
        const p2 = { x: v.ftl.x + xOff, y: v.ftl.y };

        // Uzantı çizgileri
        ctx.strokeStyle = 'rgba(39, 174, 96, 0.4)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(v.fbl.x - 4, v.fbl.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.moveTo(v.ftl.x - 4, v.ftl.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        // Boyut çizgisi
        ctx.strokeStyle = '#27ae60';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        // Oklar
        drawArrowHead(ctx, p1.x, p1.y, p2.x, p2.y, '#27ae60');
        drawArrowHead(ctx, p2.x, p2.y, p1.x, p1.y, '#27ae60');

        // Etiket
        const midKal = midpoint(p1, p2);
        drawDimLabel(ctx, midKal.x - 10, midKal.y, `${h} cm`, '#27ae60');
    }

    ctx.setLineDash([]);
    ctx.restore();
}

// --- Rulo Sünger: Yatay Silindir ---
function drawIsometricCylinder(ctx, W, H, source) {
    const isRollpack = (source === 'rollpack');
    let enVal, outerR, outerRNormal, cylLen, vakum;

    if (isRollpack) {
        const en = parseFloat(document.getElementById('rollpack-en').value) || 0;
        const cap = parseFloat(document.getElementById('rollpack-cap').value) || 0;
        vakum = 0;

        enVal = en || 150;
        const capVal = cap || 20;
        outerR = capVal / 2;
        outerRNormal = outerR;
        cylLen = enVal;
    } else {
        const en = parseFloat(document.getElementById('rulo-en').value) || 0;
        const kalinlik = parseFloat(document.getElementById('rulo-kalinlik').value) || 0;
        const ruloBoyu = parseFloat(document.getElementById('rulo-boyu').value) || 0;
        vakum = parseFloat(document.getElementById('rulo-vakum').value) || 0;

        enVal = en || 150;
        const kalVal = kalinlik || 0.8;
        const boyVal = (ruloBoyu || 100) * 100;
        const volArea = kalVal * boyVal;
        const outerRNormal = Math.sqrt(Math.max(0, volArea) / Math.PI);
        outerR = outerRNormal * (1 - vakum / 100);
        cylLen = enVal;
    } 

    // Canvas sığdırma
    const padding = 140; 
    const availW = W - padding;
    const availH = H - padding;

    // En (cylLen) için sabit ölçek - rulo boyu değiştiğinde en değişmez
    const scaleForLen = Math.min(availW / (cylLen * 1.2), 3.5);
    const sLen = cylLen * scaleForLen;

    // Çap için: orantılı ölçekle, ama canvas'a sığdır
    const sR = Math.min(outerR * scaleForLen, availH / 2 - 5);
    const ellipseRx = sR * 0.4;      // perspektif x
    const ellipseRy = sR;            // perspektif y

    // Merkezleme
    const cx = W / 2;
    const cy = H / 2 + 35;
    
    // Sol ve sağ kapak merkezleri
    const leftX = cx - sLen / 2;
    const rightX = cx + sLen / 2;

    const EDGE_COLOR = '#6B4E0A';
    const EDGE_WIDTH = 1.2;

    // ===== GÖLGE =====
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + sR + 10, sLen / 2 + ellipseRx, ellipseRx * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // ===== GÖVDE (Yan Yüzey) =====
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(leftX, cy - sR); // Sol tepe
    ctx.lineTo(rightX, cy - sR); // Sağ tepe
    // Sağ tarafı elips yayı ile kapatma (Yarım daire)
    ctx.ellipse(rightX, cy, ellipseRx, ellipseRy, 0, -Math.PI / 2, Math.PI / 2); // Sağ alt
    ctx.lineTo(leftX, cy + sR); // Sol alt
    // Sol tarafı elips yayı (Arka taraf - yarım)
    ctx.ellipse(leftX, cy, ellipseRx, ellipseRy, 0, Math.PI / 2, -Math.PI / 2); // Sol üst
    ctx.closePath();

    // Gradyan Dolgu
    const bodyGrad = ctx.createLinearGradient(0, cy - sR, 0, cy + sR);
    bodyGrad.addColorStop(0, '#FFE873');   // Üst (Aydınlık)
    bodyGrad.addColorStop(0.4, '#FFD93D'); // Orta (Normal)
    bodyGrad.addColorStop(0.8, '#C9A020'); // Alt (Gölge)
    bodyGrad.addColorStop(1, '#A07810');   // En Alt (Koyu)
    
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    
    // Kenar Çizgileri (Gövde Sınırları)
    ctx.strokeStyle = EDGE_COLOR;
    ctx.lineWidth = EDGE_WIDTH;
    ctx.beginPath();
    ctx.moveTo(leftX, cy - sR);
    ctx.lineTo(rightX, cy - sR);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(leftX, cy + sR);
    ctx.lineTo(rightX, cy + sR);
    ctx.stroke();

    // Sol tarafın görünür yayı
    ctx.beginPath();
    ctx.ellipse(leftX, cy, ellipseRx, ellipseRy, 0, Math.PI / 2, 1.5 * Math.PI);
    ctx.stroke();
    
    // Sünger Dokusu (Gövdede)
    drawSpongeTexture(ctx, [{x:leftX, y:cy-sR}, {x:rightX, y:cy-sR}, {x:rightX, y:cy+sR}, {x:leftX, y:cy+sR}], 0.08);

    ctx.restore();

    // ===== SAĞ KAPAK (Daire Yüzeyi) =====
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(rightX, cy, ellipseRx, ellipseRy, 0, 0, Math.PI * 2);
    
    // Radyal Gradyan
    const faceGrad = ctx.createRadialGradient(rightX, cy, 0, rightX, cy, sR);
    faceGrad.addColorStop(0, '#FFF5B0');
    faceGrad.addColorStop(1, '#E8B830');
    ctx.fillStyle = faceGrad;
    ctx.fill();

    // Spiral Çizgiler
    ctx.strokeStyle = 'rgba(107, 78, 10, 0.3)';
    ctx.lineWidth = 1;
    for (let r = sR; r > 5; r -= sR / 5) {
        ctx.beginPath();
        ctx.ellipse(rightX, cy, ellipseRx * (r/sR), r, 0, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Dış Çerçeve
    ctx.strokeStyle = EDGE_COLOR;
    ctx.lineWidth = EDGE_WIDTH;
    ctx.beginPath();
    ctx.ellipse(rightX, cy, ellipseRx, ellipseRy, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // ══════════════════════════════════════
    // BOYUT ÇİZGİLERİ (EN ve ÇAP)
    // ══════════════════════════════════════
    const dimOffset = 40;

    // --- EN (Genişlik) ---
    // Üst tarafta gösterelim
    if (enVal > 0) {
        const dY = -dimOffset;
        const p1 = { x: leftX, y: cy - sR + dY };
        const p2 = { x: rightX, y: cy - sR + dY };

        ctx.save();
        ctx.strokeStyle = 'rgba(192, 57, 43, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(leftX, cy - sR - 5);
        ctx.lineTo(p1.x, p1.y);
        ctx.moveTo(rightX, cy - sR - 5);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        ctx.strokeStyle = '#c0392b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        drawArrowHead(ctx, p1.x, p1.y, p2.x, p2.y, '#c0392b');
        drawArrowHead(ctx, p2.x, p2.y, p1.x, p1.y, '#c0392b');

        const mid = midpoint(p1, p2);
        drawDimLabel(ctx, mid.x, mid.y - 5, `En: ${enVal} cm`, '#c0392b');
        ctx.restore();
    }

    // --- YAPISAL BİLGİ (Boy & Kalınlık -> Çap Etkisi) ---
    // Sağ tarafta Çapı göster
    if (outerRNormal > 0) {
        const dX = dimOffset + ellipseRx; 
        const topY = cy - sR;
        const botY = cy + sR;
        const lineX = rightX + dX;

        ctx.save();
        ctx.strokeStyle = 'rgba(41, 128, 185, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(rightX, topY); 
        ctx.lineTo(lineX, topY);
        ctx.moveTo(rightX, botY); 
        ctx.lineTo(lineX, botY);
        ctx.stroke();

        ctx.strokeStyle = '#2980b9';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(lineX, topY);
        ctx.lineTo(lineX, botY);
        ctx.stroke();

        drawArrowHead(ctx, lineX, topY, lineX, botY, '#2980b9');
        drawArrowHead(ctx, lineX, botY, lineX, topY, '#2980b9');

        const diameter = (outerRNormal * 2).toFixed(1);
        const midY = (topY + botY) / 2;
        // Vakum varsa onu da göster
        if (vakum > 0) {
            const diamVac = (outerR * 2).toFixed(1);
            drawDimLabel(ctx, lineX + 5, midY, `Çap: ${diameter} -> ${diamVac} cm`, '#2980b9');
        } else {
            drawDimLabel(ctx, lineX + 5, midY, `Çap: ~${diameter} cm`, '#2980b9');
        }
        ctx.restore();
    }
}

// --- Yardımcı Çizim Fonksiyonları ---

function drawFace(ctx, points, color, strokeColor) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1;
    ctx.stroke();
}

function drawFaceGradient(ctx, points, colorFrom, colorTo, strokeColor) {
    // Bounding box
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    points.forEach(p => {
        minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
    });

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();

    const grad = ctx.createLinearGradient(minX, minY, maxX, maxY);
    grad.addColorStop(0, colorFrom);
    grad.addColorStop(1, colorTo);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1;
    ctx.stroke();
}

function drawSpongeTexture(ctx, points, opacity) {
    // Yüz alanı içine gerçekçi sünger delikleri çiz
    ctx.save();

    // Yüz sınırlarını kırp
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.clip();

    // Sınır kutusunu bul
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    points.forEach(p => {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
    });

    // Büyük delikler (gözenekler)
    const stepBig = 16;
    for (let x = minX; x < maxX; x += stepBig) {
        for (let y = minY; y < maxY; y += stepBig) {
            const hash = (x * 7 + y * 13);
            const offX = (hash % stepBig) - stepBig / 2;
            const offY = ((x * 11 + y * 3) % stepBig) - stepBig / 2;
            const px = x + offX * 0.5;
            const py = y + offY * 0.5;
            const r = 1.2 + (hash % 5) * 0.4;

            // Delik gölgesi
            ctx.fillStyle = `rgba(0,0,0,${opacity * 0.18})`;
            ctx.beginPath();
            ctx.arc(px, py, r, 0, Math.PI * 2);
            ctx.fill();

            // Delik iç açık tonu
            ctx.fillStyle = `rgba(255,255,200,${opacity * 0.06})`;
            ctx.beginPath();
            ctx.arc(px - 0.3, py - 0.3, r * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Küçük delikler (ince doku)
    const stepSmall = 9;
    ctx.fillStyle = `rgba(0,0,0,${opacity * 0.08})`;
    for (let x = minX + 4; x < maxX; x += stepSmall) {
        for (let y = minY + 4; y < maxY; y += stepSmall) {
            const offX = ((x * 17 + y * 7) % stepSmall) - stepSmall / 2;
            const offY = ((x * 3 + y * 19) % stepSmall) - stepSmall / 2;
            const px = x + offX * 0.4;
            const py = y + offY * 0.4;
            const r = 0.4 + ((px * 23 + py * 11) % 3) * 0.2;
            ctx.beginPath();
            ctx.arc(px, py, r, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    ctx.restore();
}

// --- Mini 3D Çizimler (Liste İkonları) ---

function drawMiniBox(ctx, W, H, en, boy, kalinlik) {
    const w = en || 10;
    const h = kalinlik || 10;
    const d = boy || 10;

    const isoBoundW = (w + d) * COS30;
    const isoBoundH = h + (w + d) * SIN30;
    const pad = 6;
    const scale = Math.min((W - pad) / isoBoundW, (H - pad) / isoBoundH, 3);

    function rawProj(x, y, z) {
        return {
            x: (x - z) * COS30 * scale,
            y: -y * scale + (x + z) * SIN30 * scale
        };
    }

    const rawPts = [
        rawProj(0,0,0), rawProj(w,0,0), rawProj(w,h,0), rawProj(0,h,0),
        rawProj(0,0,d), rawProj(w,0,d), rawProj(w,h,d), rawProj(0,h,d)
    ];
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    rawPts.forEach(p => { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); });
    const offsetX = W / 2 - (minX + maxX) / 2;
    const offsetY = H / 2 - (minY + maxY) / 2;

    function proj(x, y, z) {
        const r = rawProj(x, y, z);
        return { x: r.x + offsetX, y: r.y + offsetY };
    }

    const v = {
        fbl: proj(0,0,0), fbr: proj(w,0,0), ftr: proj(w,h,0), ftl: proj(0,h,0),
        bbl: proj(0,0,d), bbr: proj(w,0,d), btr: proj(w,h,d), btl: proj(0,h,d)
    };

    const EDGE_COLOR = '#6B4E0A';
    const EDGE_WIDTH = 1.2;

    // Sol yüz (Z=d): btl, btr, bbr, bbl
    ctx.beginPath();
    ctx.moveTo(v.btl.x, v.btl.y);
    ctx.lineTo(v.btr.x, v.btr.y);
    ctx.lineTo(v.bbr.x, v.bbr.y);
    ctx.lineTo(v.bbl.x, v.bbl.y);
    ctx.closePath();
    const leftGrad = ctx.createLinearGradient(v.btl.x, v.btl.y, v.bbr.x, v.bbr.y);
    leftGrad.addColorStop(0, '#FFE260');
    leftGrad.addColorStop(1, '#E0BC28');
    ctx.fillStyle = leftGrad;
    ctx.fill();
    ctx.strokeStyle = EDGE_COLOR;
    ctx.lineWidth = EDGE_WIDTH;
    ctx.lineJoin = 'miter';
    ctx.stroke();

    // Sağ yüz (X=w): ftr, btr, bbr, fbr
    ctx.beginPath();
    ctx.moveTo(v.ftr.x, v.ftr.y);
    ctx.lineTo(v.btr.x, v.btr.y);
    ctx.lineTo(v.bbr.x, v.bbr.y);
    ctx.lineTo(v.fbr.x, v.fbr.y);
    ctx.closePath();
    const rightGrad = ctx.createLinearGradient(v.fbr.x, v.ftr.y, v.bbr.x, v.bbr.y);
    rightGrad.addColorStop(0, '#E8B830');
    rightGrad.addColorStop(1, '#B89018');
    ctx.fillStyle = rightGrad;
    ctx.fill();
    ctx.strokeStyle = EDGE_COLOR;
    ctx.lineWidth = EDGE_WIDTH;
    ctx.lineJoin = 'miter';
    ctx.stroke();

    // Üst yüz (Y=h): ftl, ftr, btr, btl
    ctx.beginPath();
    ctx.moveTo(v.ftl.x, v.ftl.y);
    ctx.lineTo(v.ftr.x, v.ftr.y);
    ctx.lineTo(v.btr.x, v.btr.y);
    ctx.lineTo(v.btl.x, v.btl.y);
    ctx.closePath();
    const topGrad = ctx.createLinearGradient(v.btl.x, v.btl.y, v.ftr.x, v.ftr.y);
    topGrad.addColorStop(0, '#FFF0A0');
    topGrad.addColorStop(0.5, '#FFE460');
    topGrad.addColorStop(1, '#FFD93D');
    ctx.fillStyle = topGrad;
    ctx.fill();
    ctx.strokeStyle = EDGE_COLOR;
    ctx.lineWidth = EDGE_WIDTH;
    ctx.lineJoin = 'miter';
    ctx.stroke();

    // Dış siluet
    ctx.save();
    ctx.strokeStyle = EDGE_COLOR;
    ctx.lineWidth = EDGE_WIDTH;
    ctx.lineJoin = 'miter';
    ctx.lineCap = 'square';
    ctx.beginPath();
    ctx.moveTo(v.ftl.x, v.ftl.y);
    ctx.lineTo(v.ftr.x, v.ftr.y);
    ctx.lineTo(v.fbr.x, v.fbr.y);
    ctx.lineTo(v.bbr.x, v.bbr.y);
    ctx.lineTo(v.bbl.x, v.bbl.y);
    ctx.lineTo(v.btl.x, v.btl.y);
    ctx.closePath();
    ctx.stroke();

    // İç kenarlar (btr merkezi)
    drawLine(ctx, v.btr, v.btl);
    drawLine(ctx, v.btr, v.ftr);
    drawLine(ctx, v.btr, v.bbr);
    ctx.restore();

    // Kenar parlama
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(v.ftl.x + 2, v.ftl.y);
    ctx.lineTo(v.ftr.x - 2, v.ftr.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(v.ftl.x - 2, v.ftl.y);
    ctx.lineTo(v.btl.x + 2, v.btl.y);
    ctx.stroke();
    ctx.restore();
}

function drawMiniCylinder(ctx, W, H, en, kalinlik, ruloBoyu, vakum) {
    const enVal = en || 20;
    const kalVal = kalinlik || 2;
    const boyVal = (ruloBoyu || 1) * 100;

    const outerRNormal = Math.sqrt(kalVal * boyVal / Math.PI);
    const vak = vakum || 0;
    const outerR = outerRNormal * (1 - vak / 100);
    const cylLen = enVal;

    const perspDepth = outerR * 0.5;
    const totalW = cylLen + perspDepth;
    const totalH = outerR * 2;

    const pad = 6;
    const scale = Math.min((W - pad) / totalW, (H - pad) / totalH, 3);

    const sR = outerR * scale;
    const sLen = cylLen * scale;
    const ellipseRx = sR * 0.4;
    const ellipseRy = sR;

    const drawW = sLen + ellipseRx * 2;
    const cx = W / 2;
    const cy = H / 2;
    const leftX = cx - drawW / 2 + ellipseRx;
    const rightX = leftX + sLen;

    // Gövde
    ctx.beginPath();
    ctx.moveTo(leftX, cy - sR);
    ctx.lineTo(rightX, cy - sR);
    ctx.ellipse(rightX, cy, ellipseRx, ellipseRy, 0, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(leftX, cy + sR);
    ctx.ellipse(leftX, cy, ellipseRx, ellipseRy, 0, Math.PI / 2, -Math.PI / 2);
    ctx.closePath();

    const bodyGrad = ctx.createLinearGradient(0, cy - sR, 0, cy + sR);
    bodyGrad.addColorStop(0, '#FFF5B0');
    bodyGrad.addColorStop(0.3, '#FFE870');
    bodyGrad.addColorStop(0.7, '#ECC840');
    bodyGrad.addColorStop(1, '#D4B028');
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(80,60,10,0.12)';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Sağ elips
    ctx.beginPath();
    ctx.ellipse(rightX, cy, ellipseRx, ellipseRy, 0, 0, Math.PI * 2);
    const faceGrad = ctx.createRadialGradient(rightX - ellipseRx * 0.2, cy - ellipseRy * 0.15, 0, rightX, cy, ellipseRy);
    faceGrad.addColorStop(0, '#FFF8C0');
    faceGrad.addColorStop(0.5, '#FFE870');
    faceGrad.addColorStop(1, '#D4B428');
    ctx.fillStyle = faceGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(80,60,10,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Üst parlama
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(leftX + 2, cy - sR + 0.5);
    ctx.lineTo(rightX - 2, cy - sR + 0.5);
    ctx.stroke();
    ctx.restore();
}

function drawMiniCylinderDirect(ctx, W, H, cylLen, outerR) {
    const perspDepth = outerR * 0.5;
    const totalW = cylLen + perspDepth;
    const totalH = outerR * 2;
    const pad = 6;
    const scale = Math.min((W - pad) / totalW, (H - pad) / totalH, 3);
    const sR = outerR * scale;
    const sLen = cylLen * scale;
    const ellipseRx = sR * 0.4;
    const ellipseRy = sR;
    const drawW = sLen + ellipseRx * 2;
    const cx = W / 2;
    const cy = H / 2;
    const leftX = cx - drawW / 2 + ellipseRx;
    const rightX = leftX + sLen;
    ctx.save();

    // Gövde (sol elips eğrisi dahil tek parça)
    ctx.beginPath();
    ctx.moveTo(leftX, cy - ellipseRy);
    ctx.lineTo(rightX, cy - ellipseRy);
    ctx.ellipse(rightX, cy, ellipseRx, ellipseRy, 0, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(leftX, cy + ellipseRy);
    ctx.ellipse(leftX, cy, ellipseRx, ellipseRy, 0, Math.PI / 2, -Math.PI / 2);
    ctx.closePath();

    const bodyGrad = ctx.createLinearGradient(leftX, cy - sR, leftX, cy + sR);
    bodyGrad.addColorStop(0, '#D4A017');
    bodyGrad.addColorStop(0.3, '#FFD54F');
    bodyGrad.addColorStop(0.55, '#FFF176');
    bodyGrad.addColorStop(0.7, '#FFD54F');
    bodyGrad.addColorStop(1, '#C49000');
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(80,60,10,0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Üst parlama
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(leftX + 2, cy - ellipseRy + 0.5);
    ctx.lineTo(rightX - 2, cy - ellipseRy + 0.5);
    ctx.stroke();

    // Sağ yüz (ön elips)
    const faceGrad = ctx.createRadialGradient(rightX - ellipseRx * 0.2, cy - ellipseRy * 0.2, 0, rightX, cy, Math.max(ellipseRx, ellipseRy));
    faceGrad.addColorStop(0, '#FFF9C4');
    faceGrad.addColorStop(0.5, '#FFE870');
    faceGrad.addColorStop(1, '#D4B428');
    ctx.beginPath();
    ctx.ellipse(rightX, cy, ellipseRx, ellipseRy, 0, 0, Math.PI * 2);
    ctx.fillStyle = faceGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(80,60,10,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
}

function drawMiniPreview(canvas, item, size = 56) {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    if (item.tip === 'plaka') {
        drawMiniBox(ctx, size, size, item.en, item.boy, item.kalinlik);
    } else if (item.tip === 'rollpack') {
        // Rollpack: rulo süngerin kendi görseli ile çiz
        const capVal = item.cap || 20;
        const outerR = capVal / 2;
        const enVal = item.en || 20;
        drawMiniCylinderDirect(ctx, size, size, enVal, outerR);
    } else {
        drawMiniCylinder(ctx, size, size, item.en, item.kalinlik, item.ruloBoyu, item.vakum || 0);
    }
}

function renderTypeTotalIcons() {
    const plakaCanvas = document.getElementById('plaka-total-icon');
    const ruloCanvas = document.getElementById('rulo-total-icon');

    if (plakaCanvas) {
        drawMiniPreview(plakaCanvas, { tip: 'plaka', en: 40, boy: 40, kalinlik: 8 }, 18);
    }

    if (ruloCanvas) {
        drawMiniPreview(ruloCanvas, { tip: 'rulo', en: 120, kalinlik: 2, ruloBoyu: 10, vakum: 0 }, 18);
    }
}

function renderTabIcons() {
    const tabRuloCanvas = document.getElementById('tab-rulo-canvas');
    const tabRollpackCanvas = document.getElementById('tab-rollpack-canvas');
    if (tabRuloCanvas) {
        drawMiniPreview(tabRuloCanvas, { tip: 'rulo', en: 120, kalinlik: 2, ruloBoyu: 10, vakum: 0 }, 28);
    }
    if (tabRollpackCanvas) {
        drawMiniPreview(tabRollpackCanvas, { tip: 'rulo', en: 120, kalinlik: 2, ruloBoyu: 10, vakum: 0 }, 28);
    }
}

function renderContainerTypeIcons() {
    document.querySelectorAll('.ct-icon-canvas').forEach(canvas => {
        const ctype = canvas.dataset.ctype;
        const dpr = window.devicePixelRatio || 1;
        const w = 120, h = 70;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        const ctx = canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);

        if (ctype === 'custom') {
            drawCustomContainerIcon(ctx, w, h);
        } else {
            const t = CONTAINER_TYPES[ctype];
            if (t) drawMiniContainerBox(ctx, w, h, t.uzunluk, t.genislik, t.yukseklik, ctype);
        }
    });
}

function drawMiniContainerBox(ctx, W, H, cl, cw, ch, ctype) {
    // ============================================================
    // Basit izometrik 3D kutu çizimi - 3 görünen yüz:
    //   ÜST (turuncu-altın), ÖN (turuncu-koyu), SAĞ (kahverengi)
    // ============================================================
    // Sabit oranlarla çiz (uzunluk:derinlik:yükseklik görsel olarak)
    // Konteyner gerçek oranlarını yansıt: uzun ve alçak dikdörtgen
    const ratio = cl / Math.max(cw, ch, 1);
    // Görsel kutu boyutları (piksel cinsinden)
    const boxW = W * 0.50;                                     // ön yüz genişliği
    const boxD = Math.max(W * 0.12, 10);                      // derinlik (üst/sağ)
    const boxH = Math.max(H * 0.28, 14);                      // yükseklik

    // İzometrik açı
    const ang = Math.PI / 7;  // ~25 derece
    const dx = Math.cos(ang) * boxD;
    const dy = Math.sin(ang) * boxD;

    // Kutunun merkeze oturması için offset hesapla
    const totalW = boxW + dx;
    const totalH = boxH + dy;
    const startX = (W - totalW) / 2;
    const startY = (H - totalH) / 2 + dy;

    // 8 köşe noktası (2D ekran koordinatları)
    // Ön yüz (z=0)
    const fbl = { x: startX,        y: startY + boxH };       // front-bottom-left
    const fbr = { x: startX + boxW, y: startY + boxH };       // front-bottom-right
    const ftr = { x: startX + boxW, y: startY };              // front-top-right
    const ftl = { x: startX,        y: startY };              // front-top-left
    // Arka yüz (z=derinlik) - sağa ve yukarı kaydır
    const bbl = { x: fbl.x + dx, y: fbl.y - dy };
    const bbr = { x: fbr.x + dx, y: fbr.y - dy };
    const btr = { x: ftr.x + dx, y: ftr.y - dy };
    const btl = { x: ftl.x + dx, y: ftl.y - dy };

    function lerp(a, b, t) { return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }; }

    // Renkler
    const topFill = '#e6950a';
    const topDark = '#c6800a';
    const frontFill = '#c2410c';
    const frontDark = '#9a3412';
    const sideFill = '#92400e';
    const sideDark = '#78350f';

    // === 1. ÜST YÜZ (ftl → ftr → btr → btl) ===
    ctx.beginPath();
    ctx.moveTo(ftl.x, ftl.y);
    ctx.lineTo(ftr.x, ftr.y);
    ctx.lineTo(btr.x, btr.y);
    ctx.lineTo(btl.x, btl.y);
    ctx.closePath();
    const tGrd = ctx.createLinearGradient(ftl.x, ftl.y, btr.x, btr.y);
    tGrd.addColorStop(0, topFill);
    tGrd.addColorStop(1, topDark);
    ctx.fillStyle = tGrd;
    ctx.fill();
    // Üst yüz oluk çizgileri
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 0.5;
    for (let i = 1; i <= 4; i++) {
        const t = i / 5;
        const a = lerp(ftl, btl, t), b = lerp(ftr, btr, t);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }

    // === 2. ÖN YÜZ (fbl → fbr → ftr → ftl) ===
    ctx.beginPath();
    ctx.moveTo(fbl.x, fbl.y);
    ctx.lineTo(fbr.x, fbr.y);
    ctx.lineTo(ftr.x, ftr.y);
    ctx.lineTo(ftl.x, ftl.y);
    ctx.closePath();
    const fGrd = ctx.createLinearGradient(fbl.x, fbl.y, fbr.x, fbl.y);
    fGrd.addColorStop(0, frontFill);
    fGrd.addColorStop(1, frontDark);
    ctx.fillStyle = fGrd;
    ctx.fill();
    // Ön yüz dikey oluk çizgileri
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 0.4;
    const steps = Math.max(5, Math.round(boxW / 8));
    for (let i = 1; i < steps; i++) {
        const t = i / steps;
        const top = lerp(ftl, ftr, t), bot = lerp(fbl, fbr, t);
        ctx.beginPath(); ctx.moveTo(top.x, top.y); ctx.lineTo(bot.x, bot.y); ctx.stroke();
    }

    // === 3. SAĞ YÜZ (fbr → bbr → btr → ftr) ===
    ctx.beginPath();
    ctx.moveTo(fbr.x, fbr.y);
    ctx.lineTo(bbr.x, bbr.y);
    ctx.lineTo(btr.x, btr.y);
    ctx.lineTo(ftr.x, ftr.y);
    ctx.closePath();
    const rGrd = ctx.createLinearGradient(fbr.x, fbr.y, bbr.x, bbr.y);
    rGrd.addColorStop(0, sideFill);
    rGrd.addColorStop(1, sideDark);
    ctx.fillStyle = rGrd;
    ctx.fill();
    // Sağ yüz: kapı çizgileri
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 0.6;
    const mid = lerp(fbr, bbr, 0.5);
    const midT = lerp(ftr, btr, 0.5);
    ctx.beginPath(); ctx.moveTo(mid.x, mid.y); ctx.lineTo(midT.x, midT.y); ctx.stroke();

    // === 4. TÜM KENAR ÇİZGİLERİ ===
    ctx.strokeStyle = 'rgba(100,40,10,0.7)';
    ctx.lineWidth = 1;
    // Üst kenarlar
    ctx.beginPath();
    ctx.moveTo(ftl.x, ftl.y); ctx.lineTo(ftr.x, ftr.y);
    ctx.lineTo(btr.x, btr.y); ctx.lineTo(btl.x, btl.y);
    ctx.closePath(); ctx.stroke();
    // Ön kenarlar
    ctx.beginPath();
    ctx.moveTo(fbl.x, fbl.y); ctx.lineTo(fbr.x, fbr.y);
    ctx.lineTo(ftr.x, ftr.y); ctx.lineTo(ftl.x, ftl.y);
    ctx.closePath(); ctx.stroke();
    // Sağ kenarlar
    ctx.beginPath();
    ctx.moveTo(fbr.x, fbr.y); ctx.lineTo(bbr.x, bbr.y);
    ctx.lineTo(btr.x, btr.y); ctx.lineTo(ftr.x, ftr.y);
    ctx.closePath(); ctx.stroke();

    // === 5. KÖŞE KİLİTLERİ ===
    ctx.fillStyle = '#fef3c7';
    ctx.strokeStyle = 'rgba(100,40,10,0.5)';
    ctx.lineWidth = 0.6;
    const cs = 2.2;
    [ftl, ftr, fbl, fbr, btr, btl].forEach(c => {
        ctx.beginPath();
        ctx.arc(c.x, c.y, cs, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
    });
}

function drawCustomContainerIcon(ctx, W, H) {
    const cx = W / 2, cy = H / 2;
    const COS30 = Math.cos(Math.PI / 6);
    const SIN30 = Math.sin(Math.PI / 6);

    // Küçük izometrik kutu (noktalı çizgi)
    const s = 3.2;
    const bx = cx - 6, by = cy + 4;
    function bp(x, y, z) {
        return { x: bx + (x - z) * COS30 * s, y: by + (-y + (x + z) * SIN30) * s };
    }
    function blerp(a, b, t) { return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }; }
    const cl = 5, cw = 3, ch = 3.5;
    const fbl = bp(0,0,0), fbr = bp(cl,0,0), ftr = bp(cl,ch,0), ftl = bp(0,ch,0);
    const bbl = bp(0,0,cw), bbr = bp(cl,0,cw), btr = bp(cl,ch,cw), btl = bp(0,ch,cw);

    // Üst yüz (açık gri fill)
    ctx.save();
    ctx.setLineDash([2, 2]);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 0.7;
    ctx.fillStyle = 'rgba(100,116,139,0.08)';
    ctx.beginPath();
    ctx.moveTo(ftl.x, ftl.y); ctx.lineTo(ftr.x, ftr.y); ctx.lineTo(btr.x, btr.y); ctx.lineTo(btl.x, btl.y);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // Ön yüz
    ctx.fillStyle = 'rgba(100,116,139,0.12)';
    ctx.beginPath();
    ctx.moveTo(fbl.x, fbl.y); ctx.lineTo(fbr.x, fbr.y); ctx.lineTo(ftr.x, ftr.y); ctx.lineTo(ftl.x, ftl.y);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // Sağ yüz
    ctx.fillStyle = 'rgba(100,116,139,0.06)';
    ctx.beginPath();
    ctx.moveTo(fbr.x, fbr.y); ctx.lineTo(bbr.x, bbr.y); ctx.lineTo(btr.x, btr.y); ctx.lineTo(ftr.x, ftr.y);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();

    // Ölçü okları (boyut çizgileri)
    ctx.save();
    ctx.strokeStyle = '#3b82f6';
    ctx.fillStyle = '#3b82f6';
    ctx.lineWidth = 0.7;
    // Alt kenar (uzunluk oku)
    const arrB1 = { x: fbl.x, y: fbl.y + 5 };
    const arrB2 = { x: fbr.x, y: fbr.y + 5 };
    ctx.beginPath(); ctx.moveTo(arrB1.x, arrB1.y); ctx.lineTo(arrB2.x, arrB2.y); ctx.stroke();
    // Ok uçları
    ctx.beginPath(); ctx.moveTo(arrB1.x, arrB1.y - 1.5); ctx.lineTo(arrB1.x, arrB1.y + 1.5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(arrB2.x, arrB2.y - 1.5); ctx.lineTo(arrB2.x, arrB2.y + 1.5); ctx.stroke();
    // Sağ kenar (yükseklik oku)
    const arrR1 = { x: fbr.x + 4, y: fbr.y };
    const arrR2 = { x: ftr.x + 4, y: ftr.y };
    ctx.beginPath(); ctx.moveTo(arrR1.x, arrR1.y); ctx.lineTo(arrR2.x, arrR2.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(arrR1.x - 1.5, arrR1.y); ctx.lineTo(arrR1.x + 1.5, arrR1.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(arrR2.x - 1.5, arrR2.y); ctx.lineTo(arrR2.x + 1.5, arrR2.y); ctx.stroke();
    ctx.restore();

    // Kalem ikonu (sağ üst)
    ctx.save();
    ctx.translate(cx + 16, cy - 12);
    ctx.rotate(-0.55);
    // Gövde
    const pw = 3.5, ph = 16;
    const bodyGrd = ctx.createLinearGradient(-pw/2, -ph/2, pw/2, -ph/2);
    bodyGrd.addColorStop(0, '#f97316'); bodyGrd.addColorStop(0.5, '#fb923c'); bodyGrd.addColorStop(1, '#ea580c');
    ctx.fillStyle = bodyGrd;
    roundRectFill(ctx, -pw/2, -ph/2, pw, ph, 0.8);
    // Silgi bandı
    ctx.fillStyle = '#fbbf24';
    roundRectFill(ctx, -pw/2, -ph/2, pw, 3.5, 0.8);
    // Silgi
    ctx.fillStyle = '#fca5a5';
    roundRectFill(ctx, -pw/2 + 0.3, -ph/2 + 0.3, pw - 0.6, 2.2, 0.5);
    // Metal bant
    ctx.fillStyle = '#a8a29e';
    ctx.fillRect(-pw/2, -ph/2 + 3, pw, 1.2);
    // Uç
    ctx.beginPath();
    ctx.moveTo(-pw/2, ph/2); ctx.lineTo(pw/2, ph/2); ctx.lineTo(0, ph/2 + 5);
    ctx.closePath();
    ctx.fillStyle = '#fde68a'; ctx.fill();
    // Uç sivri nokta
    ctx.beginPath();
    ctx.moveTo(-0.8, ph/2 + 3.5); ctx.lineTo(0.8, ph/2 + 3.5); ctx.lineTo(0, ph/2 + 5.5);
    ctx.closePath();
    ctx.fillStyle = '#1e293b'; ctx.fill();
    ctx.restore();
}

function roundRectFill(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath(); ctx.fill();
}

function renderInputCardIcons() {
    const plakaCanvas = document.getElementById('plaka-input-icon');
    const ruloCanvas = document.getElementById('rulo-input-icon');
    const rollpackCanvas = document.getElementById('rollpack-input-icon');

    if (plakaCanvas) {
        drawMiniPreview(plakaCanvas, { tip: 'plaka', en: 40, boy: 40, kalinlik: 8 }, 20);
    }

    if (ruloCanvas) {
        drawMiniPreview(ruloCanvas, { tip: 'rulo', en: 120, kalinlik: 2, ruloBoyu: 10, vakum: 0 }, 20);
    }

    if (rollpackCanvas) {
        drawMiniPreview(rollpackCanvas, { tip: 'rulo', en: 120, kalinlik: 2, ruloBoyu: 10, vakum: 0 }, 20);
    }
}

function drawPlaceholder(ctx, W, H, icon, text) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // İkon
    ctx.font = '48px sans-serif';
    ctx.fillText(icon, W / 2, H / 2 - 20);

    // Metin
    ctx.font = '13px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#b2bec3';
    ctx.fillText(text, W / 2, H / 2 + 25);

    ctx.restore();
}

function drawDimLabel(ctx, x, y, text, color) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, sans-serif';

    // Arka plan
    const metrics = ctx.measureText(text);
    const tw = metrics.width + 10;
    const th = 18;

    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.beginPath();
    roundRect(ctx, x - tw / 2, y - th / 2, tw, th, 4);
    ctx.fill();
    ctx.strokeStyle = color + '40';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Metin
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);

    ctx.restore();
}

function drawArrowHead(ctx, fromX, fromY, toX, toY, color) {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);
    const len = 6;
    const spread = Math.PI / 5;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(fromX + len * Math.cos(angle + spread), fromY + len * Math.sin(angle + spread));
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(fromX + len * Math.cos(angle - spread), fromY + len * Math.sin(angle - spread));
    ctx.stroke();
    ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
}

// ==========================================
// LİSTE YÖNETİMİ
// ==========================================

function setupButtons() {
    document.getElementById('btn-add').addEventListener('click', addToList);
    document.getElementById('btn-cancel-edit').addEventListener('click', cancelEdit);
    document.getElementById('btn-share').addEventListener('click', shareList);
    document.getElementById('btn-clear').addEventListener('click', clearList);
    setupInstallGuide();
}

function setupInstallGuide() {
    const overlay = document.getElementById('install-guide-overlay');
    const btnOpen = document.getElementById('btn-install-guide');
    const btnClose = document.getElementById('guide-close');

    // Aç
    btnOpen.addEventListener('click', () => {
        overlay.classList.add('active');
    });

    // Kapat - X butonu
    btnClose.addEventListener('click', () => {
        overlay.classList.remove('active');
    });

    // Kapat - overlay'e tıklama
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.classList.remove('active');
        }
    });

    // Tab geçişleri
    document.querySelectorAll('.guide-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.guide;
            document.querySelectorAll('.guide-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.guide-panel').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById('guide-' + target).classList.add('active');
        });
    });
}

function editItem(id) {
    const item = itemList.find(i => i.id === id);
    if (!item) return;

    editingId = id;

    // Doğru tab'a geç
    switchTab(item.tip);

    // Input'ları doldur
    if (item.tip === 'plaka') {
        document.getElementById('plaka-en').value = item.en;
        document.getElementById('plaka-boy').value = item.boy;
        document.getElementById('plaka-kalinlik').value = item.kalinlik;
        document.getElementById('plaka-adet').value = item.adet;
    } else if (item.tip === 'rollpack') {
        document.getElementById('rollpack-en').value = item.en;
        document.getElementById('rollpack-cap').value = item.cap;
        document.getElementById('rollpack-paket-adet').value = item.paketAdet;
        document.getElementById('rollpack-urun-en').value = item.urunEn || '';
        document.getElementById('rollpack-urun-boy').value = item.urunBoy || '';
        document.getElementById('rollpack-urun-yukseklik').value = item.urunYukseklik || '';
        document.getElementById('rollpack-urun-adet').value = item.urunAdet || 1;
    } else {
        document.getElementById('rulo-en').value = item.en;
        document.getElementById('rulo-kalinlik').value = item.kalinlik;
        document.getElementById('rulo-boyu').value = item.ruloBoyu;
        document.getElementById('rulo-adet').value = item.adet;
        document.getElementById('rulo-vakum').value = item.vakum || 0;
    }

    // Hesapla ve 3D güncelle
    calculate();
    render3D();

    // Buton metnini güncelle
    const btnAdd = document.getElementById('btn-add');
    const btnAddSpan = btnAdd.querySelector('[data-i18n]');
    if (btnAddSpan) btnAddSpan.textContent = t('btnUpdate');
    else btnAdd.textContent = t('btnUpdate');
    btnAdd.disabled = false;
    btnAdd.classList.add('editing');
    document.getElementById('btn-cancel-edit').style.display = '';
    document.querySelector('.result-card').classList.add('editing-mode');

    // Düzenlenen öğeyi listede vurgula
    updateListUI();

    // Yukarı kaydır
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelEdit() {
    editingId = null;
    const btnAdd = document.getElementById('btn-add');
    const btnAddSpan = btnAdd.querySelector('[data-i18n]');
    if (btnAddSpan) btnAddSpan.textContent = t('btnAdd');
    else btnAdd.textContent = t('btnAdd');
    btnAdd.classList.remove('editing');
    document.getElementById('btn-cancel-edit').style.display = 'none';
    document.querySelector('.result-card').classList.remove('editing-mode');
    updateListUI();
    calculate();
}

function addToList() {
    let item = null;

    if (activeTab === 'plaka') {
        const en = parseFloat(document.getElementById('plaka-en').value) || 0;
        const boy = parseFloat(document.getElementById('plaka-boy').value) || 0;
        const kalinlik = parseFloat(document.getElementById('plaka-kalinlik').value) || 0;
        const adet = parseInt(document.getElementById('plaka-adet').value) || 1;

        if (en <= 0 || boy <= 0 || kalinlik <= 0) return;

        const hacimCm3 = en * boy * kalinlik;
        const birimM3 = hacimCm3 / 1000000;

        item = {
            id: editingId || nextId++,
            tip: 'plaka',
            en, boy, kalinlik, adet,
            birimM3,
            toplamM3: birimM3 * adet,
            dims: `${en} × ${boy} × ${kalinlik} cm`
        };
    } else if (activeTab === 'rulo') {
        const en = parseFloat(document.getElementById('rulo-en').value) || 0;
        const kalinlik = parseFloat(document.getElementById('rulo-kalinlik').value) || 0;
        const ruloBoyu = parseFloat(document.getElementById('rulo-boyu').value) || 0;
        const adet = parseInt(document.getElementById('rulo-adet').value) || 1;

        if (en <= 0 || kalinlik <= 0 || ruloBoyu <= 0) return;

        const ruloBoyuCm = ruloBoyu * 100;
        const hacimCm3 = en * kalinlik * ruloBoyuCm;
        const birimM3 = hacimCm3 / 1000000;
        const vakum = parseFloat(document.getElementById('rulo-vakum').value) || 0;
        const capNormal = Math.sqrt(kalinlik * ruloBoyuCm / Math.PI) * 2;
        const capVakumlu = vakum > 0 ? capNormal * (1 - vakum / 100) : capNormal;

        let dimsText = `${en} cm × ${kalinlik} cm × ${ruloBoyu} m`;
        if (vakum > 0) {
            dimsText += ` | Vakum %${vakum} (Çap: ${capVakumlu.toFixed(1)} cm)`;
        }

        item = {
            id: editingId || nextId++,
            tip: 'rulo',
            en, kalinlik, ruloBoyu, adet, vakum,
            birimM3,
            toplamM3: birimM3 * adet,
            dims: dimsText
        };
    } else if (activeTab === 'rollpack') {
        const en = parseFloat(document.getElementById('rollpack-en').value) || 0;
        const cap = parseFloat(document.getElementById('rollpack-cap').value) || 0;
        const paketAdet = parseInt(document.getElementById('rollpack-paket-adet').value) || 1;
        const urunEn = parseFloat(document.getElementById('rollpack-urun-en').value) || 0;
        const urunBoy = parseFloat(document.getElementById('rollpack-urun-boy').value) || 0;
        const urunYukseklik = parseFloat(document.getElementById('rollpack-urun-yukseklik').value) || 0;
        const urunAdet = parseInt(document.getElementById('rollpack-urun-adet').value) || 1;

        if (en <= 0 || cap <= 0) return;

        const r = cap / 2;
        const birimHacimCm3 = Math.PI * r * r * en;
        const birimM3 = birimHacimCm3 / 1000000;
        const rollpackToplamM3 = birimM3 * paketAdet;

        // Ürün: her pakette urunAdet adet var → toplam = paketAdet × urunAdet
        let urunBirimM3 = 0;
        let urunToplamM3 = 0;
        let toplamUrunSayisi = 0;
        if (urunEn > 0 && urunBoy > 0 && urunYukseklik > 0) {
            urunBirimM3 = (urunEn * urunBoy * urunYukseklik) / 1000000;
            toplamUrunSayisi = paketAdet * urunAdet;
            urunToplamM3 = urunBirimM3 * toplamUrunSayisi;
        }

        const toplamAdet = toplamUrunSayisi > 0 ? toplamUrunSayisi : paketAdet;

        let dimsText = t('rollpackDims', { en: en, cap: cap, paket: paketAdet });
        if (urunToplamM3 > 0) {
            dimsText += ` + ${t('urunLabel')}: ${urunEn}×${urunBoy}×${urunYukseklik} cm × ${toplamUrunSayisi} (${paketAdet}×${urunAdet})`;
        }

        item = {
            id: editingId || nextId++,
            tip: 'rollpack',
            en, cap, paketAdet,
            urunEn, urunBoy, urunYukseklik, urunAdet,
            adet: toplamAdet,
            birimM3,
            rollpackM3: rollpackToplamM3,
            urunToplamM3: urunToplamM3,
            toplamM3: rollpackToplamM3,
            dims: dimsText
        };
    }

    if (item) {
        if (editingId) {
            // Güncelleme modu: mevcut öğeyi değiştir
            const idx = itemList.findIndex(i => i.id === editingId);
            if (idx !== -1) itemList[idx] = item;
            editingId = null;
            const btnAdd = document.getElementById('btn-add');
            const btnAddSpan = btnAdd.querySelector('[data-i18n]');
            if (btnAddSpan) btnAddSpan.textContent = t('btnAdd');
            else btnAdd.textContent = t('btnAdd');
            btnAdd.classList.remove('editing');
            document.getElementById('btn-cancel-edit').style.display = 'none';
            document.querySelector('.result-card').classList.remove('editing-mode');
            showToast(t('toastUpdated'));
        } else {
            // Yeni ekleme modu
            itemList.push(item);
            showToast(t('toastAdded'));
        }
        saveList();
        updateListUI();

        // Listeye scroll
        setTimeout(() => {
            const listEl = document.getElementById('item-list');
            listEl.scrollTop = listEl.scrollHeight;
        }, 100);
    }
}

function removeFromList(id) {
    if (editingId === id) cancelEdit();
    itemList = itemList.filter(item => item.id !== id);
    saveList();
    updateListUI();
    showToast(t('toastDeleted'));
}

function clearList() {
    if (itemList.length === 0) return;

    const overlay = document.getElementById('confirm-overlay');
    overlay.classList.add('show');

    const okBtn = document.getElementById('confirm-ok');
    const cancelBtn = document.getElementById('confirm-cancel');

    function close() {
        overlay.classList.remove('show');
        okBtn.removeEventListener('click', onOk);
        cancelBtn.removeEventListener('click', onCancel);
        overlay.removeEventListener('click', onOverlay);
    }

    function onOk() {
        itemList = [];
        saveList();
        updateListUI();
        showToast(t('toastCleared'));
        close();
    }

    function onCancel() { close(); }
    function onOverlay(e) { if (e.target === overlay) close(); }

    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
    overlay.addEventListener('click', onOverlay);
}

function updateListUI() {
    const listEl = document.getElementById('item-list');
    const emptyEl = document.getElementById('empty-list');
    const footerEl = document.getElementById('list-footer');
    const countEl = document.getElementById('item-count');
    const totalVolEl = document.getElementById('total-volume');
    const summaryEl = document.getElementById('total-summary');

    if (itemList.length === 0) {
        listEl.innerHTML = '';
        listEl.appendChild(createEmptyState());
        footerEl.classList.remove('visible');
        countEl.textContent = t('itemCount', { n: 0 });
        return;
    }

    // Liste elemanlarını oluştur
    listEl.innerHTML = '';
    itemList.forEach((item, index) => {
        const el = createListItem(item, index + 1);
        listEl.appendChild(el);
    });

    // Footer göster
    footerEl.classList.add('visible');

    // Toplamları hesapla
    const toplamKalem = itemList.length;
    const toplamAdet = itemList.reduce((sum, item) => sum + item.adet, 0);
    const toplamM3 = itemList.reduce((sum, item) => sum + item.toplamM3, 0);

    // Plaka ve Rulo ayrı toplamlar
    const plakaM3 = itemList.filter(i => i.tip === 'plaka').reduce((sum, i) => sum + i.toplamM3, 0);
    const ruloM3 = itemList.filter(i => i.tip === 'rulo' || i.tip === 'rollpack').reduce((sum, i) => sum + i.toplamM3, 0);
    const hasPl = itemList.some(i => i.tip === 'plaka');
    const hasRu = itemList.some(i => i.tip === 'rulo' || i.tip === 'rollpack');

    countEl.textContent = t('itemCount', { n: toplamKalem });
    summaryEl.textContent = t('summary', { k: toplamKalem, a: toplamAdet });
    totalVolEl.textContent = formatVolume(toplamM3) + ' m³';

    // Plaka/Rulo ayrı toplam göster
    const typeTotalsEl = document.getElementById('type-totals');
    const plakaTotalEl = document.getElementById('plaka-total');
    const ruloTotalEl = document.getElementById('rulo-total');
    if (typeTotalsEl) {
        if (hasPl || hasRu) {
            typeTotalsEl.style.display = '';
            plakaTotalEl.textContent = formatVolume(plakaM3) + ' m³';
            ruloTotalEl.textContent = formatVolume(ruloM3) + ' m³';
            plakaTotalEl.parentElement.style.display = hasPl ? '' : 'none';
            ruloTotalEl.parentElement.style.display = hasRu ? '' : 'none';
        } else {
            typeTotalsEl.style.display = 'none';
        }
    }

    renderTypeTotalIcons();
}

function createEmptyState() {
    const div = document.createElement('div');
    div.className = 'empty-list';
    div.id = 'empty-list';
    div.innerHTML = `
        <span class="empty-icon">📭</span>
        <p>${t('emptyList')}</p>
        <p class="empty-hint">${t('emptyHint')}</p>
    `;
    return div;
}

function createListItem(item, index) {
    const div = document.createElement('div');
    div.className = 'list-item';

    const tipLabel = item.tip === 'plaka' ? t('tipPlaka') : item.tip === 'rollpack' ? t('tipRollpack') : t('tipRulo');

    // Mini canvas oluştur
    const iconDiv = document.createElement('div');
    iconDiv.className = 'item-icon';
    const miniCanvas = document.createElement('canvas');
    iconDiv.appendChild(miniCanvas);

    const infoDiv = document.createElement('div');
    infoDiv.className = 'item-info';
    let volumeHtml;
    if (item.tip === 'rollpack') {
        const rpM3 = item.rollpackM3 || item.toplamM3 || 0;
        const urM3 = item.urunToplamM3 || 0;
        volumeHtml = `
            <div class="item-volume-row"><span class="vol-label">${t('rollpackM3Label')}:</span> <strong>${formatVolume(rpM3)} m³</strong></div>
            ${urM3 > 0 ? `<div class="item-volume-row"><span class="vol-label">${t('urunM3Label')}:</span> <strong>${formatVolume(urM3)} m³</strong></div>` : ''}
        `;
    } else {
        volumeHtml = `
            <div class="item-volume">
                ${formatVolume(item.toplamM3)} m³
                ${item.adet > 1 ? `<span class="item-unit-vol">(${t('birimLabel')}: ${formatVolume(item.birimM3)} m³)</span>` : ''}
            </div>
        `;
    }

    infoDiv.innerHTML = `
        <div class="item-title">${index}. ${tipLabel}</div>
        <div class="item-dims">${item.dims} | ${item.adet} ${t('adetLabel')}</div>
        ${volumeHtml}
    `;

    // Buton grubu
    const btnGroup = document.createElement('div');
    btnGroup.className = 'item-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'item-edit';
    editBtn.title = t('editTooltip');
    editBtn.innerHTML = '✏️';
    editBtn.onclick = function(e) { e.stopPropagation(); editItem(item.id); };

    const delBtn = document.createElement('button');
    delBtn.className = 'item-delete';
    delBtn.title = t('deleteTooltip');
    delBtn.textContent = '✕';
    delBtn.onclick = function(e) { e.stopPropagation(); removeFromList(item.id); };

    btnGroup.appendChild(editBtn);
    btnGroup.appendChild(delBtn);

    // Düzenleme modunda vurgula
    if (editingId === item.id) {
        div.classList.add('editing-highlight');
    }

    div.appendChild(iconDiv);
    div.appendChild(infoDiv);
    div.appendChild(btnGroup);

    // Canvas'a mini 3D çiz
    requestAnimationFrame(function() {
        drawMiniPreview(miniCanvas, item);
    });

    return div;
}

// ==========================================
// DEPOLAMA (localStorage)
// ==========================================

function saveList() {
    try {
        localStorage.setItem('sunger_list', JSON.stringify(itemList));
        localStorage.setItem('sunger_nextId', nextId.toString());
    } catch (e) {
        // localStorage dolu veya kullanılamıyor
    }
}

function loadList() {
    try {
        const saved = localStorage.getItem('sunger_list');
        const savedId = localStorage.getItem('sunger_nextId');
        if (saved) {
            itemList = JSON.parse(saved);
        }
        if (savedId) {
            nextId = parseInt(savedId);
        }
    } catch (e) {
        itemList = [];
        nextId = 1;
    }
    updateListUI();
}

// ==========================================
// PAYLAŞ
// ==========================================

function getShareText() {
    let text = t('shareTitle') + '\n';
    text += '═'.repeat(30) + '\n\n';

    itemList.forEach((item, index) => {
        const tipLabel = item.tip === 'plaka' ? t('tipPlaka') : item.tip === 'rollpack' ? t('tipRollpack') : t('tipRulo');
        text += `${index + 1}. ${tipLabel}\n`;
        text += `   ${t('shareOlcu')}: ${item.dims}\n`;
        text += `   ${t('adetLabel')}: ${item.adet}\n`;
        if (item.tip === 'rollpack' && (item.urunToplamM3 || 0) > 0) {
            text += `   ${t('rollpackM3Label')}: ${formatVolume(item.rollpackM3 || item.toplamM3)} m³\n`;
            text += `   ${t('urunM3Label')}: ${formatVolume(item.urunToplamM3)} m³\n`;
            text += `   ${t('shareToplam')}: ${formatVolume(item.toplamM3)} m³\n\n`;
        } else {
            if (item.adet > 1) {
                text += `   ${t('shareBirimHacim')}: ${formatVolume(item.birimM3)} m³\n`;
            }
            text += `   ${t('shareToplam')}: ${formatVolume(item.toplamM3)} m³\n\n`;
        }
    });

    const toplamAdet = itemList.reduce((sum, item) => sum + item.adet, 0);
    const toplamM3 = itemList.reduce((sum, item) => sum + item.toplamM3, 0);

    text += '═'.repeat(30) + '\n';
    text += t('shareTotalLine', { k: itemList.length, a: toplamAdet }) + '\n';
    text += t('shareTotalVolume', { v: formatVolume(toplamM3) }) + '\n';

    return text;
}

function shareList() {
    if (itemList.length === 0) {
        showToast(t('toastListEmpty'));
        return;
    }

    const text = getShareText();

    // Web Share API destekleniyorsa (mobil cihazlar)
    if (navigator.share) {
        navigator.share({
            title: t('shareListTitle'),
            text: text
        }).then(() => {
            showToast(t('toastShared'));
        }).catch((err) => {
            // Kullanıcı iptal ettiyse sessiz kal
            if (err.name !== 'AbortError') {
                showShareMenu(text);
            }
        });
    } else {
        // Masaüstü veya desteklemeyen tarayıcılar için özel menü
        showShareMenu(text);
    }
}

function showShareMenu(text) {
    // Varsa eski menüyü kaldır
    const existing = document.getElementById('share-menu-overlay');
    if (existing) existing.remove();

    const encodedText = encodeURIComponent(text);

    const overlay = document.createElement('div');
    overlay.id = 'share-menu-overlay';
    overlay.style.cssText = `
        position: fixed; inset: 0; z-index: 10000;
        background: rgba(0,0,0,0.5); display: flex;
        align-items: center; justify-content: center;
        animation: fadeIn 0.2s ease;
    `;

    const menu = document.createElement('div');
    menu.style.cssText = `
        background: #fff; border-radius: 16px; padding: 24px;
        min-width: 280px; max-width: 340px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;

    menu.innerHTML = `
        <div style="text-align:center; margin-bottom:18px;">
            <div style="font-size:24px; margin-bottom:6px;">📤</div>
            <div style="font-size:16px; font-weight:700; color:#333;">${t('shareMenuTitle')}</div>
        </div>
        <div id="share-buttons" style="display:flex; flex-direction:column; gap:10px;">
            <button class="share-btn" data-type="whatsapp" style="
                display:flex; align-items:center; gap:12px; padding:12px 16px;
                border:none; border-radius:12px; cursor:pointer; font-size:15px;
                font-weight:600; color:#fff; background:#25D366;
                transition: transform 0.15s, box-shadow 0.15s;
            ">
                <span style="font-size:22px;">💬</span> WhatsApp
            </button>
            <button class="share-btn" data-type="telegram" style="
                display:flex; align-items:center; gap:12px; padding:12px 16px;
                border:none; border-radius:12px; cursor:pointer; font-size:15px;
                font-weight:600; color:#fff; background:#0088cc;
                transition: transform 0.15s, box-shadow 0.15s;
            ">
                <span style="font-size:22px;">✈️</span> Telegram
            </button>
            <button class="share-btn" data-type="email" style="
                display:flex; align-items:center; gap:12px; padding:12px 16px;
                border:none; border-radius:12px; cursor:pointer; font-size:15px;
                font-weight:600; color:#fff; background:#EA4335;
                transition: transform 0.15s, box-shadow 0.15s;
            ">
                <span style="font-size:22px;">📧</span> E-posta
            </button>
            <button class="share-btn" data-type="sms" style="
                display:flex; align-items:center; gap:12px; padding:12px 16px;
                border:none; border-radius:12px; cursor:pointer; font-size:15px;
                font-weight:600; color:#fff; background:#5B5EA6;
                transition: transform 0.15s, box-shadow 0.15s;
            ">
                <span style="font-size:22px;">💬</span> SMS
            </button>
            <button class="share-btn" data-type="copy" style="
                display:flex; align-items:center; gap:12px; padding:12px 16px;
                border:none; border-radius:12px; cursor:pointer; font-size:15px;
                font-weight:600; color:#333; background:#f0f0f0;
                transition: transform 0.15s, box-shadow 0.15s;
            ">
                <span style="font-size:22px;">📋</span> Panoya Kopyala
            </button>
        </div>
        <button id="share-cancel" style="
            width:100%; margin-top:14px; padding:12px; border:none;
            border-radius:12px; background:#f5f5f5; color:#666;
            font-size:14px; font-weight:600; cursor:pointer;
        ">İptal</button>
    `;

    overlay.appendChild(menu);
    document.body.appendChild(overlay);

    // Hover efekti
    menu.querySelectorAll('.share-btn').forEach(btn => {
        btn.addEventListener('mouseenter', () => { btn.style.transform = 'scale(1.03)'; btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; });
        btn.addEventListener('mouseleave', () => { btn.style.transform = 'scale(1)'; btn.style.boxShadow = 'none'; });
    });

    // Buton tıklamaları
    menu.querySelector('[data-type="whatsapp"]').addEventListener('click', () => {
        window.open('https://wa.me/?text=' + encodedText, '_blank');
        closeShareMenu();
    });
    menu.querySelector('[data-type="telegram"]').addEventListener('click', () => {
        window.open('https://t.me/share/url?text=' + encodedText, '_blank');
        closeShareMenu();
    });
    menu.querySelector('[data-type="email"]').addEventListener('click', () => {
        window.open('mailto:?subject=' + encodeURIComponent(t('shareListTitle')) + '&body=' + encodedText, '_self');
        closeShareMenu();
    });
    menu.querySelector('[data-type="sms"]').addEventListener('click', () => {
        window.open('sms:?body=' + encodedText, '_self');
        closeShareMenu();
    });
    menu.querySelector('[data-type="copy"]').addEventListener('click', () => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => showToast(t('toastCopied'))).catch(() => fallbackCopy(text));
        } else {
            fallbackCopy(text);
        }
        closeShareMenu();
    });

    // İptal & Dış tıklama
    menu.querySelector('#share-cancel').addEventListener('click', closeShareMenu);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeShareMenu(); });

    function closeShareMenu() {
        overlay.style.animation = 'fadeOut 0.15s ease forwards';
        setTimeout(() => overlay.remove(), 150);
    }
}

function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
        document.execCommand('copy');
        showToast(t('toastCopied'));
    } catch (e) {
        showToast(t('toastCopyFailed'));
    }
    document.body.removeChild(ta);
}

// ==========================================
// TOAST BİLDİRİMİ
// ==========================================

let toastTimer = null;

function showToast(message) {
    const toast = document.getElementById('toast');
    
    // Emoji'yi mesajdan ayır
    const emojiMatch = message.match(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F?)/u);
    const icon = emojiMatch ? emojiMatch[0] : '✅';
    const text = emojiMatch ? message.slice(emojiMatch[0].length).trim() : message;
    
    toast.innerHTML = `<div class="toast-box">
        <div class="toast-icon">${icon}</div>
        <div class="toast-message">${text}</div>
    </div>`;
    toast.classList.add('show');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove('show');
    }, 1500);
    
    // Overlay'e tıklayınca kapat
    toast.onclick = (e) => {
        if (e.target === toast) {
            clearTimeout(toastTimer);
            toast.classList.remove('show');
        }
    };
}

// ==========================================
// YARDIMCI FONKSİYONLAR
// ==========================================

function midpoint(a, b) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function drawLine(ctx, a, b) {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
}

function formatVolume(v) {
    if (!v || isNaN(v)) return '0.000';
    if (v < 0.001) return v.toFixed(6);
    if (v < 0.1) return v.toFixed(4);
    return v.toFixed(3);
}

function formatNumber(n) {
    if (Number.isInteger(n)) return n.toLocaleString('tr-TR');
    return n.toLocaleString('tr-TR', { maximumFractionDigits: 2 });
}

// ==========================================
// KONTEYNER YÜKLEME SİMÜLASYONU
// ==========================================

const CONTAINER_TYPES = {
    '20dc': { name: "20' DC", uzunluk: 589, genislik: 234, yukseklik: 238 },
    '40dc': { name: "40' DC", uzunluk: 1203, genislik: 234, yukseklik: 238 },
    '40hc': { name: "40' HC", uzunluk: 1203, genislik: 234, yukseklik: 269 },
    'custom': { name: 'Özel', uzunluk: 0, genislik: 0, yukseklik: 0 }
};

let selectedContainerType = '20dc';
let rollpackYatayMod = false;

// Konteyner 3D renk paleti (global — hem 3D hem raporda kullanılır)
const CONTAINER_ITEM_COLORS = [
    { top: '#fde68a', left: '#f59e0b', right: '#d97706', front: '#eab308', bottom: '#b45309' },
    { top: '#a5f3fc', left: '#22d3ee', right: '#0891b2', front: '#06b6d4', bottom: '#0e7490' },
    { top: '#c4b5fd', left: '#8b5cf6', right: '#6d28d9', front: '#7c3aed', bottom: '#5b21b6' },
    { top: '#fca5a5', left: '#ef4444', right: '#b91c1c', front: '#dc2626', bottom: '#991b1b' },
    { top: '#86efac', left: '#22c55e', right: '#15803d', front: '#16a34a', bottom: '#166534' },
    { top: '#fdba74', left: '#f97316', right: '#c2410c', front: '#ea580c', bottom: '#9a3412' },
    { top: '#f9a8d4', left: '#ec4899', right: '#be185d', front: '#db2777', bottom: '#9d174d' },
    { top: '#93c5fd', left: '#3b82f6', right: '#1d4ed8', front: '#2563eb', bottom: '#1e40af' },
    { top: '#fef08a', left: '#eab308', right: '#a16207', front: '#ca8a04', bottom: '#854d0e' },
    { top: '#d9f99d', left: '#84cc16', right: '#4d7c0f', front: '#65a30d', bottom: '#3f6212' },
];
let containerResult = null;
let lastContainerDims = null;

// 3D döndürme & zoom state
let cnt3dRotY = 0;        // yatay döndürme açısı (0 = varsayılan izometrik)
let cnt3dZoom = 1.0;      // zoom seviyesi (1 = otomatik sığdırma)
let cnt3dDragging = false;
let cnt3dLastMX = 0;
let cnt3dPinchDist = 0;   // pinch-to-zoom başlangıç mesafesi
let cnt3dRafPending = false;

function scheduleRender3D() {
    if (cnt3dRafPending) return;
    cnt3dRafPending = true;
    requestAnimationFrame(() => {
        cnt3dRafPending = false;
        if (lastContainerDims && containerResult) {
            renderContainer3D(lastContainerDims, containerResult);
        }
    });
}

function setupContainer() {
    const overlay = document.getElementById('container-overlay');
    const btnOpen = document.getElementById('btn-container');
    const btnClose = document.getElementById('container-close');
    const btnCalc = document.getElementById('btn-calc-container');

    if (!btnOpen) return;

    btnOpen.addEventListener('click', () => {
        if (itemList.length === 0) {
            showToast(t('toastAddFirst'));
            return;
        }
        overlay.classList.add('active');
    });

    btnClose.addEventListener('click', () => overlay.classList.remove('active'));
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('active');
    });

    // Tip seçimi
    document.querySelectorAll('.container-type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.container-type-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedContainerType = btn.dataset.type;
            const customEl = document.getElementById('custom-dims');
            customEl.classList.toggle('hidden', selectedContainerType !== 'custom');
        });
    });

    btnCalc.addEventListener('click', calculateContainer);

    // Rollpack yatay dizilim toggle
    const btnYatay = document.getElementById('btn-rollpack-yatay');
    const orientBadge = document.getElementById('orient-badge');
    if (btnYatay) {
        btnYatay.addEventListener('click', () => {
            rollpackYatayMod = !rollpackYatayMod;
            btnYatay.classList.toggle('active', rollpackYatayMod);
            orientBadge.textContent = rollpackYatayMod ? 'Aktif' : 'Kapalı';
        });
    }
}

function getContainerDims() {
    if (selectedContainerType === 'custom') {
        return {
            uzunluk: parseFloat(document.getElementById('cnt-uzunluk').value) || 0,
            genislik: parseFloat(document.getElementById('cnt-genislik').value) || 0,
            yukseklik: parseFloat(document.getElementById('cnt-yukseklik').value) || 0
        };
    }
    const t = CONTAINER_TYPES[selectedContainerType];
    return { uzunluk: t.uzunluk, genislik: t.genislik, yukseklik: t.yukseklik };
}

function calculateContainer() {
    const dims = getContainerDims();
    if (dims.uzunluk <= 0 || dims.genislik <= 0 || dims.yukseklik <= 0) {
        showToast(t('toastEnterDims'));
        return;
    }

    if (itemList.length === 0) {
        showToast(t('toastNoItems'));
        return;
    }

    // Her ürünü adet kadar tekrar et (plaka + rulo)
    const allItems = [];
    itemList.forEach(item => {
        if (item.tip === 'rollpack') {
            // Rollpack: paketAdet kadar rulo ekle
            // hacimM3 = tüp hacmi + içindeki ürün hacmi (her tüp için)
            const cap = Math.round(item.cap);
            const paketSayisi = item.paketAdet || 1;
            const urunVolPerTube = paketSayisi > 0 ? ((item.urunToplamM3 || 0) / paketSayisi) : 0;
            for (let p = 0; p < paketSayisi; p++) {
                allItems.push({
                    tip: 'rulo',
                    en: Math.round(item.en),
                    boy: cap,
                    kalinlik: cap,
                    hacimM3: item.birimM3 + urunVolPerTube,
                    label: `RP:${item.en}×Ø${cap.toFixed(0)}-${item.id}`,
                    sourceId: item.id,
                    forceYatay: rollpackYatayMod
                });
            }
            return; // sonraki item'a geç
        }
        for (let i = 0; i < item.adet; i++) {
            if (item.tip === 'plaka') {
                allItems.push({
                    tip: 'plaka',
                    en: item.en,
                    boy: item.boy,
                    kalinlik: item.kalinlik,
                    hacimM3: item.birimM3,
                    label: `P:${item.en}×${item.boy}×${item.kalinlik}-${item.id}`,
                    sourceId: item.id
                });
            } else {
                // Rulo: bounding box hesapla (silindir -> kutu)
                const ruloBoyuCm = item.ruloBoyu * 100;
                const capNormal = Math.sqrt(item.kalinlik * ruloBoyuCm / Math.PI) * 2;
                const vakum = item.vakum || 0;
                const capRaw = vakum > 0 ? capNormal * (1 - vakum / 100) : capNormal;
                const cap = Math.round(capRaw);
                allItems.push({
                    tip: 'rulo',
                    en: Math.round(item.en),
                    boy: cap,
                    kalinlik: cap,
                    hacimM3: item.birimM3,
                    label: `R:${item.en}×Ø${cap.toFixed(0)}-${item.id}`,
                    sourceId: item.id
                });
            }
        }
    });

    // Bin Packing: Katmanlı Greedy Yerleştirme
    let result;
    try {
        result = binPackItems(dims, allItems);
    } catch (err) {
        showToast(t('toastCalcError') + err.message);
        console.error('binPackItems hatası:', err);
        return;
    }
    containerResult = result;
    lastContainerDims = dims;

    // Sonuçları göster
    document.getElementById('container-preview-wrap').style.display = '';
    document.getElementById('container-report').style.display = '';

    try {
        renderContainerReport(dims, result);
    } catch (err) {
        console.error('renderContainerReport hatası:', err);
        showToast(t('toastReportError') + err.message);
    }
    try {
        renderContainer3D(dims, result);
    } catch (err) {
        console.error('renderContainer3D hatası:', err);
        showToast(t('toastRenderError') + err.message);
    }
}

function binPackItems(container, items) {
    const CL = container.uzunluk;  // X ekseni (uzunluk)
    const CW = container.genislik; // Z ekseni (genişlik)
    const CH = container.yukseklik; // Y ekseni (yükseklik)

    const placed = [];
    const notPlaced = [];
    const colorMap = {};
    let colorIndex = 0;

    function assignColor(label) {
        if (!(label in colorMap)) colorMap[label] = colorIndex++;
        return colorMap[label];
    }

    // ─── Çakışma kontrolü (sıfır tolerans) ───────────────────────
    function collidesWithPlaced(px, py, pz, pl, pw, ph) {
        for (const p of placed) {
            if (px + pl > p.x &&
                px < p.x + p.l &&
                py + ph > p.y &&
                py < p.y + p.h &&
                pz + pw > p.z &&
                pz < p.z + p.w) {
                return true;
            }
        }
        return false;
    }

    // ─── Tam çakışma testi (son doğrulama için, EPS yok) ───────────
    function strictCollides(a, b) {
        return a.x + a.l > b.x && a.x < b.x + b.l &&
               a.y + a.h > b.y && a.y < b.y + b.h &&
               a.z + a.w > b.z && a.z < b.z + b.w;
    }

    function overlap1D(a0, a1, b0, b1) {
        return Math.min(a1, b1) - Math.max(a0, b0);
    }

    // Plaka y>0 ise altta mutlaka “zemin” olsun (rulo/plaka üstü)
    function hasSupportAt(px, py, pz, pl, pw) {
        if (py <= 0) return true;
        for (const p of placed) {
            const topY = p.y + p.h;
            // Tolerans 5 birim
            if (Math.abs(topY - py) > 5) continue;
            const ox = overlap1D(px, px + pl, p.x, p.x + p.l);
            const oz = overlap1D(pz, pz + pw, p.z, p.z + p.w);
            if (ox > 1 && oz > 1) return true;
        }
        return false;
    }
    // Plaka y>0 ise “ne kadar” destek var? (0..1)
    function supportCoverage(px, py, pz, pl, pw) {
        if (py <= 0) return 1;
        const area = pl * pw;
        if (area <= 0) return 0;
        let covered = 0;
        for (const p of placed) {
            const topY = p.y + p.h;
            // Tolerans 5 birim
            if (Math.abs(topY - py) > 5) continue;
            const ox = overlap1D(px, px + pl, p.x, p.x + p.l);
            const oz = overlap1D(pz, pz + pw, p.z, p.z + p.w);
            if (ox > 0 && oz > 0) covered += ox * oz;
        }
        return Math.min(1, covered / area);
    }

    // ═══════════════════════════════════════════════════════════════
    // BOŞLUK HAVUZU: MAXIMAL SPACES (tek akış: rulo → plaka)
    // ═══════════════════════════════════════════════════════════════
    let spaces = [{ x: 0, y: 0, z: 0, l: CL, w: CW, h: CH }];

    function boxIntersects(sp, px, py, pz, pl, pw, ph) {
        return sp.x < px + pl && sp.x + sp.l > px &&
               sp.y < py + ph && sp.y + sp.h > py &&
               sp.z < pz + pw && sp.z + sp.w > pz;
    }

    function splitSpace(sp, px, py, pz, pl, pw, ph) {
        const res = [];
        if (px > sp.x)
            res.push({ x: sp.x, y: sp.y, z: sp.z, l: px - sp.x, w: sp.w, h: sp.h });
        if (px + pl < sp.x + sp.l)
            res.push({ x: px + pl, y: sp.y, z: sp.z, l: (sp.x + sp.l) - (px + pl), w: sp.w, h: sp.h });
        if (py > sp.y)
            res.push({ x: sp.x, y: sp.y, z: sp.z, l: sp.l, w: sp.w, h: py - sp.y });
        if (py + ph < sp.y + sp.h)
            res.push({ x: sp.x, y: py + ph, z: sp.z, l: sp.l, w: sp.w, h: (sp.y + sp.h) - (py + ph) });
        if (pz > sp.z)
            res.push({ x: sp.x, y: sp.y, z: sp.z, l: sp.l, w: pz - sp.z, h: sp.h });
        if (pz + pw < sp.z + sp.w)
            res.push({ x: sp.x, y: sp.y, z: pz + pw, l: sp.l, w: (sp.z + sp.w) - (pz + pw), h: sp.h });
        return res;
    }

    function pruneSpaces() {
        const n = spaces.length;
        const remove = new Uint8Array(n);
        for (let i = 0; i < n; i++) {
            if (remove[i]) continue;
            const a = spaces[i];
            for (let j = 0; j < n; j++) {
                if (i === j || remove[j]) continue;
                const b = spaces[j];
                if (b.x <= a.x && b.y <= a.y && b.z <= a.z &&
                    b.x + b.l >= a.x + a.l && b.y + b.h >= a.y + a.h &&
                    b.z + b.w >= a.z + a.w) {
                    remove[i] = 1; break;
                }
            }
        }
        spaces = spaces.filter((_, i) => !remove[i]);
    }

    function shrinkSpacesIfNeeded(limit = 900) {
        if (spaces.length <= limit) return;
        spaces.sort((a, b) => (b.l * b.w * b.h) - (a.l * a.w * a.h));
        spaces = spaces.slice(0, limit);
    }
    function fitsInAnySpace(px, py, pz, pl, pw, ph) {
        for (const sp of spaces) {
            if (px >= sp.x && py >= sp.y && pz >= sp.z &&
                px + pl <= sp.x + sp.l &&
                py + ph <= sp.y + sp.h &&
                pz + pw <= sp.z + sp.w) {
                return true;
            }
        }
        return false;
    }

    function cutSpaces(px, py, pz, pl, pw, ph) {
        const newSpaces = [];
        for (const sp of spaces) {
            if (boxIntersects(sp, px, py, pz, pl, pw, ph)) {
                newSpaces.push(...splitSpace(sp, px, py, pz, pl, pw, ph));
            } else {
                newSpaces.push(sp);
            }
        }
        spaces = newSpaces.filter(s => s.l >= 1 && s.w >= 1 && s.h >= 1);
        pruneSpaces();
        shrinkSpacesIfNeeded();
    }

    // ═══════════════════════════════════════════════════════════════
    // FAZE 1: RULOLARI YERLEŞTİR — ÖNCELİK: DİKEY, SONRA YATAY
    // ═══════════════════════════════════════════════════════════════
    const ruloItems = items.filter(i => i.tip === 'rulo' || i.tip === 'rollpack');
    const plakaItems = items.filter(i => i.tip === 'plaka');

    // Büyük rulolar önce
    const sortedRulos = [...ruloItems].sort((a, b) => {
        if (Math.abs(b.en - a.en) > 1) return b.en - a.en;
        if (Math.abs(b.boy - a.boy) > 1) return b.boy - a.boy;
        return (b.en * b.boy * b.boy) - (a.en * a.boy * a.boy);
    });

    // Kesit verimliliği hesapla
    function crossSectionScore(ol, ow) {
        const nL = Math.floor(CL / ol);
        const nW = Math.floor(CW / ow);
        const usedL = nL * ol;
        const usedW = nW * ow;
        return (usedL * usedW) / (CL * CW);
    }
    function tightFitScore(ow) {
        const ratio = ow / CW;
        return ratio > 0.85 ? ratio : 0;
    }

    // Tek bir yönelimdeki en iyi pozisyonu bul
    function findBestPosition(orient) {
        let bestFit = null;
        let bestScore = Infinity;

        for (const sp of spaces) {
            if (orient.l > sp.l || orient.w > sp.w || orient.h > sp.h) continue;

            const corners = [
                { x: sp.x, z: sp.z },
                { x: sp.x + sp.l - orient.l, z: sp.z },
                { x: sp.x, z: sp.z + sp.w - orient.w },
                { x: sp.x + sp.l - orient.l, z: sp.z + sp.w - orient.w },
            ];

            for (const c of corners) {
                const px = Math.round(c.x);
                const py = Math.round(sp.y);
                const pz = Math.round(c.z);
                if (px < 0 || py < 0 || pz < 0) continue;
                if (px + orient.l > CL || py + orient.h > CH || pz + orient.w > CW) continue;

                if (py > 0) {
                    const cov = supportCoverage(px, py, pz, orient.l, orient.w);
                    if (cov < 0.3) continue;
                }

                if (collidesWithPlaced(px, py, pz, orient.l, orient.w, orient.h)) continue;

                // Sıra önceliği: X(arka→ön) → Y(alt→üst) → Z(yan)
                // Konteyner arkasından (X=0) başlayıp her dilimi doldurup öne ilerler
                const score = px * 10000000 + py * 10000 + pz;

                if (score < bestScore) {
                    bestScore = score;
                    bestFit = { x: px, y: py, z: pz };
                }
            }
        }

        return bestFit;
    }

    // AŞ.1: Tüm ruloları DİKEY yerleştir (forceYatay olanlar direkt AŞ.2'ye)
    const dikFailedRulos = [];
    for (const item of sortedRulos) {
        if (item.forceYatay) { dikFailedRulos.push(item); continue; }
        const cap = Math.round(item.boy);
        const cylH = Math.round(item.en);
        if (cap <= 0 || cylH <= 0) { notPlaced.push(item); continue; }

        // Dik oryantasyon: çap×çap tabanı, yükseklik = en (silindir boyu)
        const dikOrient = { l: cap, w: cap, h: cylH, dik: true, ruloAxis: 'y' };
        if (cap > CL || cap > CW || cylH > CH) {
            dikFailedRulos.push(item);
            continue;
        }

        const cIdx = assignColor(item.label);
        const pos = findBestPosition(dikOrient);

        if (pos) {
            placed.push({
                x: pos.x, y: pos.y, z: pos.z,
                l: dikOrient.l, w: dikOrient.w, h: dikOrient.h,
                label: item.label,
                tip: 'rulo',
                dik: true,
                ruloAxis: 'y',
                cap: cap,
                cylH: cylH,
                hacimM3: item.hacimM3,
                colorIdx: cIdx,
                sourceId: item.sourceId
            });
            cutSpaces(pos.x, pos.y, pos.z, dikOrient.l, dikOrient.w, dikOrient.h);
        } else {
            dikFailedRulos.push(item);
        }
    }

    // AŞ.2: Dik sığmayan ruloları YATAY yerleştirmeyi dene
    for (const item of dikFailedRulos) {
        const cap = Math.round(item.boy);
        const cylH = Math.round(item.en);
        const cIdx = assignColor(item.label);

        // Yatık-X: silindir X ekseni boyunca uzanır
        const yatikX = { l: cylH, w: cap, h: cap, dik: false, ruloAxis: 'x' };
        // Yatık-Z: silindir Z ekseni boyunca uzanır
        const yatikZ = { l: cap, w: cylH, h: cap, dik: false, ruloAxis: 'z' };

        let didPlace = false;
        for (const orient of [yatikX, yatikZ]) {
            if (orient.l > CL || orient.w > CW || orient.h > CH) continue;
            const pos = findBestPosition(orient);
            if (pos) {
                placed.push({
                    x: pos.x, y: pos.y, z: pos.z,
                    l: orient.l, w: orient.w, h: orient.h,
                    label: item.label,
                    tip: 'rulo',
                    dik: false,
                    ruloAxis: orient.ruloAxis,
                    cap: cap,
                    cylH: cylH,
                    hacimM3: item.hacimM3,
                    colorIdx: cIdx,
                    sourceId: item.sourceId
                });
                cutSpaces(pos.x, pos.y, pos.z, orient.l, orient.w, orient.h);
                didPlace = true;
                break;
            }
        }
        if (!didPlace) notPlaced.push(item);
    }

    // ═══════════════════════════════════════════════════════════════
    // FAZE 2: PLAKALARI TÜM YÖNELİMLERDE YERLEŞTİR (yatay + dikey)
    // ═══════════════════════════════════════════════════════════════

    // Plaka yönelim seçenekleri (yatay + dikey: tüm geçerli yönelimler)
    function getPlakaOrientations(p) {
        const dims = [p.en, p.boy, p.kalinlik];
        const orientations = [];
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (j === i) continue;
                const k = 3 - i - j;
                orientations.push({ l: dims[i], w: dims[j], h: dims[k] });
            }
        }
        const unique = [];
        const seen = new Set();
        for (const o of orientations) {
            const key = `${o.l}-${o.w}-${o.h}`;
            if (!seen.has(key) && o.l <= CL && o.w <= CW && o.h <= CH) {
                seen.add(key);
                o.perLayer = Math.floor(CL / o.l) * Math.floor(CW / o.w);
                o.maxItems = o.perLayer * Math.floor(CH / o.h);
                unique.push(o);
            }
        }
        // En verimli yönelim önce (kat başına en çok ürün)
        const minDim = Math.min(...dims);
        unique.sort((a, b) => {
            if (b.perLayer !== a.perLayer) return b.perLayer - a.perLayer;
            if (b.maxItems !== a.maxItems) return b.maxItems - a.maxItems;
            // Eşitlikte yatay (en ince boyut yukarı) tercih
            return (b.h === minDim ? 1 : 0) - (a.h === minDim ? 1 : 0);
        });
        return unique;
    }

    // Plakaları büyükten küçüğe sırala
    const sortedPlakas = [...plakaItems].sort((a, b) => {
        return (b.en * b.boy * b.kalinlik) - (a.en * a.boy * a.kalinlik);
    });

    // Rulo varsa plakaları tercihen rulo üstüne koy ama tabana da izin ver

    function placePlaka(item) {
        const orients = getPlakaOrientations(item);
        if (orients.length === 0) return false;

        const cIdx = assignColor(item.label);

        // Rulolarla aynı findBestPosition fonksiyonunu kullan
        // Tüm oryantasyonları dene, en iyi (en düşük skorlu) pozisyonu seç
        let bestPos = null;
        let bestOrient = null;
        let bestScore = Infinity;

        for (const orient of orients) {
            if (orient.l > CL || orient.w > CW || orient.h > CH) continue;
            const pos = findBestPosition(orient);
            if (pos) {
                // Yatay yerleşim tercihi: en ince boyut yukarıda küçük bonus
                const minDim = Math.min(orient.l, orient.w, orient.h);
                const flatBonus = (orient.h === minDim) ? -5 : 0;
                const score = pos.x * 10000000 + pos.y * 10000 + pos.z + flatBonus;
                if (score < bestScore) {
                    bestScore = score;
                    bestPos = pos;
                    bestOrient = orient;
                }
            }
        }

        if (!bestPos || !bestOrient) return false;

        placed.push({
            x: bestPos.x, y: bestPos.y, z: bestPos.z,
            l: bestOrient.l, w: bestOrient.w, h: bestOrient.h,
            label: item.label,
            tip: 'plaka',
            dik: (bestOrient.h !== Math.min(bestOrient.l, bestOrient.w, bestOrient.h)),
            hacimM3: item.hacimM3,
            colorIdx: cIdx,
            sourceId: item.sourceId
        });

        cutSpaces(bestPos.x, bestPos.y, bestPos.z, bestOrient.l, bestOrient.w, bestOrient.h);
        return true;
    }

    // Plakaları yerleştir
    for (const item of sortedPlakas) {
        if (!placePlaka(item)) {
            notPlaced.push(item);
        }
    }

    // ─── SON DOĞRULAMA: Çakışan ürünleri kaldır ────────────────────
    const verified = [];
    for (let i = 0; i < placed.length; i++) {
        let hasCollision = false;
        for (let j = 0; j < verified.length; j++) {
            if (strictCollides(placed[i], verified[j])) {
                hasCollision = true;
                break;
            }
        }
        if (!hasCollision) {
            verified.push(placed[i]);
        } else {
            notPlaced.push({ label: placed[i].label, tip: placed[i].tip, hacimM3: placed[i].hacimM3, sourceId: placed[i].sourceId });
        }
    }
    placed.length = 0;
    placed.push(...verified);

    // ─── Katman analizi ────────────────────────────────────────────
    const layers = [];
    const layerThreshold = 2;
    placed.forEach(p => {
        let found = false;
        for (const layer of layers) {
            if (Math.abs(p.y - layer.y) < layerThreshold) {
                layer.items.push(p);
                found = true;
                break;
            }
        }
        if (!found) layers.push({ y: p.y, items: [p] });
    });
    layers.sort((a, b) => a.y - b.y);

    // ─── Hacim hesapları ───────────────────────────────────────────
    const containerVolM3 = (CL * CW * CH) / 1000000;
    const placedBBoxVolM3 = placed.reduce((s, p) => s + (p.l * p.w * p.h) / 1000000, 0);
    const placedVolM3 = placed.reduce((s, p) => s + p.hacimM3, 0);
    const fillPercent = containerVolM3 > 0 ? (placedBBoxVolM3 / containerVolM3) * 100 : 0;

    // sourceId → colorIdx haritası (her item için yerleşen ilk parçanın rengi)
    const sourceColorMap = {};
    placed.forEach(p => {
        if (p.sourceId != null && !(p.sourceId in sourceColorMap)) {
            sourceColorMap[p.sourceId] = p.colorIdx;
        }
    });

    return {
        container: { l: CL, w: CW, h: CH, volM3: containerVolM3 },
        placed,
        notPlaced,
        layers,
        colorMap,
        sourceColorMap,
        totalItems: items.length,
        placedCount: placed.length,
        notPlacedCount: notPlaced.length,
        placedVolM3,
        placedBBoxVolM3,
        fillPercent
    };
}

function renderContainerReport(dims, result) {
    const grid = document.getElementById('report-grid');
    const layersEl = document.getElementById('report-layers');
    const remainEl = document.getElementById('report-remaining');

    // Gerçek fiziksel paket/ürün sayısını itemList'ten hesapla (gösterim için)
    let displayTotal = 0;
    itemList.forEach(it => {
        if (it.tip === 'rollpack') {
            displayTotal += it.paketAdet || 1;
        } else {
            displayTotal += it.adet || 1;
        }
    });
    const displayNotPlaced = Math.max(0, displayTotal - result.placedCount);

    const fillColor = result.fillPercent > 80 ? '#059669' : result.fillPercent > 50 ? '#d97706' : '#dc2626';
    const fillColorClass = result.fillPercent > 80 ? 'green' : result.fillPercent > 50 ? 'orange' : 'red';
    const barColor = result.fillPercent > 80 ? 'linear-gradient(90deg,#059669,#10b981)' : result.fillPercent > 50 ? 'linear-gradient(90deg,#d97706,#f59e0b)' : 'linear-gradient(90deg,#dc2626,#ef4444)';

    const placedRuloCount = result.placed.filter(p => p.tip === 'rulo' || p.tip === 'rollpack').length;
    const placedPlakaCount = result.placed.filter(p => p.tip === 'plaka').length;
    const totalRuloCount = result.totalItems - placedPlakaCount - (result.notPlaced.filter(p => p.tip === 'plaka').length || 0);
    const totalPlakaCount = result.totalItems - totalRuloCount;

    // Renk efsanesi (sourceColorMap'ten)
    let legendEl = document.getElementById('report-color-legend');
    if (!legendEl) {
        legendEl = document.createElement('div');
        legendEl.id = 'report-color-legend';
        legendEl.className = 'report-color-legend';
        grid.parentNode.insertBefore(legendEl, grid);
    }
    if (result.sourceColorMap && Object.keys(result.sourceColorMap).length > 0) {
        let legendHTML = '<div class="legend-title">🎨 Renk Göstergesi</div><div class="legend-items">';
        itemList.forEach(it => {
            const cIdx = result.sourceColorMap[it.id];
            if (cIdx === undefined) return;
            const color = CONTAINER_ITEM_COLORS[cIdx % CONTAINER_ITEM_COLORS.length];
            const tipLabel = it.tip === 'plaka' ? t('tipPlaka') : it.tip === 'rollpack' ? t('tipRollpack') : t('tipRulo');
            legendHTML += `<div class="legend-row">
                <span class="legend-dot" style="background:${color.front};border:2px solid ${color.right};"></span>
                <span class="legend-text"><b>${tipLabel}</b> · ${it.dims}</span>
            </div>`;
        });
        legendHTML += '</div>';
        legendEl.innerHTML = legendHTML;
        legendEl.style.display = '';
    } else {
        legendEl.style.display = 'none';
    }

    grid.innerHTML = `
        <div class="report-item">
            <div class="ri-label">${t('containerVol')}</div>
            <div class="ri-value">${formatVolume(result.container.volM3)} m³</div>
        </div>
        <div class="report-item">
            <div class="ri-label">${t('containerCoveredVol')}</div>
            <div class="ri-value ${fillColorClass}">${formatVolume(result.placedBBoxVolM3)} m³</div>
        </div>
        <div class="report-item">
            <div class="ri-label">${t('containerProductVol')}</div>
            <div class="ri-value">${formatVolume(result.placedVolM3)} m³</div>
        </div>
        <div class="report-item">
            <div class="ri-label">${t('containerPlacedItems')}</div>
            <div class="ri-value green">${result.placedCount} / ${displayTotal}</div>
        </div>
        <div class="report-item">
            <div class="ri-label">${t('containerRuloPlaka')}</div>
            <div class="ri-value">${placedRuloCount} ${t('containerRuloUnit')} · ${placedPlakaCount} ${t('containerPlakaUnit')}</div>
        </div>
        <div class="report-item full-width">
            <div class="ri-label">${t('containerFillRate')}</div>
            <div class="ri-value ${fillColorClass}">${result.fillPercent.toFixed(1)}%</div>
            <div class="fill-bar-wrap">
                <div class="fill-bar" style="width:${Math.min(result.fillPercent, 100)}%;background:${barColor};">
                    ${result.fillPercent > 15 ? result.fillPercent.toFixed(0) + '%' : ''}
                </div>
            </div>
        </div>
    `;

    // Boş kalan alan hesaplama
    const CL = dims.uzunluk || result.container.l, CW = dims.genislik || result.container.w, CH = dims.yukseklik || result.container.h;
    // Her eksen boyunca yerleşen ürünlerin max sınırını bul
    let maxX = 0, maxY = 0, maxZ = 0;
    result.placed.forEach(p => {
        if (p.x + p.l > maxX) maxX = p.x + p.l;
        if (p.y + p.h > maxY) maxY = p.y + p.h;
        if (p.z + p.w > maxZ) maxZ = p.z + p.w;
    });
    const emptyL = Math.max(0, CL - maxX);
    const emptyW = Math.max(0, CW - maxZ);
    const emptyH = Math.max(0, CH - maxY);
    const usedVolM3 = result.placedBBoxVolM3;
    const emptyVolM3 = result.container.volM3 - usedVolM3;

    let emptyHTML = `<h4>${t('containerEmptySpace')}</h4>`;
    emptyHTML += `<div class="layer-row">
        <span>${t('containerEmptyLength')}</span>
        <span><b>${emptyL.toFixed(1)} cm</b></span>
    </div>`;
    emptyHTML += `<div class="layer-row">
        <span>${t('containerEmptyWidth')}</span>
        <span><b>${emptyW.toFixed(1)} cm</b></span>
    </div>`;
    emptyHTML += `<div class="layer-row">
        <span>${t('containerEmptyHeight')}</span>
        <span><b>${emptyH.toFixed(1)} cm</b></span>
    </div>`;
    emptyHTML += `<div class="layer-row">
        <span>${t('containerEmptyVol')}</span>
        <span><b>${formatVolume(Math.max(0, emptyVolM3))} m³</b></span>
    </div>`;
    layersEl.innerHTML = emptyHTML;

    // Sığmayan ürünler
    if (displayNotPlaced > 0) {
        // Gerçek toplam hacmi itemList'ten hesapla
        let displayTotalVol = 0;
        itemList.forEach(it => {
            displayTotalVol += it.toplamM3 || 0;
        });
        const npVol = Math.max(0, displayTotalVol - result.placedVolM3);

        // Her sourceId için kaç tane yerleşti sayısını bul
        const placedCountById = {};
        result.placed.forEach(p => {
            if (p.sourceId != null) {
                placedCountById[p.sourceId] = (placedCountById[p.sourceId] || 0) + 1;
            }
        });

        // Her itemList öğesi için sığmayan sayıyı ve detayı hesapla
        let detailHTML = '';
        itemList.forEach(it => {
            // Rollpack için paketAdet, diğerleri için adet kullan
            const realTotal = it.tip === 'rollpack' ? (it.paketAdet || 1) : (it.adet || 1);
            const placedForThis = placedCountById[it.id] || 0;
            const realPlaced = Math.min(realTotal, placedForThis);
            const notFit = realTotal - realPlaced;
            if (notFit > 0) {
                let sizeText = '';
                if (it.tip === 'plaka') {
                    sizeText = `${it.en}×${it.boy}×${it.kalinlik} cm`;
                } else if (it.tip === 'rollpack') {
                    sizeText = `${it.en}×Ø${it.cap} cm`;
                } else {
                    // rulo
                    const ruloBoyuCm = it.ruloBoyu ? (it.ruloBoyu * 100) : 0;
                    const capNormal = Math.sqrt(it.kalinlik * ruloBoyuCm / Math.PI) * 2;
                    const vakum = it.vakum || 0;
                    const capVal = vakum > 0 ? capNormal * (1 - vakum / 100) : capNormal;
                    sizeText = `${it.en}×Ø${Math.round(capVal)} cm`;
                }
                const notFitVol = notFit * (it.birimM3 || 0);
                detailHTML += `<div class="not-fit-detail-row">
                    <span>${sizeText}</span>
                    <span><b>${notFit} ${t('containerNotFitPcs')}</b> (${formatVolume(notFitVol)} m³)</span>
                </div>`;
            }
        });

        remainEl.innerHTML = t('containerNotFit', { n: displayNotPlaced, v: formatVolume(npVol) })
            + detailHTML;
        remainEl.className = 'report-remaining';
    } else {
        remainEl.innerHTML = t('containerAllFit');
        remainEl.className = 'report-remaining all-fit';
    }

    // Sanal hesaplama uyarısı
    let disclaimerEl = document.getElementById('container-disclaimer');
    if (!disclaimerEl) {
        disclaimerEl = document.createElement('div');
        disclaimerEl.id = 'container-disclaimer';
        disclaimerEl.style.cssText = 'margin-top:12px;padding:10px 14px;background:#f0f4ff;border:1px solid #c7d2fe;border-radius:8px;color:#4338ca;font-size:0.85rem;text-align:center;line-height:1.5;';
        remainEl.parentNode.insertBefore(disclaimerEl, remainEl.nextSibling);
    }
    disclaimerEl.textContent = t('containerDisclaimer');

    // PDF Export butonunu göster
    const pdfBtn = document.getElementById('btn-pdf-export');
    if (pdfBtn) {
        pdfBtn.style.display = '';
        pdfBtn.onclick = function() { exportContainerPDF(dims, result); };
    }
}

// ==========================================
// PDF RAPOR EXPORT
// ==========================================

function exportContainerPDF(dims, result) {
    const canvas = document.getElementById('container3d');
    let canvasDataURL = '';
    try {
        canvasDataURL = canvas.toDataURL('image/png');
    } catch (e) {
        console.warn('Canvas export hatası:', e);
    }

    // Logo base64
    let logoDataURL = '';
    try {
        const logoImg = document.querySelector('.header-logo');
        if (logoImg && logoImg.complete) {
            const lc = document.createElement('canvas');
            lc.width = logoImg.naturalWidth;
            lc.height = logoImg.naturalHeight;
            const lctx = lc.getContext('2d');
            lctx.drawImage(logoImg, 0, 0);
            logoDataURL = lc.toDataURL('image/png');
        }
    } catch (e) {
        console.warn('Logo export hatası:', e);
    }

    // Hesaplama verileri
    const CL = dims.uzunluk || result.container.l;
    const CW = dims.genislik || result.container.w;
    const CH = dims.yukseklik || result.container.h;

    let displayTotal = 0;
    itemList.forEach(it => {
        if (it.tip === 'rollpack') {
            displayTotal += it.paketAdet || 1;
        } else {
            displayTotal += it.adet || 1;
        }
    });

    const placedRuloCount = result.placed.filter(p => p.tip === 'rulo' || p.tip === 'rollpack').length;
    const placedPlakaCount = result.placed.filter(p => p.tip === 'plaka').length;

    let maxX = 0, maxY = 0, maxZ = 0;
    result.placed.forEach(p => {
        if (p.x + p.l > maxX) maxX = p.x + p.l;
        if (p.y + p.h > maxY) maxY = p.y + p.h;
        if (p.z + p.w > maxZ) maxZ = p.z + p.w;
    });
    const emptyL = Math.max(0, CL - maxX);
    const emptyW = Math.max(0, CW - maxZ);
    const emptyH = Math.max(0, CH - maxY);
    const emptyVolM3 = result.container.volM3 - result.placedBBoxVolM3;

    const fillColor = result.fillPercent > 80 ? '#059669' : result.fillPercent > 50 ? '#d97706' : '#dc2626';

    // Sığmayan ürünler
    const displayNotPlaced = Math.max(0, displayTotal - result.placedCount);
    const placedCountById = {};
    result.placed.forEach(p => {
        if (p.sourceId != null) {
            placedCountById[p.sourceId] = (placedCountById[p.sourceId] || 0) + 1;
        }
    });

    let notFitRows = '';
    if (displayNotPlaced > 0) {
        itemList.forEach(it => {
            const realTotal = it.tip === 'rollpack' ? (it.paketAdet || 1) : (it.adet || 1);
            const placedForThis = placedCountById[it.id] || 0;
            const realPlaced = Math.min(realTotal, placedForThis);
            const notFit = realTotal - realPlaced;
            if (notFit > 0) {
                let sizeText = '';
                if (it.tip === 'plaka') sizeText = `${it.en}×${it.boy}×${it.kalinlik} cm`;
                else if (it.tip === 'rollpack') sizeText = `${it.en}×Ø${it.cap} cm`;
                else {
                    const ruloBoyuCm = it.ruloBoyu ? (it.ruloBoyu * 100) : 0;
                    const capNormal = Math.sqrt(it.kalinlik * ruloBoyuCm / Math.PI) * 2;
                    const vakum = it.vakum || 0;
                    const capVal = vakum > 0 ? capNormal * (1 - vakum / 100) : capNormal;
                    sizeText = `${it.en}×Ø${Math.round(capVal)} cm`;
                }
                notFitRows += `<tr><td>${sizeText}</td><td style="color:#dc2626;font-weight:600">${notFit} ${t('containerNotFitPcs')}</td></tr>`;
            }
        });
    }

    // Ürün listesi tablosu
    let productRows = '';
    const sourceColorMapPDF = result.sourceColorMap || {};
    itemList.forEach((it, idx) => {
        const tipLabel = it.tip === 'plaka' ? t('tipPlaka') : it.tip === 'rollpack' ? t('tipRollpack') : t('tipRulo');
        const adet = it.tip === 'rollpack' ? (it.paketAdet || 1) : (it.adet || 1);
        const cIdx = sourceColorMapPDF[it.id];
        const swatchColor = cIdx !== undefined ? CONTAINER_ITEM_COLORS[cIdx % CONTAINER_ITEM_COLORS.length].front : '#cbd5e1';
        const borderColor = cIdx !== undefined ? CONTAINER_ITEM_COLORS[cIdx % CONTAINER_ITEM_COLORS.length].right : '#94a3b8';
        productRows += `<tr>
            <td>${idx + 1}</td>
            <td><span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:${swatchColor};border:1.5px solid ${borderColor};vertical-align:middle;margin-right:6px;"></span>${tipLabel}</td>
            <td>${it.dims}</td>
            <td>${adet}</td>
            <td>${formatVolume(it.toplamM3)} m³</td>
        </tr>`;
    });

    const typeName = selectedContainerType === 'custom' ? t('containerCustom') : (CONTAINER_TYPES[selectedContainerType] ? CONTAINER_TYPES[selectedContainerType].name : '');
    const now = new Date();
    const dateStr = now.toLocaleDateString(currentLang === 'tr' ? 'tr-TR' : currentLang === 'de' ? 'de-DE' : currentLang === 'es' ? 'es-ES' : currentLang === 'sq' ? 'sq-AL' : 'en-US', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const htmlContent = `<!DOCTYPE html>
<html lang="${currentLang}">
<head>
<meta charset="UTF-8">
<title> </title>
<style>
    @page { margin: 0; size: A4; }
    html, body { margin: 0 !important; padding: 0 !important; width: 100%; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; font-size: 11pt; line-height: 1.5; }
    .pdf-header { display: flex; align-items: center; gap: 16px; margin: 0; padding: 16px 24px; border-radius: 0; background: #2563eb; color: white; }
    .pdf-header .pdf-logo { height: 50px; width: auto; }
    .pdf-header .pdf-divider { width: 2px; height: 50px; background: rgba(255,255,255,0.4); border-radius: 1px; }
    .pdf-header .pdf-title-block { flex: 1; }
    .pdf-header .pdf-title-block h1 { font-size: 20pt; color: white; margin-bottom: 0; line-height: 1.2; }
    .pdf-header .pdf-title-block h1 sup { font-size: 12pt; }
    .pdf-header .pdf-title-block p { font-size: 10pt; color: rgba(255,255,255,0.85); margin-top: 2px; }
    .pdf-header .pdf-meta { text-align: right; font-size: 9pt; color: rgba(255,255,255,0.8); white-space: nowrap; }
    .pdf-header .pdf-meta .container-info { font-size: 10pt; color: white; font-weight: 600; margin-top: 4px; }
    .pdf-content { padding: 16px 20px 0; }
    .section { margin-bottom: 18px; break-inside: avoid; page-break-inside: avoid; }
    .section h2 { font-size: 13pt; color: #2563eb; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1.5px solid #e2e8f0; }
    .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; break-inside: avoid; page-break-inside: avoid; }
    .stat-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; break-inside: avoid; page-break-inside: avoid; }
    .stat-box .label { font-size: 9pt; color: #64748b; }
    .stat-box .value { font-size: 13pt; font-weight: 700; color: #1e293b; }
    .stat-box .value.green { color: #059669; }
    .stat-box .value.fill { color: ${fillColor}; }
    .fill-bar-bg { height: 10px; background: #e2e8f0; border-radius: 5px; margin-top: 4px; overflow: hidden; }
    .fill-bar-fg { height: 100%; border-radius: 5px; background: ${fillColor}; width: ${Math.min(result.fillPercent, 100)}%; }
    table { width: 100%; border-collapse: collapse; font-size: 10pt; margin-top: 6px; }
    thead { display: table-header-group; }
    tr { break-inside: avoid; page-break-inside: avoid; }
    th { background: #2563eb; color: white; text-align: left; padding: 7px 10px; font-weight: 600; }
    td { padding: 6px 10px; border-bottom: 1px solid #e2e8f0; }
    tr:nth-child(even) td { background: #f8fafc; }
    .canvas-wrap { text-align: center; margin: 12px 0; break-inside: avoid; page-break-inside: avoid; }
    .canvas-wrap img { max-width: 100%; height: auto; border: 1px solid #e2e8f0; border-radius: 8px; }
    .warning-box { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 10px 14px; margin-top: 10px; color: #92400e; font-size: 10pt; break-inside: avoid; page-break-inside: avoid; }
    .success-box { background: #d1fae5; border: 1px solid #10b981; border-radius: 8px; padding: 10px 14px; margin-top: 10px; color: #065f46; font-size: 10pt; break-inside: avoid; page-break-inside: avoid; }
    .disclaimer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; color: #6366f1; font-size: 9pt; padding: 6px 8px 2px; border-top: 1px solid #e2e8f0; background: white; }
    .full-width { grid-column: 1 / -1; }
    .top-layout { display: flex; gap: 16px; align-items: flex-start; margin-bottom: 16px; break-inside: avoid; page-break-inside: avoid; }
    .top-layout .canvas-wrap { flex: 0 0 48%; margin: 0; }
    .top-layout .canvas-wrap img { width: 100%; height: auto; }
    .top-layout .report-side { flex: 1; min-width: 0; }
    .top-layout .report-side .stats-grid { grid-template-columns: 1fr 1fr; gap: 6px; }
    .top-layout .report-side .stat-box { padding: 7px 10px; }
    .top-layout .report-side .stat-box .label { font-size: 8pt; }
    .top-layout .report-side .stat-box .value { font-size: 11pt; }
    .top-layout .report-side h2 { font-size: 11pt; margin-bottom: 6px; }
    @media print { html, body { margin: 0 !important; padding: 0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; } .no-print { display: none !important; } .disclaimer { position: fixed; bottom: 0; left: 0; right: 0; } }
</style>
</head>
<body>
    <div class="pdf-header">
        ${logoDataURL ? `<img class="pdf-logo" src="${logoDataURL}" alt="Marfom">` : ''}
        <div class="pdf-divider"></div>
        <div class="pdf-title-block">
            <h1>M<sup>3</sup> Hesaplama</h1>
            <p>Sünger Metreküp Aracı</p>
        </div>
        <div class="pdf-meta">
            <div>${t('pdfDate')}: ${dateStr}</div>
            <div class="container-info">${typeName} — ${CL}×${CW}×${CH} cm</div>
        </div>
    </div>

    <div class="pdf-content">
    <div class="top-layout">
        ${canvasDataURL ? `<div class="canvas-wrap"><img src="${canvasDataURL}" alt="3D"></div>` : ''}
        <div class="report-side">
            <h2>${t('containerReportTitle')}</h2>
            <div class="stats-grid">
                <div class="stat-box">
                    <div class="label">${t('containerVol')}</div>
                    <div class="value">${formatVolume(result.container.volM3)} m³</div>
                </div>
                <div class="stat-box">
                    <div class="label">${t('containerCoveredVol')}</div>
                    <div class="value fill">${formatVolume(result.placedBBoxVolM3)} m³</div>
                </div>
                <div class="stat-box">
                    <div class="label">${t('containerProductVol')}</div>
                    <div class="value">${formatVolume(result.placedVolM3)} m³</div>
                </div>
                <div class="stat-box">
                    <div class="label">${t('containerPlacedItems')}</div>
                    <div class="value green">${result.placedCount} / ${displayTotal}</div>
                </div>
                <div class="stat-box">
                    <div class="label">${t('containerRuloPlaka')}</div>
                    <div class="value">${placedRuloCount} ${t('containerRuloUnit')} · ${placedPlakaCount} ${t('containerPlakaUnit')}</div>
                </div>
                <div class="stat-box">
                    <div class="label">${t('containerFillRate')}</div>
                    <div class="value fill">${result.fillPercent.toFixed(1)}%</div>
                    <div class="fill-bar-bg"><div class="fill-bar-fg"></div></div>
                </div>
            </div>
        </div>
    </div>

    ${displayNotPlaced > 0 ? `
    <div class="section">
        <div class="warning-box">
            ⚠️ <b>${displayNotPlaced}</b> ${t('containerNotFitPcs')}
            <table style="margin-top:8px;">${notFitRows}</table>
        </div>
    </div>` : `<div class="section"><div class="success-box">${t('containerAllFit')}</div></div>`}

    <div class="section">
        <h2>${t('pdfProductList')}</h2>
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>${t('pdfType')}</th>
                    <th>${t('pdfDims')}</th>
                    <th>${t('pdfQty')}</th>
                    <th>${t('pdfVolume')}</th>
                </tr>
            </thead>
            <tbody>${productRows}</tbody>
        </table>
    </div>

    </div>
    <div class="disclaimer">${t('containerDisclaimer')}</div>

    <script>window.onload=function(){window.print();}<\/script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (!win) {
        // Popup engellenmiş olabilir, alternatif yöntem
        const a = document.createElement('a');
        a.href = url;
        a.download = `konteyner-rapor-${now.toISOString().slice(0,10)}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
    setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function setupContainer3DRotation() {
    const canvas = document.getElementById('container3d');
    if (!canvas || canvas._rotSetup) return;
    canvas._rotSetup = true;

    function startDrag(mx) {
        cnt3dDragging = true;
        cnt3dLastMX = mx;
        canvas.style.cursor = 'grabbing';
    }
    function moveDrag(mx) {
        if (!cnt3dDragging) return;
        const dx = mx - cnt3dLastMX;
        cnt3dRotY += dx * 0.008;
        cnt3dLastMX = mx;
        scheduleRender3D();
    }
    function endDrag() {
        cnt3dDragging = false;
        canvas.style.cursor = 'grab';
    }

    // Mouse events
    canvas.addEventListener('mousedown', e => {
        e.preventDefault();
        startDrag(e.clientX);
    });
    window.addEventListener('mousemove', e => moveDrag(e.clientX));
    window.addEventListener('mouseup', endDrag);

    // Mouse wheel → zoom
    canvas.addEventListener('wheel', e => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.08 : 0.08;
        cnt3dZoom = Math.max(0.3, Math.min(5.0, cnt3dZoom + delta));
        scheduleRender3D();
    }, { passive: false });

    // Touch events
    canvas.addEventListener('touchstart', e => {
        if (e.touches.length === 1) {
            e.preventDefault();
            startDrag(e.touches[0].clientX);
        } else if (e.touches.length === 2) {
            // Pinch başlat
            cnt3dDragging = false;
            cnt3dPinchDist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
        }
    }, { passive: false });
    canvas.addEventListener('touchmove', e => {
        if (e.touches.length === 1 && cnt3dDragging) {
            e.preventDefault();
            moveDrag(e.touches[0].clientX);
        } else if (e.touches.length === 2) {
            // Pinch-to-zoom
            e.preventDefault();
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            if (cnt3dPinchDist > 0) {
                const ratio = dist / cnt3dPinchDist;
                cnt3dZoom = Math.max(0.3, Math.min(5.0, cnt3dZoom * ratio));
                cnt3dPinchDist = dist;
                scheduleRender3D();
            }
        }
    }, { passive: false });
    canvas.addEventListener('touchend', e => {
        endDrag();
        cnt3dPinchDist = 0;
    });
    canvas.addEventListener('touchcancel', e => {
        endDrag();
        cnt3dPinchDist = 0;
    });

    // Reset button (rotation + zoom)
    const resetBtn = document.getElementById('btn-reset-rotate');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            cnt3dRotY = 0;
            cnt3dZoom = 1.0;
            scheduleRender3D();
        });
    }

    // Zoom buttons
    const zoomInBtn = document.getElementById('btn-zoom-in');
    const zoomOutBtn = document.getElementById('btn-zoom-out');
    function doZoom(delta) {
        cnt3dZoom = Math.max(0.3, Math.min(5.0, cnt3dZoom + delta));
        scheduleRender3D();
    }
    if (zoomInBtn) zoomInBtn.addEventListener('click', () => doZoom(0.15));
    if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => doZoom(-0.15));
}

function renderContainer3D(dims, result) {
    const canvas = document.getElementById('container3d');
    setupContainer3DRotation();
    const container = canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const W = rect.width - 16;
    const H = 320;

    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // Beyaz arka plan
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, W, H);

    const CL = dims.uzunluk, CW = dims.genislik, CH = dims.yukseklik;

    // İzometrik projeksiyon + Y ekseni etrafında yatay döndürme
    const cosR = Math.cos(cnt3dRotY), sinR = Math.sin(cnt3dRotY);

    // Döndürme: konteyner merkezinden Y ekseninde döndür
    function rotateXZ(x, z) {
        const cx = x - CL / 2, cz = z - CW / 2;
        return {
            x: cx * cosR - cz * sinR + CL / 2,
            z: cx * sinR + cz * cosR + CW / 2
        };
    }

    // İzometrik ölçek (döndürülmüş bbox'a göre)
    const cpts = [
        [0,0],[CL,0],[CL,CW],[0,CW]
    ].map(c => rotateXZ(c[0], c[1]));
    let rxMin = Infinity, rxMax = -Infinity, rzMin = Infinity, rzMax = -Infinity;
    cpts.forEach(p => { rxMin = Math.min(rxMin, p.x); rxMax = Math.max(rxMax, p.x); rzMin = Math.min(rzMin, p.z); rzMax = Math.max(rzMax, p.z); });
    const effL = rxMax - rxMin;
    const effW = rzMax - rzMin;
    const isoBoundW = (effL + effW) * COS30;
    const isoBoundH = CH + (effL + effW) * SIN30;
    const padding = 60;
    const scale = Math.min((W - padding) / isoBoundW, (H - padding) / isoBoundH) * cnt3dZoom;

    function rawProj(x, y, z) {
        const r = rotateXZ(x, z);
        const rx = r.x - (rxMin + rxMax) / 2;
        const rz = r.z - (rzMin + rzMax) / 2;
        return {
            x: (rx - rz) * COS30 * scale,
            y: -y * scale + (rx + rz) * SIN30 * scale
        };
    }

    // Ortalama
    const rawPts = [
        rawProj(0,0,0), rawProj(CL,0,0), rawProj(CL,CH,0), rawProj(0,CH,0),
        rawProj(0,0,CW), rawProj(CL,0,CW), rawProj(CL,CH,CW), rawProj(0,CH,CW)
    ];
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    rawPts.forEach(p => { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); });
    const offsetX = W / 2 - (minX + maxX) / 2;
    const offsetY = H / 2 - (minY + maxY) / 2;

    function proj(x, y, z) {
        const r = rawProj(x, y, z);
        return { x: r.x + offsetX, y: r.y + offsetY };
    }

    // Derinlik: döndürülmüş x+z+y (büyük = kameraya yakın)
    function projDepth(x, y, z) {
        const r = rotateXZ(x, z);
        return r.x + r.z + y * 0.8;
    }

    // Renk paleti (global CONTAINER_ITEM_COLORS kullanılır)
    const COLORS = CONTAINER_ITEM_COLORS;


    // Ekran üzerinde (2D) bir poligonun saat yönünde (CW) veya tersi (CCW) olduğunu bulur.
    // Canvas koordinat sistemi (y-aşağı) için:
    // CCW (negatif alan) -> Öne bakan yüz (görünür)
    // CW (pozitif alan) -> Arkaya bakan yüz (görünmez)
    // Alan < 0 ise görünür kabul ediyoruz (tam 0 = kenardan bakış, çizme)
    function isFrontFace(pts) {
        let area = 0;
        for (let i = 0; i < pts.length; i++) {
            const j = (i + 1) % pts.length;
            area += pts[i].x * pts[j].y;
            area -= pts[j].x * pts[i].y;
        }
        return (area / 2) < -0.001; 
    }

    // 1) Konteyner yüzleri — Konteynerin içini görüyoruz.
    // Dışarıdan bakıldığında ön yüzler (duvarlar) çizimi engeller.
    // Ancak biz "içeriyi" görmek istiyoruz, bu yüzden:
    // Eğer bir yüzey "Bana bakıyorsa" (FrontFace), o duvar önümdedir -> ÇİZME (veya saydam çiz).
    // Eğer bir yüzey "Arkada kalıyorsa" (BackFace), o duvar arka duvardır -> ÇİZ.
    
    // Köşe noktaları (CCW tanım - dışa bakan nermaller için standart sıra)
    const cv = {
        fbl: proj(0,0,0), fbr: proj(CL,0,0), ftr: proj(CL,CH,0), ftl: proj(0,CH,0), // Front (z=0)
        bbl: proj(0,0,CW), bbr: proj(CL,0,CW), btr: proj(CL,CH,CW), btl: proj(0,CH,CW) // Back (z=CW)
    };

    // Yüzey tanımları (Noktalar dışarıdan bakıldığında CCW sırasında olmalı)
    // Left:   0, CH, CW ... x=0 yüzeyi
    // Right:  CL, 0, 0 ... x=CL yüzeyi
    // Bottom: 0, 0, CW ... y=0 yüzeyi
    // Top:    0, CH, 0 ... y=CH yüzeyi
    // Back:   CL, 0, CW ... z=CW yüzeyi
    // Front:  0, 0, 0 ... z=0 yüzeyi
    
    const cntFaces = [
        // Sol (-x)
        { pts: [cv.fbl, cv.bbl, cv.btl, cv.ftl] },
        // Sağ (+x)
        { pts: [cv.fbr, cv.ftr, cv.btr, cv.bbr] },
        // Alt (-y) - Taban
        { pts: [cv.fbl, cv.fbr, cv.bbr, cv.bbl] }, 
        // Üst (+y) - Tavan
        { pts: [cv.ftl, cv.btl, cv.btr, cv.ftr] }, 
        // Ön (-z)
        { pts: [cv.fbl, cv.ftl, cv.ftr, cv.fbr] },
        // Arka (+z)
        { pts: [cv.bbl, cv.bbr, cv.btr, cv.btl] }
    ];

    // Konteyner için mantık:
    // isFrontFace(face) == true  => Duvar bana bakıyor (önümü kapatıyor) -> ÇİZME (Culling)
    // isFrontFace(face) == false => Duvarın içyüzünü görüyorum -> ÇİZ (Arka plan olarak)
    
    for (const f of cntFaces) {
        if (!isFrontFace(f.pts)) {
            // Bu bir "iç yüzey" (arka duvar, taban vb.)
            ctx.save();
            ctx.globalAlpha = 0.12;
            ctx.fillStyle = '#3b82f6';
            
            ctx.beginPath();
            ctx.moveTo(f.pts[0].x, f.pts[0].y);
            for (let i = 1; i < f.pts.length; i++) ctx.lineTo(f.pts[i].x, f.pts[i].y);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }

    // Konteyner taban çizgisi (Grid)
    ctx.save();
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.12)';
    ctx.lineWidth = 0.5;
    const gridStep = 50;
    for (let x = 0; x <= CL; x += gridStep) {
        const p1 = proj(x, 0, 0);
        const p2 = proj(x, 0, CW);
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
    }
    for (let z = 0; z <= CW; z += gridStep) {
        const p1 = proj(0, 0, z);
        const p2 = proj(CL, 0, z);
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
    }
    ctx.restore();

    // 2) Yerleştirilmiş ürünler — Eksende Ayrıklık Testi ile sıralama
    //
    // Kamera bakış yönü (world space):
    //   camX = cosR + sinR  (X bileşeni)
    //   camZ = cosR - sinR  (Z bileşeni)
    //   camY = 1            (Y — her zaman yukarıdan bakıyor)
    //
    // Önceki yöntemlerin sorunu:
    //   - Tek skaler depth: 45°/135° açılarda bir eksen ağırlığı ≈ 0 olur
    //   - Merkez karşılaştırma: Farklı boyuttaki plakalar örtüşür, merkez yanıltır
    //
    // Doğru çözüm: Ayrıklık Testi (Separation Test)
    //   Her eksen için kutuların gerçekten ayrık mı (gap var mı) kontrol et.
    //   Ayrıksa → kamera yönüne göre hangisi arkada belirle.
    //   Örtüşüyorsa → bu eksen bir şey söyleyemez, sonraki eksene geç.
    //   Kutular fiziksel olarak kesişmediği için en az bir eksende ayrıktırlar.

    const camX = cosR + sinR;
    const camZ = cosR - sinR;
    const camY = 1;

    // Eksenleri kamera bileşen büyüklüğüne göre sırala
    // En güçlü bileşen = en güvenilir sıralama ekseni
    const sortAxes = [
        { key: 'x', size: 'l', cam: camX },
        { key: 'z', size: 'w', cam: camZ },
        { key: 'y', size: 'h', cam: camY },
    ].sort((a, b) => Math.abs(b.cam) - Math.abs(a.cam));

    const sortedPlaced = [...result.placed].sort((a, b) => {
        for (const ax of sortAxes) {
            const aMin = a[ax.key];
            const aMax = aMin + a[ax.size];
            const bMin = b[ax.key];
            const bMax = bMin + b[ax.size];

            if (aMax <= bMin + 0.1) {
                // A tamamen B'nin gerisinde (daha düşük koordinatta)
                // cam > 0 → düşük = kameradan uzak → A önce çizilir
                // cam < 0 → düşük = kameraya yakın → B önce çizilir
                return ax.cam >= 0 ? -1 : 1;
            }
            if (bMax <= aMin + 0.1) {
                // B tamamen A'nın gerisinde
                return ax.cam >= 0 ? 1 : -1;
            }
            // Bu eksende örtüşüyorlar → bu eksen sıralama yapamaz, sonraki eksene geç
        }
        // Hiçbir eksende ayrıklık yoksa (olmamalı) → depth fallback
        return projDepth(a.x + a.l/2, a.y + a.h/2, a.z + a.w/2)
             - projDepth(b.x + b.l/2, b.y + b.h/2, b.z + b.w/2);
    });

    sortedPlaced.forEach((p, idx) => {
      try {
        const color = COLORS[p.colorIdx % COLORS.length];
        const x = p.x, y = p.y, z = p.z;
        const l = p.l, w = p.w, h = p.h;

        if (p.tip === 'rulo' || p.tip === 'rollpack') {
            ctx.save();
            const cap = p.cap || (p.dik ? l : h);
            const cylH = p.cylH || (p.dik ? h : (p.ruloAxis === 'x' ? l : w));
            const radius = cap / 2;
            const N = 40;

            if (p.dik) {
                // ═══ DİK SİLİNDİR — Convex Hull (katı görünüm) ═══
                const cx3d = x + cap / 2;
                const cz3d = z + cap / 2;
                const yBot = y;
                const yTop = y + cylH;

                // Üst ve alt daire noktaları
                const topPts = [], botPts = [];
                for (let i = 0; i < N; i++) {
                    const ang = (i / N) * Math.PI * 2;
                    const px3 = cx3d + radius * Math.cos(ang);
                    const pz3 = cz3d + radius * Math.sin(ang);
                    topPts.push(proj(px3, yTop, pz3));
                    botPts.push(proj(px3, yBot, pz3));
                }

                // Kameraya yakın kapak (yüksek depth = yakın)
                const topDepth = projDepth(cx3d, yTop, cz3d);
                const botDepth = projDepth(cx3d, yBot, cz3d);
                const nearPts = topDepth > botDepth ? topPts : botPts;
                const farPts  = topDepth > botDepth ? botPts : topPts;

                // ── 1. Convex Hull: tüm noktalar → katı silüet ──
                const hullInput = [];
                for (let i = 0; i < N; i++) {
                    hullInput.push({ x: topPts[i].x, y: topPts[i].y });
                    hullInput.push({ x: botPts[i].x, y: botPts[i].y });
                }
                hullInput.sort((a, b) => a.x - b.x || a.y - b.y);
                function cross2dDik(O, A, B) {
                    return (A.x - O.x) * (B.y - O.y) - (A.y - O.y) * (B.x - O.x);
                }
                const lower = [];
                for (const pt of hullInput) {
                    while (lower.length >= 2 && cross2dDik(lower[lower.length-2], lower[lower.length-1], pt) <= 0) lower.pop();
                    lower.push(pt);
                }
                const upper = [];
                for (let i = hullInput.length - 1; i >= 0; i--) {
                    while (upper.length >= 2 && cross2dDik(upper[upper.length-2], upper[upper.length-1], hullInput[i]) <= 0) upper.pop();
                    upper.push(hullInput[i]);
                }
                lower.pop(); upper.pop();
                const hull = lower.concat(upper);

                // ── 2. Gövde: hull silüet + gradient ──
                ctx.beginPath();
                ctx.moveTo(hull[0].x, hull[0].y);
                for (let i = 1; i < hull.length; i++) ctx.lineTo(hull[i].x, hull[i].y);
                ctx.closePath();

                // Gradient: eksen yönüne DİK (silindirik kavislendirme)
                const nearCx = nearPts.reduce((s,pt) => s+pt.x, 0) / N;
                const nearCy = nearPts.reduce((s,pt) => s+pt.y, 0) / N;
                const farCx  = farPts.reduce((s,pt) => s+pt.x, 0) / N;
                const farCy  = farPts.reduce((s,pt) => s+pt.y, 0) / N;
                const axDx = nearCx - farCx;
                const axDy = nearCy - farCy;
                let pX = -axDy, pY = axDx;
                const pLen = Math.hypot(pX, pY) || 1;
                pX /= pLen; pY /= pLen;
                const midX = (nearCx + farCx) / 2;
                const midY = (nearCy + farCy) / 2;
                let dMin = Infinity, dMax = -Infinity;
                for (const hp of hull) {
                    const d = (hp.x - midX) * pX + (hp.y - midY) * pY;
                    if (d < dMin) dMin = d;
                    if (d > dMax) dMax = d;
                }
                const grd = ctx.createLinearGradient(
                    midX + dMin * pX, midY + dMin * pY,
                    midX + dMax * pX, midY + dMax * pY
                );
                grd.addColorStop(0, color.right);
                grd.addColorStop(0.35, color.left);
                grd.addColorStop(0.55, color.top);
                grd.addColorStop(0.75, color.left);
                grd.addColorStop(1, color.right);
                ctx.fillStyle = grd;
                ctx.fill();
                ctx.strokeStyle = 'rgba(0,0,0,0.25)';
                ctx.lineWidth = 0.7;
                ctx.stroke();

                // ── 3. Kameraya yakın kapak (katı dolgu) ──
                ctx.beginPath();
                ctx.moveTo(nearPts[0].x, nearPts[0].y);
                for (let i = 1; i < N; i++) ctx.lineTo(nearPts[i].x, nearPts[i].y);
                ctx.closePath();
                ctx.fillStyle = color.top;
                ctx.fill();
                ctx.strokeStyle = 'rgba(0,0,0,0.25)';
                ctx.lineWidth = 0.7;
                ctx.stroke();

                // ── 4. Kapak parlama ──
                const capCenterX = nearPts.reduce((s,pt) => s+pt.x, 0) / N;
                const capCenterY = nearPts.reduce((s,pt) => s+pt.y, 0) / N;
                const glowR = Math.max(...nearPts.map(pt => Math.hypot(pt.x - capCenterX, pt.y - capCenterY))) * 0.5;
                if (glowR > 2) {
                    const glow = ctx.createRadialGradient(capCenterX - glowR * 0.2, capCenterY - glowR * 0.2, 0, capCenterX, capCenterY, glowR);
                    glow.addColorStop(0, 'rgba(255,255,255,0.35)');
                    glow.addColorStop(1, 'rgba(255,255,255,0)');
                    ctx.beginPath();
                    ctx.moveTo(nearPts[0].x, nearPts[0].y);
                    for (let i = 1; i < N; i++) ctx.lineTo(nearPts[i].x, nearPts[i].y);
                    ctx.closePath();
                    ctx.fillStyle = glow;
                    ctx.fill();
                }

            } else {
                // ═══ YATIK SİLİNDİR — Convex Hull yaklaşımı ═══
                const alongX = (p.ruloAxis === 'x');
                const startPts = [], endPts = [];

                if (alongX) {
                    const cy3d = y + radius;
                    const cz3d = z + cap / 2;
                    for (let i = 0; i < N; i++) {
                        const ang = (i / N) * Math.PI * 2;
                        const py3 = cy3d + radius * Math.cos(ang);
                        const pz3 = cz3d + radius * Math.sin(ang);
                        startPts.push(proj(x, py3, pz3));
                        endPts.push(proj(x + cylH, py3, pz3));
                    }
                } else {
                    const cy3d = y + radius;
                    const cx3d = x + cap / 2;
                    for (let i = 0; i < N; i++) {
                        const ang = (i / N) * Math.PI * 2;
                        const py3 = cy3d + radius * Math.cos(ang);
                        const px3 = cx3d + radius * Math.sin(ang);
                        startPts.push(proj(px3, py3, z));
                        endPts.push(proj(px3, py3, z + cylH));
                    }
                }

                // Hangi kapak izleyiciye daha yakın? (projDepth kullan)
                let sDepth, eDepth;
                if (alongX) {
                    sDepth = projDepth(x, y + radius, z + cap / 2);
                    eDepth = projDepth(x + cylH, y + radius, z + cap / 2);
                } else {
                    sDepth = projDepth(x + cap / 2, y + radius, z);
                    eDepth = projDepth(x + cap / 2, y + radius, z + cylH);
                }
                const nearPts = eDepth > sDepth ? endPts : startPts;
                const farPts  = eDepth > sDepth ? startPts : endPts;

                // ── 1. Convex Hull: Tüm noktaların dış çerçevesi = silindir silüeti ──
                const hullInput = [];
                for (let i = 0; i < N; i++) {
                    hullInput.push({ x: farPts[i].x,  y: farPts[i].y });
                    hullInput.push({ x: nearPts[i].x, y: nearPts[i].y });
                }
                hullInput.sort((a, b) => a.x - b.x || a.y - b.y);

                function cross2d(O, A, B) {
                    return (A.x - O.x) * (B.y - O.y) - (A.y - O.y) * (B.x - O.x);
                }
                const lower = [];
                for (const pt of hullInput) {
                    while (lower.length >= 2 && cross2d(lower[lower.length-2], lower[lower.length-1], pt) <= 0) lower.pop();
                    lower.push(pt);
                }
                const upper = [];
                for (let i = hullInput.length - 1; i >= 0; i--) {
                    while (upper.length >= 2 && cross2d(upper[upper.length-2], upper[upper.length-1], hullInput[i]) <= 0) upper.pop();
                    upper.push(hullInput[i]);
                }
                lower.pop();
                upper.pop();
                const hull = lower.concat(upper);

                // ── 2. Gövde: hull ile çiz + gradient ──
                ctx.beginPath();
                ctx.moveTo(hull[0].x, hull[0].y);
                for (let i = 1; i < hull.length; i++) ctx.lineTo(hull[i].x, hull[i].y);
                ctx.closePath();

                // Gradient: eksen yönüne DİK (silindirik kavislilik)
                const nearCx = nearPts.reduce((s,pt) => s+pt.x, 0) / N;
                const nearCy = nearPts.reduce((s,pt) => s+pt.y, 0) / N;
                const farCx  = farPts.reduce((s,pt) => s+pt.x, 0) / N;
                const farCy  = farPts.reduce((s,pt) => s+pt.y, 0) / N;
                const axDx = nearCx - farCx;
                const axDy = nearCy - farCy;
                let pX = -axDy, pY = axDx;
                const pLen = Math.hypot(pX, pY) || 1;
                pX /= pLen; pY /= pLen;
                const midX = (nearCx + farCx) / 2;
                const midY = (nearCy + farCy) / 2;
                let dMin = Infinity, dMax = -Infinity;
                for (const h of hull) {
                    const d = (h.x - midX) * pX + (h.y - midY) * pY;
                    if (d < dMin) dMin = d;
                    if (d > dMax) dMax = d;
                }
                const grd = ctx.createLinearGradient(
                    midX + dMin * pX, midY + dMin * pY,
                    midX + dMax * pX, midY + dMax * pY
                );
                grd.addColorStop(0, color.right);
                grd.addColorStop(0.35, color.left);
                grd.addColorStop(0.55, color.top);
                grd.addColorStop(0.75, color.left);
                grd.addColorStop(1, color.right);
                ctx.fillStyle = grd;
                ctx.fill();
                ctx.strokeStyle = 'rgba(0,0,0,0.25)';
                ctx.lineWidth = 0.7;
                ctx.stroke();

                // ── 3. Yakın kapak (dik silindirin üst elipsi ile birebir aynı) ──
                ctx.beginPath();
                ctx.moveTo(nearPts[0].x, nearPts[0].y);
                for (let i = 1; i < N; i++) ctx.lineTo(nearPts[i].x, nearPts[i].y);
                ctx.closePath();
                ctx.fillStyle = color.top;
                ctx.fill();
                ctx.strokeStyle = 'rgba(0,0,0,0.25)';
                ctx.lineWidth = 0.7;
                ctx.stroke();

                // ── 4. Kapak parlama efekti ──
                const glowR = Math.max(...nearPts.map(pt => Math.hypot(pt.x - nearCx, pt.y - nearCy))) * 0.5;
                if (glowR > 2) {
                    const glow = ctx.createRadialGradient(nearCx - glowR * 0.2, nearCy - glowR * 0.2, 0, nearCx, nearCy, glowR);
                    glow.addColorStop(0, 'rgba(255,255,255,0.35)');
                    glow.addColorStop(1, 'rgba(255,255,255,0)');
                    ctx.beginPath();
                    ctx.moveTo(nearPts[0].x, nearPts[0].y);
                    for (let i = 1; i < N; i++) ctx.lineTo(nearPts[i].x, nearPts[i].y);
                    ctx.closePath();
                    ctx.fillStyle = glow;
                    ctx.fill();
                }
            }
            ctx.restore();
        } else {
            // Kutu çizimi (plaka) - rotasyona uyumlu yüz çizimi
            const pv = {
                fbl: proj(x,y,z), fbr: proj(x+l,y,z), ftr: proj(x+l,y+h,z), ftl: proj(x,y+h,z),
                bbl: proj(x,y,z+w), bbr: proj(x+l,y,z+w), btr: proj(x+l,y+h,z+w), btl: proj(x,y+h,z+w)
            };

            // 6 Yüz — Dışarıdan bakışa göre CCW sıralaması (konteyner ile tutarlı)
            const boxFaces = [
                { pts: [pv.fbl, pv.bbl, pv.btl, pv.ftl], c: color.left   },  // Sol (-x)
                { pts: [pv.fbr, pv.ftr, pv.btr, pv.bbr], c: color.right  },  // Sağ (+x)
                { pts: [pv.fbl, pv.fbr, pv.bbr, pv.bbl], c: color.bottom },  // Alt (-y)
                { pts: [pv.ftl, pv.btl, pv.btr, pv.ftr], c: color.top    },  // Üst (+y)
                { pts: [pv.fbl, pv.ftl, pv.ftr, pv.fbr], c: color.front  },  // Ön (-z)
                { pts: [pv.bbl, pv.bbr, pv.btr, pv.btl], c: color.right  },  // Arka (+z)
            ];
            
            // Görünür yüzleri hemen çiz (nesne bazlı — kutular birbiriyle kesişmediği için doğru)
            for (const f of boxFaces) {
                if (isFrontFace(f.pts)) {
                    ctx.beginPath();
                    ctx.moveTo(f.pts[0].x, f.pts[0].y);
                    for (let pi = 1; pi < f.pts.length; pi++) ctx.lineTo(f.pts[pi].x, f.pts[pi].y);
                    ctx.closePath();
                    ctx.fillStyle = f.c; ctx.fill();
                    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
                    ctx.lineWidth = 0.3;
                    ctx.stroke();
                }
            }
        }
      } catch (renderErr) {
        console.error(`Render hatası [${idx}] tip=${p.tip}:`, renderErr);
      }
    });

    // 3) Konteyner dış kenarları (wireframe) - tüm 12 kenar
    ctx.save();
    ctx.strokeStyle = 'rgba(37, 99, 235, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([]);
    const edges = [
        // Alt kare
        [cv.fbl, cv.fbr], [cv.fbr, cv.bbr], [cv.bbr, cv.bbl], [cv.bbl, cv.fbl],
        // Üst kare
        [cv.ftl, cv.ftr], [cv.ftr, cv.btr], [cv.btr, cv.btl], [cv.btl, cv.ftl],
        // Dikey kenarlar
        [cv.fbl, cv.ftl], [cv.fbr, cv.ftr], [cv.bbr, cv.btr], [cv.bbl, cv.btl]
    ];
    for (const [a, b] of edges) {
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    ctx.restore();

    // 4) Boyut etiketleri (döndürmeye uyumlu)
    ctx.save();
    const cntBotCenter = proj(CL/2, 0, CW/2);
    const cntMidCenter = proj(CL/2, CH/2, CW/2);
    function outwardOffset(from, center, dist) {
        const dx = from.x - center.x, dy = from.y - center.y;
        const d = Math.hypot(dx, dy) || 1;
        return { x: from.x + dx / d * dist, y: from.y + dy / d * dist };
    }

    // Uzunluk etiketi (X ekseni) — kameraya yakın alt X kenarını seç
    const xEdgeMidZ0 = midpoint(proj(0,0,0), proj(CL,0,0));
    const xEdgeMidZW = midpoint(proj(0,0,CW), proj(CL,0,CW));
    const xLbl = projDepth(CL/2,0,0) > projDepth(CL/2,0,CW) ? xEdgeMidZ0 : xEdgeMidZW;
    const xPos = outwardOffset(xLbl, cntBotCenter, 16);
    drawCntDimLabel(ctx, xPos.x, xPos.y, `${CL} cm`, '#2563eb');

    // Genişlik etiketi (Z ekseni) — kameraya yakın alt Z kenarını seç
    const zEdgeMidX0 = midpoint(proj(0,0,0), proj(0,0,CW));
    const zEdgeMidXL = midpoint(proj(CL,0,0), proj(CL,0,CW));
    const zLbl = projDepth(0,0,CW/2) > projDepth(CL,0,CW/2) ? zEdgeMidX0 : zEdgeMidXL;
    const zPos = outwardOffset(zLbl, cntBotCenter, 16);
    drawCntDimLabel(ctx, zPos.x, zPos.y, `${CW} cm`, '#2563eb');

    // Yükseklik etiketi — en öndeki dikey kenar
    const vEdges = [
        { mid: midpoint(proj(0,CH,0), proj(0,0,0)), depth: projDepth(0,CH/2,0) },
        { mid: midpoint(proj(CL,CH,0), proj(CL,0,0)), depth: projDepth(CL,CH/2,0) },
        { mid: midpoint(proj(CL,CH,CW), proj(CL,0,CW)), depth: projDepth(CL,CH/2,CW) },
        { mid: midpoint(proj(0,CH,CW), proj(0,0,CW)), depth: projDepth(0,CH/2,CW) },
    ];
    const frontVE = vEdges.reduce((a, b) => b.depth > a.depth ? b : a);
    const hPos = outwardOffset(frontVE.mid, cntMidCenter, 18);
    drawCntDimLabel(ctx, hPos.x, hPos.y, `${CH} cm`, '#2563eb');

    ctx.restore();

    // Başlık
    ctx.save();
    ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#475569';
    const typeName = selectedContainerType === 'custom' ? 'Özel Konteyner' : CONTAINER_TYPES[selectedContainerType].name;
    // Gerçek fiziksel paket/ürün sayısını göster
    let displayTotal3D = 0;
    itemList.forEach(it => {
        if (it.tip === 'rollpack') {
            displayTotal3D += it.paketAdet || 1;
        } else {
            displayTotal3D += it.adet || 1;
        }
    });
    ctx.fillText(t('containerSummary', { type: typeName, placed: result.placedCount, total: displayTotal3D, pct: result.fillPercent.toFixed(0) }), W / 2, H - 8);
    ctx.restore();
}

function drawCntDimLabel(ctx, x, y, text, color) {
    ctx.save();
    ctx.font = 'bold 9px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const m = ctx.measureText(text);
    const tw = m.width + 8;
    const th = 14;
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    roundRect(ctx, x - tw/2, y - th/2, tw, th, 3);
    ctx.fill();
    ctx.strokeStyle = color + '50';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.restore();
}

// ==========================================
// ÇOK DİLLİ DESTEK (i18n)
// ==========================================

let currentLang = 'tr';

const translations = {
    tr: {
        // Header
        headerTitle: 'M³ Hesaplama',
        headerSubtitle: 'Sünger Metreküp Aracı',
        // Tabs
        tabPlaka: 'Plaka Sünger',
        tabRulo: 'Rulo Sünger',
        tabRollpack: 'Rollpack',
        // Card titles
        plakaTitle: 'Plaka Sünger Ölçüleri',
        ruloTitle: 'Rulo Sünger Ölçüleri',
        rollpackTitle: 'Rollpack Ölçüleri',
        // Labels
        labelEn: 'En (cm)',
        labelBoy: 'Boy (cm)',
        labelKalinlik: 'Kalınlık (cm)',
        labelAdet: 'Adet',
        labelRuloBoyu: 'Rulo Boyu (m)',
        labelVakum: 'Vakum (%)',
        labelCap: 'Çap (cm)',
        labelPaketAdeti: 'Paket Adeti',
        rollpackProductTitle: '📦 Ürün Ölçüleri',
        labelUrunEn: 'En (cm)',
        labelUrunBoy: 'Boy (cm)',
        labelUrunYukseklik: 'Yükseklik (cm)',
        labelUrunAdet: 'Adet',
        // Result
        resultLabel: 'Hesaplanan Hacim',
        resultHint: 'Ölçüleri girerek hesaplayın',
        // Buttons
        btnAdd: '➕ Listeye Ekle',
        btnUpdate: '✏️ Güncelle',
        btnCancel: '✖ İptal',
        btnShare: '📤 Paylaş',
        btnContainer: '🚛 Konteyner',
        btnClear: '🗑️ Temizle',
        // List
        listTitle: '📋 Ürün Listesi',
        emptyList: 'Henüz ürün eklenmedi',
        emptyHint: 'Ölçüleri girip "Listeye Ekle" butonuna basın',
        totalLabel: 'TOPLAM',
        plakaToplam: 'Plaka Toplam',
        ruloToplam: 'Rulo Toplam',
        // Footer
        footer: 'Sünger M³ Hesaplama © 2026',
        // Dynamic texts
        itemCount: '{n} ürün',
        summary: '{k} kalem | {a} adet',
        tipPlaka: 'Plaka Sünger',
        tipRulo: 'Rulo Sünger',
        tipRollpack: 'Rollpack',
        adetLabel: 'Adet',
        birimLabel: 'Birim',
        urunLabel: 'ürün',
        paketLabel: 'paket',
        // Toast messages
        toastAdded: '✅ Listeye eklendi!',
        toastUpdated: '✅ Ürün güncellendi!',
        toastDeleted: '🗑️ Silindi',
        toastCleared: '🗑️ Liste temizlendi',
        toastListEmpty: '⚠️ Liste boş',
        toastShared: '✅ Paylaşıldı!',
        toastCopied: '📋 Kopyalandı!',
        toastCopyFailed: '⚠️ Kopyalama başarısız',
        toastAddFirst: '⚠️ Önce listeye ürün ekleyin',
        toastEnterDims: '⚠️ Konteyner ölçülerini girin',
        toastNoItems: '⚠️ Listede ürün yok',
        toastCalcError: '❌ Hesaplama hatası: ',
        toastReportError: '❌ Rapor oluşturma hatası: ',
        toastRenderError: '❌ 3D render hatası: ',
        // Validation
        warnMinEn: '⚠️ En değeri minimum 5 cm olmalıdır',
        warnMaxEn: '⚠️ En değeri maksimum 220 cm olmalıdır',
        // Share text
        shareTitle: '🧽 SÜNGER LİSTESİ',
        shareOlcu: 'Ölçü',
        shareBirimHacim: 'Birim Hacim',
        shareToplam: 'Toplam',
        shareTotalLine: 'TOPLAM: {k} kalem | {a} adet',
        shareTotalVolume: 'TOPLAM HACİM: {v} m³',
        shareListTitle: '🧽 Sünger Listesi',
        shareMenuTitle: 'Listeyi Paylaş',
        // Confirm dialog
        confirmTitle: 'Listeyi Temizle',
        confirmMsg: 'Tüm liste silinecek. Emin misiniz?',
        confirmCancel: 'İptal',
        confirmOk: 'Evet, Temizle',
        // Container
        containerTitle: '🚛 Konteyner Yükleme Simülasyonu',
        containerType: 'Konteyner Tipi',
        containerCustom: 'Özel',
        containerCustomDims: 'Ölçü gir',
        containerCalcBtn: '📐 Hesapla & Görselleştir',
        containerReportTitle: '📊 Yükleme Raporu',
        containerLength: 'Uzunluk (cm)',
        containerWidth: 'Genişlik (cm)',
        containerHeight: 'Yükseklik (cm)',
        containerAllFit: '✅ Tüm ürünler konteynere sığdı!',
        containerSummary: '{type} · {placed}/{total} ürün · %{pct} dolu',
        containerVol: 'Konteyner Hacmi',
        containerCoveredVol: 'Kaplanan Hacim',
        containerProductVol: 'Paketlenen Ürün Hacmi',
        containerPlacedItems: 'Yerleşen Paket',
        containerRuloPlaka: 'Rulo / Plaka',
        containerFillRate: 'Doluluk Oranı',
        containerEmptySpace: '📦 Konteynerde Boş Kalan Alan',
        containerEmptyLength: 'Boş kalan uzunluk',
        containerEmptyWidth: 'Boş kalan genişlik',
        containerEmptyHeight: 'Boş kalan yükseklik',
        containerEmptyVol: 'Boş kalan hacim',
        containerNotFit: '⚠️ <b>{n}</b> ürün sığmadı ({v} m³)',
        containerNotFitPcs: 'adet sığmadı',
        containerRuloUnit: 'rulo',
        containerPlakaUnit: 'plaka',
        containerDisclaimer: 'ℹ️ Bu hesaplama sanal bir simülasyondur. Gerçek yüklemede ±%10 sapma payı bulunabilir.',
        // Vakum
        vakumCapNormal: 'Çap: <b>{cap} cm</b>',
        vakumCapVakumlu: 'Çap: <b>{cap} cm</b> → Vakumlu: <b style="color:#c0392b">{vcap} cm</b>',
        vakumCapDefault: 'Vakumlu çap: —',
        // Düzenle / Sil
        editTooltip: 'Düzenle',
        deleteTooltip: 'Sil',
        // Install guide  
        installGuideTitle: '📲 Ana Ekrana Ekle',
        // Rollpack dims
        rollpackDims: '{en} cm × Çap {cap} cm × {paket} paket',
        rollpackM3Label: 'Rollpack M³',
        urunM3Label: 'Ürün M³',
        pdfExportBtn: 'PDF Rapor İndir',
        pdfTitle: 'Konteyner Yükleme Raporu',
        pdfDate: 'Tarih',
        pdfProductList: 'Ürün Listesi',
        pdfDims: 'Ölçüler',
        pdfQty: 'Adet',
        pdfVolume: 'Hacim',
        pdfType: 'Tip',
        pdfContainerDims: 'Konteyner Ölçüleri',
    },
    en: {
        headerTitle: 'M³ Calculator',
        headerSubtitle: 'Sponge Volume Tool',
        tabPlaka: 'Sheet Sponge',
        tabRulo: 'Roll Sponge',
        tabRollpack: 'Rollpack',
        plakaTitle: 'Sheet Sponge Dimensions',
        ruloTitle: 'Roll Sponge Dimensions',
        rollpackTitle: 'Rollpack Dimensions',
        labelEn: 'Width (cm)',
        labelBoy: 'Length (cm)',
        labelKalinlik: 'Thickness (cm)',
        labelAdet: 'Quantity',
        labelRuloBoyu: 'Roll Length (m)',
        labelVakum: 'Vacuum (%)',
        labelCap: 'Diameter (cm)',
        labelPaketAdeti: 'Package Qty',
        rollpackProductTitle: '📦 Product Dimensions',
        labelUrunEn: 'Width (cm)',
        labelUrunBoy: 'Length (cm)',
        labelUrunYukseklik: 'Height (cm)',
        labelUrunAdet: 'Quantity',
        resultLabel: 'Calculated Volume',
        resultHint: 'Enter dimensions to calculate',
        btnAdd: '➕ Add to List',
        btnUpdate: '✏️ Update',
        btnCancel: '✖ Cancel',
        btnShare: '📤 Share',
        btnContainer: '🚛 Container',
        btnClear: '🗑️ Clear',
        listTitle: '📋 Product List',
        emptyList: 'No products added yet',
        emptyHint: 'Enter dimensions and press "Add to List"',
        totalLabel: 'TOTAL',
        plakaToplam: 'Sheet Total',
        ruloToplam: 'Roll Total',
        footer: 'Sponge M³ Calculator © 2026',
        itemCount: '{n} items',
        summary: '{k} items | {a} pcs',
        tipPlaka: 'Sheet Sponge',
        tipRulo: 'Roll Sponge',
        tipRollpack: 'Rollpack',
        adetLabel: 'Qty',
        birimLabel: 'Unit',
        urunLabel: 'product',
        paketLabel: 'package',
        toastAdded: '✅ Added to list!',
        toastUpdated: '✅ Product updated!',
        toastDeleted: '🗑️ Deleted',
        toastCleared: '🗑️ List cleared',
        toastListEmpty: '⚠️ List is empty',
        toastShared: '✅ Shared!',
        toastCopied: '📋 Copied!',
        toastCopyFailed: '⚠️ Copy failed',
        toastAddFirst: '⚠️ Add products to list first',
        toastEnterDims: '⚠️ Enter container dimensions',
        toastNoItems: '⚠️ No items in list',
        toastCalcError: '❌ Calculation error: ',
        toastReportError: '❌ Report error: ',
        toastRenderError: '❌ 3D render error: ',
        warnMinEn: '⚠️ Width must be at least 5 cm',
        warnMaxEn: '⚠️ Width must be at most 220 cm',
        shareTitle: '🧽 SPONGE LIST',
        shareOlcu: 'Dims',
        shareBirimHacim: 'Unit Volume',
        shareToplam: 'Total',
        shareTotalLine: 'TOTAL: {k} items | {a} pcs',
        shareTotalVolume: 'TOTAL VOLUME: {v} m³',
        shareListTitle: '🧽 Sponge List',
        shareMenuTitle: 'Share List',
        confirmTitle: 'Clear List',
        confirmMsg: 'All items will be deleted. Are you sure?',
        confirmCancel: 'Cancel',
        confirmOk: 'Yes, Clear',
        containerTitle: '🚛 Container Loading Simulation',
        containerType: 'Container Type',
        containerCustom: 'Custom',
        containerCustomDims: 'Enter dims',
        containerCalcBtn: '📐 Calculate & Visualize',
        containerReportTitle: '📊 Loading Report',
        containerLength: 'Length (cm)',
        containerWidth: 'Width (cm)',
        containerHeight: 'Height (cm)',
        containerAllFit: '✅ All products fit in the container!',
        containerSummary: '{type} · {placed}/{total} items · {pct}% full',
        containerVol: 'Container Volume',
        containerCoveredVol: 'Covered Volume',
        containerProductVol: 'Product Volume',
        containerPlacedItems: 'Items Placed',
        containerRuloPlaka: 'Roll / Sheet',
        containerFillRate: 'Fill Rate',
        containerEmptySpace: '📦 Empty Space in Container',
        containerEmptyLength: 'Empty length',
        containerEmptyWidth: 'Empty width',
        containerEmptyHeight: 'Empty height',
        containerEmptyVol: 'Empty volume',
        containerNotFit: '⚠️ <b>{n}</b> items did not fit ({v} m³)',
        containerNotFitPcs: 'pcs did not fit',
        containerRuloUnit: 'roll',
        containerPlakaUnit: 'sheet',
        containerDisclaimer: 'ℹ️ This is a virtual simulation. Actual loading may vary by ±10%.',
        vakumCapNormal: 'Dia: <b>{cap} cm</b>',
        vakumCapVakumlu: 'Dia: <b>{cap} cm</b> → Vacuum: <b style="color:#c0392b">{vcap} cm</b>',
        vakumCapDefault: 'Vacuum dia: —',
        editTooltip: 'Edit',
        deleteTooltip: 'Delete',
        installGuideTitle: '📲 Add to Home Screen',
        rollpackDims: '{en} cm × Dia {cap} cm × {paket} pkg',
        rollpackM3Label: 'Rollpack M³',
        urunM3Label: 'Product M³',
        pdfExportBtn: 'Download PDF Report',
        pdfTitle: 'Container Loading Report',
        pdfDate: 'Date',
        pdfProductList: 'Product List',
        pdfDims: 'Dimensions',
        pdfQty: 'Qty',
        pdfVolume: 'Volume',
        pdfType: 'Type',
        pdfContainerDims: 'Container Dimensions',
    },
    de: {
        headerTitle: 'M³ Rechner',
        headerSubtitle: 'Schwamm-Volumen-Tool',
        tabPlaka: 'Plattenschwamm',
        tabRulo: 'Rollenschwamm',
        tabRollpack: 'Rollpack',
        plakaTitle: 'Plattenschwamm Maße',
        ruloTitle: 'Rollenschwamm Maße',
        rollpackTitle: 'Rollpack Maße',
        labelEn: 'Breite (cm)',
        labelBoy: 'Länge (cm)',
        labelKalinlik: 'Dicke (cm)',
        labelAdet: 'Menge',
        labelRuloBoyu: 'Rollenlänge (m)',
        labelVakum: 'Vakuum (%)',
        labelCap: 'Durchmesser (cm)',
        labelPaketAdeti: 'Paketmenge',
        rollpackProductTitle: '📦 Produktmaße',
        labelUrunEn: 'Breite (cm)',
        labelUrunBoy: 'Länge (cm)',
        labelUrunYukseklik: 'Höhe (cm)',
        labelUrunAdet: 'Menge',
        resultLabel: 'Berechnetes Volumen',
        resultHint: 'Maße eingeben zum Berechnen',
        btnAdd: '➕ Zur Liste hinzufügen',
        btnUpdate: '✏️ Aktualisieren',
        btnCancel: '✖ Abbrechen',
        btnShare: '📤 Teilen',
        btnContainer: '🚛 Container',
        btnClear: '🗑️ Löschen',
        listTitle: '📋 Produktliste',
        emptyList: 'Noch keine Produkte hinzugefügt',
        emptyHint: 'Maße eingeben und "Zur Liste hinzufügen" drücken',
        totalLabel: 'GESAMT',
        plakaToplam: 'Platten Gesamt',
        ruloToplam: 'Rollen Gesamt',
        footer: 'Schwamm M³ Rechner © 2026',
        itemCount: '{n} Produkte',
        summary: '{k} Posten | {a} Stk.',
        tipPlaka: 'Plattenschwamm',
        tipRulo: 'Rollenschwamm',
        tipRollpack: 'Rollpack',
        adetLabel: 'Stk.',
        birimLabel: 'Einheit',
        urunLabel: 'Produkt',
        paketLabel: 'Paket',
        toastAdded: '✅ Zur Liste hinzugefügt!',
        toastUpdated: '✅ Produkt aktualisiert!',
        toastDeleted: '🗑️ Gelöscht',
        toastCleared: '🗑️ Liste gelöscht',
        toastListEmpty: '⚠️ Liste ist leer',
        toastShared: '✅ Geteilt!',
        toastCopied: '📋 Kopiert!',
        toastCopyFailed: '⚠️ Kopieren fehlgeschlagen',
        toastAddFirst: '⚠️ Zuerst Produkte zur Liste hinzufügen',
        toastEnterDims: '⚠️ Containermaße eingeben',
        toastNoItems: '⚠️ Keine Produkte in der Liste',
        toastCalcError: '❌ Berechnungsfehler: ',
        toastReportError: '❌ Berichtsfehler: ',
        toastRenderError: '❌ 3D-Renderfehler: ',
        warnMinEn: '⚠️ Breite muss mindestens 5 cm betragen',
        warnMaxEn: '⚠️ Breite darf maximal 220 cm betragen',
        shareTitle: '🧽 SCHWAMM-LISTE',
        shareOlcu: 'Maße',
        shareBirimHacim: 'Einzelvolumen',
        shareToplam: 'Gesamt',
        shareTotalLine: 'GESAMT: {k} Posten | {a} Stk.',
        shareTotalVolume: 'GESAMTVOLUMEN: {v} m³',
        shareListTitle: '🧽 Schwamm-Liste',
        shareMenuTitle: 'Liste teilen',
        confirmTitle: 'Liste löschen',
        confirmMsg: 'Alle Einträge werden gelöscht. Sind Sie sicher?',
        confirmCancel: 'Abbrechen',
        confirmOk: 'Ja, löschen',
        containerTitle: '🚛 Container-Beladungssimulation',
        containerType: 'Containertyp',
        containerCustom: 'Benutzerdefiniert',
        containerCustomDims: 'Maße eingeben',
        containerCalcBtn: '📐 Berechnen & Visualisieren',
        containerReportTitle: '📊 Beladungsbericht',
        containerLength: 'Länge (cm)',
        containerWidth: 'Breite (cm)',
        containerHeight: 'Höhe (cm)',
        containerAllFit: '✅ Alle Produkte passen in den Container!',
        containerSummary: '{type} · {placed}/{total} Produkte · {pct}% voll',
        containerVol: 'Containervolumen',
        containerCoveredVol: 'Belegtes Volumen',
        containerProductVol: 'Produktvolumen',
        containerPlacedItems: 'Platzierte Produkte',
        containerRuloPlaka: 'Rolle / Platte',
        containerFillRate: 'Füllgrad',
        containerEmptySpace: '📦 Freier Platz im Container',
        containerEmptyLength: 'Freie Länge',
        containerEmptyWidth: 'Freie Breite',
        containerEmptyHeight: 'Freie Höhe',
        containerEmptyVol: 'Freies Volumen',
        containerNotFit: '⚠️ <b>{n}</b> Produkte passten nicht ({v} m³)',
        containerNotFitPcs: 'Stk. passten nicht',
        containerRuloUnit: 'Rolle',
        containerPlakaUnit: 'Platte',
        containerDisclaimer: 'ℹ️ Dies ist eine virtuelle Simulation. Die tatsächliche Beladung kann um ±10% abweichen.',
        vakumCapNormal: 'Durchm.: <b>{cap} cm</b>',
        vakumCapVakumlu: 'Durchm.: <b>{cap} cm</b> → Vakuum: <b style="color:#c0392b">{vcap} cm</b>',
        vakumCapDefault: 'Vakuum-Durchm.: —',
        editTooltip: 'Bearbeiten',
        deleteTooltip: 'Löschen',
        installGuideTitle: '📲 Zum Startbildschirm hinzufügen',
        rollpackDims: '{en} cm × Durchm. {cap} cm × {paket} Pkg.',
        rollpackM3Label: 'Rollpack M³',
        urunM3Label: 'Produkt M³',
        pdfExportBtn: 'PDF-Bericht herunterladen',
        pdfTitle: 'Container-Beladungsbericht',
        pdfDate: 'Datum',
        pdfProductList: 'Produktliste',
        pdfDims: 'Maße',
        pdfQty: 'Menge',
        pdfVolume: 'Volumen',
        pdfType: 'Typ',
        pdfContainerDims: 'Containermaße',
    },
    es: {
        headerTitle: 'Calculadora M³',
        headerSubtitle: 'Herramienta de Volumen de Espuma',
        tabPlaka: 'Espuma en Placa',
        tabRulo: 'Espuma en Rollo',
        tabRollpack: 'Rollpack',
        plakaTitle: 'Medidas de Espuma en Placa',
        ruloTitle: 'Medidas de Espuma en Rollo',
        rollpackTitle: 'Medidas de Rollpack',
        labelEn: 'Ancho (cm)',
        labelBoy: 'Largo (cm)',
        labelKalinlik: 'Grosor (cm)',
        labelAdet: 'Cantidad',
        labelRuloBoyu: 'Largo del Rollo (m)',
        labelVakum: 'Vacío (%)',
        labelCap: 'Diámetro (cm)',
        labelPaketAdeti: 'Cant. Paquete',
        rollpackProductTitle: '📦 Medidas del Producto',
        labelUrunEn: 'Ancho (cm)',
        labelUrunBoy: 'Largo (cm)',
        labelUrunYukseklik: 'Alto (cm)',
        labelUrunAdet: 'Cantidad',
        resultLabel: 'Volumen Calculado',
        resultHint: 'Ingrese medidas para calcular',
        btnAdd: '➕ Agregar a Lista',
        btnUpdate: '✏️ Actualizar',
        btnCancel: '✖ Cancelar',
        btnShare: '📤 Compartir',
        btnContainer: '🚛 Contenedor',
        btnClear: '🗑️ Limpiar',
        listTitle: '📋 Lista de Productos',
        emptyList: 'Aún no se han agregado productos',
        emptyHint: 'Ingrese medidas y presione "Agregar a Lista"',
        totalLabel: 'TOTAL',
        plakaToplam: 'Total Placa',
        ruloToplam: 'Total Rollo',
        footer: 'Calculadora M³ de Espuma © 2026',
        itemCount: '{n} productos',
        summary: '{k} ítems | {a} pzas.',
        tipPlaka: 'Espuma en Placa',
        tipRulo: 'Espuma en Rollo',
        tipRollpack: 'Rollpack',
        adetLabel: 'Cant.',
        birimLabel: 'Unidad',
        urunLabel: 'producto',
        paketLabel: 'paquete',
        toastAdded: '✅ ¡Agregado a la lista!',
        toastUpdated: '✅ ¡Producto actualizado!',
        toastDeleted: '🗑️ Eliminado',
        toastCleared: '🗑️ Lista limpiada',
        toastListEmpty: '⚠️ La lista está vacía',
        toastShared: '✅ ¡Compartido!',
        toastCopied: '📋 ¡Copiado!',
        toastCopyFailed: '⚠️ Error al copiar',
        toastAddFirst: '⚠️ Primero agregue productos a la lista',
        toastEnterDims: '⚠️ Ingrese medidas del contenedor',
        toastNoItems: '⚠️ No hay productos en la lista',
        toastCalcError: '❌ Error de cálculo: ',
        toastReportError: '❌ Error de reporte: ',
        toastRenderError: '❌ Error de renderizado 3D: ',
        warnMinEn: '⚠️ El ancho debe ser al menos 5 cm',
        warnMaxEn: '⚠️ El ancho no debe superar 220 cm',
        shareTitle: '🧽 LISTA DE ESPUMAS',
        shareOlcu: 'Medidas',
        shareBirimHacim: 'Volumen Unitario',
        shareToplam: 'Total',
        shareTotalLine: 'TOTAL: {k} ítems | {a} pzas.',
        shareTotalVolume: 'VOLUMEN TOTAL: {v} m³',
        shareListTitle: '🧽 Lista de Espumas',
        shareMenuTitle: 'Compartir Lista',
        confirmTitle: 'Limpiar Lista',
        confirmMsg: 'Se eliminarán todos los registros. ¿Está seguro?',
        confirmCancel: 'Cancelar',
        confirmOk: 'Sí, limpiar',
        containerTitle: '🚛 Simulación de Carga de Contenedor',
        containerType: 'Tipo de Contenedor',
        containerCustom: 'Personalizado',
        containerCustomDims: 'Ingresar medidas',
        containerCalcBtn: '📐 Calcular y Visualizar',
        containerReportTitle: '📊 Informe de Carga',
        containerLength: 'Largo (cm)',
        containerWidth: 'Ancho (cm)',
        containerHeight: 'Alto (cm)',
        containerAllFit: '✅ ¡Todos los productos caben en el contenedor!',
        containerSummary: '{type} · {placed}/{total} productos · {pct}% lleno',
        containerVol: 'Volumen del Contenedor',
        containerCoveredVol: 'Volumen Cubierto',
        containerProductVol: 'Volumen de Producto',
        containerPlacedItems: 'Productos Colocados',
        containerRuloPlaka: 'Rollo / Placa',
        containerFillRate: 'Tasa de Llenado',
        containerEmptySpace: '📦 Espacio Vacío en el Contenedor',
        containerEmptyLength: 'Largo vacío',
        containerEmptyWidth: 'Ancho vacío',
        containerEmptyHeight: 'Alto vacío',
        containerEmptyVol: 'Volumen vacío',
        containerNotFit: '⚠️ <b>{n}</b> productos no caben ({v} m³)',
        containerNotFitPcs: 'uds. no caben',
        containerRuloUnit: 'rollo',
        containerPlakaUnit: 'placa',
        containerDisclaimer: 'ℹ️ Esta es una simulación virtual. La carga real puede variar en ±10%.',
        vakumCapNormal: 'Diám.: <b>{cap} cm</b>',
        vakumCapVakumlu: 'Diám.: <b>{cap} cm</b> → Vacío: <b style="color:#c0392b">{vcap} cm</b>',
        vakumCapDefault: 'Diám. vacío: —',
        editTooltip: 'Editar',
        deleteTooltip: 'Eliminar',
        installGuideTitle: '📲 Agregar a Pantalla de Inicio',
        rollpackDims: '{en} cm × Diám. {cap} cm × {paket} paq.',
        rollpackM3Label: 'Rollpack M³',
        urunM3Label: 'Producto M³',
        pdfExportBtn: 'Descargar Informe PDF',
        pdfTitle: 'Informe de Carga del Contenedor',
        pdfDate: 'Fecha',
        pdfProductList: 'Lista de Productos',
        pdfDims: 'Medidas',
        pdfQty: 'Cant.',
        pdfVolume: 'Volumen',
        pdfType: 'Tipo',
        pdfContainerDims: 'Medidas del Contenedor',
    },
    sq: {
        headerTitle: 'Llogaritës M³',
        headerSubtitle: 'Mjeti i Vëllimit të Sfungjerit',
        tabPlaka: 'Pllakë',
        tabRulo: 'Rulo',
        tabRollpack: 'Rollpack',
        plakaTitle: 'Përmasat e Sfungjerit Pllakë',
        ruloTitle: 'Përmasat e Sfungjerit Rulo',
        rollpackTitle: 'Përmasat e Rollpack',
        labelEn: 'Gjerësia (cm)',
        labelBoy: 'Gjatësia (cm)',
        labelKalinlik: 'Trashësia (cm)',
        labelAdet: 'Sasi',
        labelRuloBoyu: 'Gjatësia e Ruloit (m)',
        labelVakum: 'Vakum (%)',
        labelCap: 'Diametri (cm)',
        labelPaketAdeti: 'Sasi Pakete',
        rollpackProductTitle: '📦 Përmasat e Produktit',
        labelUrunEn: 'Gjerësia (cm)',
        labelUrunBoy: 'Gjatësia (cm)',
        labelUrunYukseklik: 'Lartësia (cm)',
        labelUrunAdet: 'Sasi',
        resultLabel: 'Vëllimi i Llogaritur',
        resultHint: 'Vendosni përmasat për të llogaritur',
        btnAdd: '➕ Shto në Listë',
        btnUpdate: '✏️ Përditëso',
        btnCancel: '✖ Anulo',
        btnShare: '📤 Shpërndaj',
        btnContainer: '🚛 Kontejner',
        btnClear: '🗑️ Pastro',
        listTitle: '📋 Lista e Produkteve',
        emptyList: 'Nuk është shtuar asnjog produkt',
        emptyHint: 'Vendosni përmasat dhe shtypni "Shto në Listë"',
        totalLabel: 'TOTAL',
        plakaToplam: 'Total Pllakë',
        ruloToplam: 'Total Rulo',
        footer: 'Llogaritës M³ Sfungjer © 2026',
        itemCount: '{n} produkte',
        summary: '{k} zëra | {a} copë',
        tipPlaka: 'Sfungjer Pllakë',
        tipRulo: 'Sfungjer Rulo',
        tipRollpack: 'Rollpack',
        adetLabel: 'Sasi',
        birimLabel: 'Njësi',
        urunLabel: 'produkt',
        paketLabel: 'paketë',
        toastAdded: '✅ Shtuar në listë!',
        toastUpdated: '✅ Produkti u përditësua!',
        toastDeleted: '🗑️ U fshi',
        toastCleared: '🗑️ Lista u pastrua',
        toastListEmpty: '⚠️ Lista është bosh',
        toastShared: '✅ U shpërndau!',
        toastCopied: '📋 U kopjua!',
        toastCopyFailed: '⚠️ Kopjimi dështoi',
        toastAddFirst: '⚠️ Fillimisht shtoni produkte në listë',
        toastEnterDims: '⚠️ Vendosni përmasat e kontejnerit',
        toastNoItems: '⚠️ Nuk ka produkte në listë',
        toastCalcError: '❌ Gabim llogaritjeje: ',
        toastReportError: '❌ Gabim raportimi: ',
        toastRenderError: '❌ Gabim 3D: ',
        warnMinEn: '⚠️ Gjerësia duhet të jetë minimumi 5 cm',
        warnMaxEn: '⚠️ Gjerësia duhet të jetë maksimumi 220 cm',
        shareTitle: '🧿d LISTA E SFUNGJERIT',
        shareOlcu: 'Përmasat',
        shareBirimHacim: 'Vëllimi Njësi',
        shareToplam: 'Total',
        shareTotalLine: 'TOTAL: {k} zëra | {a} copë',
        shareTotalVolume: 'VËLLIMI TOTAL: {v} m³',
        shareListTitle: '🧿d Lista e Sfungjerit',
        shareMenuTitle: 'Shpërndaj Listën',
        confirmTitle: 'Pastro Listën',
        confirmMsg: 'Të gjithë artikujt do të fshihen. Jeni të sigurt?',
        confirmCancel: 'Anulo',
        confirmOk: 'Po, Pastro',
        containerTitle: '🚛 Simulim i Ngarkimit të Kontejnerit',
        containerType: 'Lloji i Kontejnerit',
        containerCustom: 'Me porosi',
        containerCustomDims: 'Vendos përmasat',
        containerCalcBtn: '📐 Llogarit & Vizualizoj',
        containerReportTitle: '📊 Raporti i Ngarkimit',
        containerLength: 'Gjatësia (cm)',
        containerWidth: 'Gjerësia (cm)',
        containerHeight: 'Lartësia (cm)',
        containerAllFit: '✅ Të gjitha produktet u futën në kontejner!',
        containerSummary: '{type} · {placed}/{total} produkte · {pct}% plot',
        containerVol: 'Vëllimi i Kontejnerit',
        containerCoveredVol: 'Vëllimi i Mbuluar',
        containerProductVol: 'Vëllimi i Produkteve të Paketuara',
        containerPlacedItems: 'Paketa të Vendosura',
        containerRuloPlaka: 'Rulo / Pllakë',
        containerFillRate: 'Shkalla e Mbushjes',
        containerEmptySpace: '📦 Hapësira e Lirë në Kontejner',
        containerEmptyLength: 'Gjatësi e lirë',
        containerEmptyWidth: 'Gjerësi e lirë',
        containerEmptyHeight: 'Lartësi e lirë',
        containerEmptyVol: 'Vëllim i lirë',
        containerNotFit: '⚠️ <b>{n}</b> produkte nuk u futën ({v} m³)',
        containerNotFitPcs: 'copë nuk u futën',
        containerRuloUnit: 'rulo',
        containerPlakaUnit: 'pllakë',
        containerDisclaimer: 'ℹ️ Ky është një simulim virtual. Ngarkimi real mund të ndryshojë me ±10%.',
        vakumCapNormal: 'Diam.: <b>{cap} cm</b>',
        vakumCapVakumlu: 'Diam.: <b>{cap} cm</b> → Vakum: <b style="color:#c0392b">{vcap} cm</b>',
        vakumCapDefault: 'Diam. me vakum: —',
        editTooltip: 'Ndrysho',
        deleteTooltip: 'Fshi',
        installGuideTitle: '📲 Shto në Ekranin Kryesor',
        rollpackDims: '{en} cm × Diam. {cap} cm × {paket} pak.',
        rollpackM3Label: 'Rollpack M³',
        urunM3Label: 'Produkti M³',
        pdfExportBtn: 'Shkarko Raportin PDF',
        pdfTitle: 'Raporti i Ngarkimit të Kontejnerit',
        pdfDate: 'Data',
        pdfProductList: 'Lista e Produkteve',
        pdfDims: 'Përmasat',
        pdfQty: 'Sasi',
        pdfVolume: 'Vëllimi',
        pdfType: 'Lloji',
        pdfContainerDims: 'Përmasat e Kontejnerit',
    }
};

function t(key, params) {
    const lang = translations[currentLang] || translations.tr;
    let text = lang[key] || translations.tr[key] || key;
    if (params) {
        Object.keys(params).forEach(k => {
            text = text.replace(new RegExp('\\{' + k + '\\}', 'g'), params[k]);
        });
    }
    return text;
}

function applyLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('sunger_lang', lang);

    // HTML lang attribute
    document.documentElement.lang = lang;

    // Update all data-i18n elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translated = t(key);
        if (translated) {
            el.textContent = translated;
        }
    });

    // Update lang selector UI
    const langLabel = document.getElementById('lang-label');
    if (langLabel) langLabel.textContent = lang.toUpperCase();

    document.querySelectorAll('.lang-option').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.lang === lang);
    });

    // Update confirm dialog
    const confirmTitle = document.querySelector('.confirm-title');
    const confirmMsg = document.querySelector('.confirm-msg');
    const confirmCancel = document.getElementById('confirm-cancel');
    const confirmOk = document.getElementById('confirm-ok');
    if (confirmTitle) confirmTitle.textContent = t('confirmTitle');
    if (confirmMsg) confirmMsg.textContent = t('confirmMsg');
    if (confirmCancel) confirmCancel.textContent = t('confirmCancel');
    if (confirmOk) confirmOk.textContent = t('confirmOk');

    // Update container modal
    const cntTitle = document.querySelector('.container-header h2');
    if (cntTitle) cntTitle.textContent = t('containerTitle');
    const cntTypeLabel = document.querySelector('.container-label');
    if (cntTypeLabel) cntTypeLabel.textContent = t('containerType');
    const btnCalcCnt = document.getElementById('btn-calc-container');
    if (btnCalcCnt) btnCalcCnt.textContent = t('containerCalcBtn');

    // Container custom dims labels
    const customDims = document.getElementById('custom-dims');
    if (customDims) {
        const labels = customDims.querySelectorAll('label');
        if (labels[0]) labels[0].textContent = t('containerLength');
        if (labels[1]) labels[1].textContent = t('containerWidth');
        if (labels[2]) labels[2].textContent = t('containerHeight');
    }

    // Container type buttons - Custom
    document.querySelectorAll('.container-type-btn').forEach(btn => {
        if (btn.dataset.type === 'custom') {
            const nameEl = btn.querySelector('.ct-name');
            const dimsEl = btn.querySelector('.ct-dims');
            if (nameEl) nameEl.textContent = t('containerCustom');
            if (dimsEl) dimsEl.textContent = t('containerCustomDims');
        }
    });

    // Vakum info default text
    const vakumInfo = document.getElementById('vakum-info');
    if (vakumInfo && vakumInfo.textContent.includes('—')) {
        vakumInfo.innerHTML = t('vakumCapDefault');
    }

    // Re-run calculate to update dynamic result text
    calculate();

    // Re-update list UI
    updateListUI();
}

function setupLanguageSelector() {
    const langBtn = document.getElementById('btn-lang');
    const langDropdown = document.getElementById('lang-dropdown');

    if (!langBtn || !langDropdown) return;

    // Toggle dropdown
    langBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        langDropdown.classList.toggle('show');
    });

    // Language option click
    document.querySelectorAll('.lang-option').forEach(opt => {
        opt.addEventListener('click', function(e) {
            e.stopPropagation();
            const lang = this.dataset.lang;
            applyLanguage(lang);
            langDropdown.classList.remove('show');
        });
    });

    // Close dropdown on outside click
    document.addEventListener('click', function() {
        langDropdown.classList.remove('show');
    });

    // Load saved language
    const savedLang = localStorage.getItem('sunger_lang');
    if (savedLang && translations[savedLang]) {
        applyLanguage(savedLang);
    }
}
