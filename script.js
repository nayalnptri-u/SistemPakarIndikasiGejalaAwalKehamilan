// Data Gejala dan Nilai CF Pakar dari Dataset
const gejalaList = [
    { no: 1, kode: "KH1", nama: "Terlambat Menstruasi", cfPakar: 0.4 },
    { no: 2, kode: "KH2", nama: "Flek ringan", cfPakar: 0.0 },
    { no: 3, kode: "KH3", nama: "Nyeri / Bengkak pada Payudara", cfPakar: 0.4 },
    { no: 4, kode: "KH4", nama: "Mual dan Muntah", cfPakar: 0.4 },
    { no: 5, kode: "KH5", nama: "Mudah Lelah", cfPakar: 0.4 },
    { no: 6, kode: "KH6", nama: "Sensitif terhadap bau", cfPakar: 0.4 },
    { no: 7, kode: "KH7", nama: "Kram perut bagian bawah", cfPakar: 0.2 },
    { no: 8, kode: "KH8", nama: "Perut membesar", cfPakar: 0.2 },
    { no: 9, kode: "KH9", nama: "Sering buang air kecil", cfPakar: 0.4 },
    { no: 10, kode: "KH10", nama: "Pusing", cfPakar: 0.4 },
    { no: 11, kode: "KH11", nama: "Perubahan Suasana Hati", cfPakar: 0.4 }
];

// Opsi Skala Kepastian User
const skalaUserOptions = [
    { label: "Sangat Yakin (1.0)", value: 1.0 },
    { label: "Yakin (0.8)", value: 0.8 },
    { label: "Cukup Yakin (0.6)", value: 0.6 },
    { label: "Kurang Yakin (0.4)", value: 0.4 },
    { label: "Tidak Tahu (0.2)", value: 0.2 },
    { label: "Tidak (0.0)", value: 0.0 }
];

// Load tabel gejala secara otomatis saat halaman dibuka
document.addEventListener("DOMContentLoaded", () => {
    const tableBody = document.getElementById("gejalaTableBody");
    if (tableBody) {
        gejalaList.forEach(g => {
            let optionsHtml = `<option value="" disabled selected>-- Pilih tingkat keyakinan --</option>`;
            skalaUserOptions.forEach(opt => {
                optionsHtml += `<option value="${opt.value}">${opt.label}</option>`;
            });

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${g.no}</td>
                <td><strong>${g.kode}</strong></td>
                <td>${g.nama}</td>
                <td><span class="badge" style="background-color: var(--primary); color: white;">${g.cfPakar}</span></td>
                <td>
                    <select id="cf_user_${g.kode}" required>
                        ${optionsHtml}
                    </select>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    // Event listener untuk form submit
    const cfForm = document.getElementById("cfForm");
    if (cfForm) {
        cfForm.addEventListener("submit", function(e) {
            e.preventDefault();
            hitungDiagnosa();
        });
    }

    // Mencegah input angka pada kolom nama secara real-time
    const userNameInput = document.getElementById("userName");
    if (userNameInput) {
        userNameInput.addEventListener("input", function() {
            this.value = this.value.replace(/[0-9]/g, ''); 
        });
    }

    // Proteksi: Mencegah Klik Kanan
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });

    // Proteksi: Mencegah Event Copy/Salin Teks
    document.addEventListener('copy', function(e) {
        e.preventDefault();
        alert("Aksi salin (copy) teks dinonaktifkan di halaman ini!");
    });

    // Proteksi: Mencegah Shortcut Keyboard (Ctrl+C, Ctrl+U, Ctrl+S)
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && (e.key === 'c' || e.key === 'C' || e.key === 'u' || e.key === 'U' || e.key === 's' || e.key === 'S')) {
            e.preventDefault();
            alert("Aksi tombol ini dinonaktifkan!");
        }
    });
});

