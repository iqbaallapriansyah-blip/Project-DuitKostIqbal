# Project-DuitKostIqbal
Deskripsi Proyek: DuitKostIqbal

Nama: Mohammad Iqbal Apriansyah
NIM : 25534073
Mata kuliah: Pemrograman WEB

1. Gambaran umum

DuitKostIqbal adalah aplikasi web pencatat keuangan untuk mahasiswa, terutama anak kost yang mengandalkan uang kiriman bulanan. Pengguna bisa mencatat pemasukan dan pengeluaran, menetapkan batas anggaran per kategori, melihat grafik keuangan, dan mendapat peringatan sebelum anggaran habis. Aplikasi ini dibuat dengan HTML, CSS, dan JavaScript murni, tanpa framework dan tanpa server.

2. Latar belakang masalah

Banyak mahasiswa kehabisan uang sebelum akhir bulan. Penyebabnya biasanya bukan satu pengeluaran besar, melainkan banyak pengeluaran kecil yang tidak dicatat, seperti jajan, pulsa, dan ojek. Tanpa catatan, mahasiswa tidak tahu uangnya habis di kategori mana. Tanpa batas anggaran, tidak ada tanda bahwa pengeluaran sudah berlebihan. Aplikasi ini dibuat untuk menjawab dua hal itu: ke mana uangku pergi dan kapan aku harus berhenti belanja.

3. Tujuan
Membantu mahasiswa mengontrol pengeluaran harian dan bulanan.
Membuat pencatatan keuangan cukup sederhana untuk dilakukan dalam beberapa detik.
Memberi gambaran keuangan lewat grafik dan wawasan otomatis.
Memberi peringatan dini agar anggaran tidak jebol.

4. Fitur utama
Ringkasan (dashboard). Menampilkan total saldo, pemasukan bulan ini, pengeluaran bulan ini, dan lima transaksi terbaru. Banner peringatan muncul di sini bila anggaran hampir habis.

Pencatatan transaksi. Pengguna memilih jenis (pemasukan atau pengeluaran), kategori, jumlah, tanggal, dan catatan opsional. Halaman Transaksi memiliki pencarian dan filter berdasarkan jenis serta kategori, juga tombol hapus per transaksi.

Anggaran per kategori. Batas bulanan bisa diatur untuk kategori seperti Makan, Transport, dan Pendidikan. Bar progres berubah warna sesuai pemakaian.

Notifikasi anggaran. Peringatan kuning muncul saat pemakaian mencapai 80%, dan peringatan merah saat anggaran terlampaui. Notifikasi juga muncul tepat setelah pengguna menambah pengeluaran yang membuat anggaran melewati batas.

Analitik. Halaman ini berisi grafik garis pemasukan vs pengeluaran selama 12 bulan dengan tooltip interaktif, diagram donat pengeluaran per kategori, daftar kategori terboros, dan wawasan otomatis (misalnya persentase tabungan dan perbandingan dengan bulan lalu).

Manajemen kategori. Pengguna bisa menambah, mengubah, dan menghapus kategori sendiri, lengkap dengan ikon dan batas anggaran.

Ekspor CSV. Seluruh transaksi dapat diunduh sebagai file CSV untuk dibuka di Excel.

Asisten keuangan. Chatbot kecil yang menjawab pertanyaan seperti “sisa saldo”, “pengeluaran terbesar”, “status anggaran”, dan “tips hemat”. Jawabannya dihitung dari data pengguna dan berjalan tanpa internet.

5. Teknologi dan struktur file
File	Peran
index.html	Struktur halaman: sidebar, area konten, modal transaksi dan kategori, panel asisten.
style.css	Tampilan bertema gelap dengan aksen hijau, tata letak Grid dan Flexbox, serta desain responsif untuk HP.
script.js	Seluruh logika: perhitungan, penyimpanan data, pembuatan grafik, peringatan, dan asisten.

Beberapa konsep pemrograman web yang dipakai:

DOM manipulation dan event listener untuk membuat halaman interaktif.
localStorage untuk menyimpan data di browser, sehingga data tidak hilang saat halaman ditutup.
SVG yang dibuat lewat JavaScript untuk grafik garis dan diagram donat, tanpa library eksternal.
Elemen <dialog> untuk jendela tambah transaksi dan kategori.
Single-page navigation dengan hash (#analytics, #categories), sehingga tombol Back browser tetap berfungsi.
Media query agar menu pindah ke bar bawah di layar HP.

6. Cara kerja singkat
Pengguna menambah transaksi lewat formulir, lalu JavaScript menyimpannya ke localStorage. Setelah itu seluruh tampilan dihitung ulang: saldo, bar anggaran, grafik, dan daftar transaksi. Aplikasi lalu memeriksa apakah ada kategori yang pemakaiannya sudah mencapai 80% atau 100% dari batas, dan menampilkan peringatan bila ada.

7. Potensi penghasilan
Paket Premium dengan fitur tambahan: ekspor laporan PDF dan Excel, target tabungan, pengingat tagihan, dan sinkronisasi antar perangkat.
Kerja sama dengan layanan keuangan: rekomendasi tabungan pelajar, dompet digital, atau asuransi yang relevan bagi mahasiswa, yang ditampilkan secara opsional.

8. Kelebihan dan keterbatasan
Kelebihan: ringan, gratis, tidak perlu daftar, bisa dipakai tanpa internet setelah dimuat, dan tampilannya nyaman di HP maupun komputer.
Keterbatasan: data tersimpan hanya di satu browser, jadi tidak otomatis muncul di perangkat lain dan akan hilang bila data browser dihapus. Fitur sinkronisasi antar perangkat membutuhkan server atau database, dan itu menjadi rencana pengembangan berikutnya.