// Fungsi Perhitungan Certainty Factor (CF)
function hitungDiagnosa() {
    const name = document.getElementById("userName").value.trim();
    const age = document.getElementById("userAge").value.trim();

    let activeCFs = [];
    let logText = "=== LAPORAN PERHITUNGAN CERTAINTY FACTOR (CF) ===\n";
    logText += `Nama Pasien : ${name}\nUsia Pasien : ${age} Tahun\n\n`;
    logText += "1. PERHITUNGAN CF(H,E) = CF(User) * CF(Pakar):\n";

    gejalaList.forEach(g => {
        const selectEl = document.getElementById(`cf_user_${g.kode}`);
        if (selectEl && selectEl.value !== "") {
            const cfUser = parseFloat(selectEl.value);
            const cfPakar = g.cfPakar;

            if (cfUser > 0 && cfPakar > 0) {
                const cfHE = cfUser * cfPakar;
                activeCFs.push({
                    kode: g.kode,
                    nama: g.nama,
                    cfUser: cfUser,
                    cfPakar: cfPakar,
                    cfHE: cfHE
                });
                logText += `• [${g.kode}] ${g.nama}: CF_User(${cfUser}) * CF_Pakar(${cfPakar}) = ${cfHE.toFixed(4)}\n`;
            }
        }
    });

    if (activeCFs.length === 0) {
        alert("Silakan pilih minimal satu tingkat keyakinan gejala yang valid.");
        return;
    }

    logText += "\n2. AKUMULASI KOMBINASI (CF Combined):\n";
    let cfCombine = activeCFs[0].cfHE;
    logText += `• Awal: CF_Combine = CF[${activeCFs[0].kode}] = ${cfCombine.toFixed(4)}\n`;

    for (let i = 1; i < activeCFs.length; i++) {
        let cfNext = activeCFs[i].cfHE;
        let oldCombine = cfCombine;
        cfCombine = oldCombine + cfNext * (1 - oldCombine);
        logText += `• Kombinasi ke-${i}: CF_Old(${oldCombine.toFixed(4)}) + CF_Next(${cfNext.toFixed(4)}) * (1 - ${oldCombine.toFixed(4)}) = ${cfCombine.toFixed(4)}\n`;
    }

    const percentage = (cfCombine * 100).toFixed(2);
    logText += `\n3. HASIL AKHIR:\nCF Total = ${cfCombine.toFixed(4)}\nPersentase = ${percentage}%\n`;

    displayResults(name, age, cfCombine, percentage, logText, activeCFs);
}

// Fungsi Menampilkan Hasil ke Antarmuka dengan Animasi
function displayResults(name, age, cfCombine, percentage, logText, activeCFs) {
    const resultCard = document.getElementById("resultCard");
    const percentageVal = document.getElementById("percentageVal");
    const cfDetailText = document.getElementById("cfDetailText");
    const progressBar = document.getElementById("progressBar");
    const statusBadge = document.getElementById("statusBadge");
    const suggestionText = document.getElementById("suggestionText");
    const logContent = document.getElementById("logContent");
    const resultSymptomsBody = document.getElementById("resultSymptomsBody");

    const today = new Date();
    const formattedDate = today.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const formattedTime = today.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + " WIB";

    document.getElementById("resName").innerText = name;
    document.getElementById("resAge").innerText = `${age} Tahun`;
    document.getElementById("resDate").innerText = formattedDate;
    document.getElementById("resTime").innerText = formattedTime;

    resultCard.classList.remove("hidden");
    resultCard.classList.remove("animate-card");
    void resultCard.offsetWidth;
    resultCard.classList.add("animate-card");

    percentageVal.innerText = `${percentage}%`;
    progressBar.style.width = `${percentage}%`;
    cfDetailText.innerHTML = `Nilai Kombinasi CF Akhir: <b>${cfCombine.toFixed(4)}</b>`;
    logContent.innerText = logText;

    resultSymptomsBody.innerHTML = "";
    if (activeCFs && activeCFs.length > 0) {
        activeCFs.forEach((item, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${index + 1}</td>
                <td><strong>${item.kode}</strong></td>
                <td>${item.nama}</td>
                <td>${item.cfPakar}</td>
                <td>${item.cfUser}</td>
                <td>${item.cfHE.toFixed(4)}</td>
            `;
            resultSymptomsBody.appendChild(row);
        });
    }

    let statusString = "";
    statusBadge.className = "badge";
    if (cfCombine >= 0.8) {
        statusBadge.classList.add("badge-high");
        statusString = "Tingkat Kepastian Sangat Tinggi";
        statusBadge.innerText = statusString;
        suggestionText.innerHTML = `Pasien atas nama <b>${name}</b> (${age} th) memiliki indikasi kehamilan yang sangat kuat. Disarankan untuk segera melakukan pemeriksaan medis konfirmasi ke dokter spesialis kandungan (Sp.OG) atau bidan terdekat.`;
    } else if (cfCombine >= 0.5) {
        statusBadge.classList.add("badge-medium");
        statusString = "Tingkat Kepastian Sedang";
        statusBadge.innerText = statusString;
        suggestionText.innerHTML = `Pasien atas nama <b>${name}</b> (${age} th) memiliki beberapa indikasi awal kehamilan. Disarankan untuk mengulang tes mandiri (Testpack) dalam 3-5 hari ke depan di pagi hari atau berkonsultasi ke layanan kesehatan.`;
    } else {
        statusBadge.classList.add("badge-low");
        statusString = "Tingkat Kepastian Rendah";
        statusBadge.innerText = statusString;
        suggestionText.innerHTML = `Indikasi kehamilan pada pasien <b>${name}</b> (${age} th) tergolong rendah. Gejala yang dirasakan kemungkinan disebabkan faktor fisiologis lain atau perubahan hormonal harian.`;
    }

    simpanKeRiwayat(name, age, formattedDate, formattedTime, percentage, cfCombine, statusString);

    resultCard.scrollIntoView({ behavior: 'smooth' });
}

// Fungsi Navigasi Halaman dengan Efek Animasi
function bukaFormDiagnosa() {
    document.getElementById("infoPageView").classList.add("hidden");
    document.getElementById("historyCard").classList.add("hidden");
    
    const formCard = document.getElementById("formPageView");
    formCard.classList.remove("hidden");
    formCard.classList.remove("animate-card");
    void formCard.offsetWidth;
    formCard.classList.add("animate-card");

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function kembaliKeInfo() {
    document.getElementById("formPageView").classList.add("hidden");
    document.getElementById("historyCard").classList.add("hidden");
    document.getElementById("resultCard").classList.add("hidden");
    
    const infoCard = document.getElementById("infoPageView");
    infoCard.classList.remove("hidden");
    infoCard.classList.remove("animate-card");
    void infoCard.offsetWidth;
    infoCard.classList.add("animate-card");

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetForm() {
    document.getElementById("cfForm").reset();
    document.getElementById("resultCard").classList.add("hidden");
    document.getElementById("formPageView").classList.add("hidden");
    
    const infoCard = document.getElementById("infoPageView");
    infoCard.classList.remove("hidden");
    infoCard.classList.remove("animate-card");
    void infoCard.offsetWidth;
    infoCard.classList.add("animate-card");

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleBreakdown() {
    const content = document.getElementById("breakdownContent");
    const icon = document.getElementById("accordionIcon");
    content.classList.toggle("hidden");
    icon.className = content.classList.contains("hidden") ? "fa-solid fa-chevron-down" : "fa-solid fa-chevron-up";
}

// Pengelolaan Riwayat (LocalStorage)
function simpanKeRiwayat(name, age, formattedDate, formattedTime, percentage, cfCombine, statusText) {
    let history = JSON.parse(localStorage.getItem('cf_pregnancy_history')) || [];
    
    history.unshift({
        nama: name,
        usia: age,
        tanggal: formattedDate,
        waktu: formattedTime,
        persentase: percentage,
        cf: cfCombine.toFixed(4),
        status: statusText
    });

    if (history.length > 20) {
        history.pop();
    }

    localStorage.setItem('cf_pregnancy_history', JSON.stringify(history));
}

function bukaRiwayat() {
    document.getElementById("infoPageView").classList.add("hidden");
    document.getElementById("formPageView").classList.add("hidden");
    document.getElementById("resultCard").classList.add("hidden");
    
    const historyCard = document.getElementById("historyCard");
    historyCard.classList.remove("hidden");
    historyCard.classList.remove("animate-card");
    void historyCard.offsetWidth;
    historyCard.classList.add("animate-card");

    const tbody = document.getElementById("historyTableBody");
    tbody.innerHTML = "";

    let history = JSON.parse(localStorage.getItem('cf_pregnancy_history')) || [];

    if (history.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #64748b; padding: 20px;">Belum ada riwayat diagnosa yang tersimpan.</td></tr>`;
        return;
    }

    history.forEach((item, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.tanggal}, ${item.waktu}</td>
            <td><strong>${item.nama}</strong></td>
            <td>${item.usia} Tahun</td>
            <td><span class="badge" style="background-color: var(--primary); color: white;">${item.persentase}%</span></td>
            <td>${item.status}</td>
        `;
        tbody.appendChild(row);
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function tutupRiwayat() {
    document.getElementById("historyCard").classList.add("hidden");
    
    const infoCard = document.getElementById("infoPageView");
    infoCard.classList.remove("hidden");
    infoCard.classList.remove("animate-card");
    void infoCard.offsetWidth;
    infoCard.classList.add("animate-card");

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function hapusRiwayat() {
    if (confirm("Apakah Anda yakin ingin menghapus seluruh riwayat diagnosa?")) {
        localStorage.removeItem('cf_pregnancy_history');
        bukaRiwayat();
    }
}