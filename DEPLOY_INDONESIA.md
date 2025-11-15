# 🚀 Panduan Deployment FaceSenseAttend ke Render

Panduan lengkap untuk deploy aplikasi FaceSenseAttend menggunakan Render Blueprint.

---

## ✅ Langkah yang Sudah Selesai

1. ✅ **Database Supabase sudah siap**
   - Project: `absensi-baru` 
   - ID: `oqsezgdlxahrgvxutbyb`
   - Region: Singapore
   - Semua tabel sudah dibuat (employees, attendance, guests, dll)

2. ✅ **Kode sudah di GitHub**
   - Repository: https://github.com/techprocreative/absen-baru-ws
   - Branch: main
   - Semua file sudah ter-commit

3. ✅ **Blueprint Render sudah siap** (`render.yaml`)

---

## 📋 Cara Deploy ke Render (Menggunakan Blueprint)

### Langkah 1: Buka Render Dashboard

1. Buka browser, pergi ke: **https://dashboard.render.com**
2. Login dengan akun Anda (techprocreative34@gmail.com)
3. Pilih workspace: **nusanexus**

### Langkah 2: Deploy dengan Blueprint

1. Klik tombol **"New"** (tombol biru di kanan atas)
2. Pilih **"Blueprint"**
3. Jika diminta connect GitHub:
   - Klik "Connect GitHub"
   - Authorize Render untuk akses repository
4. Pilih repository: **techprocreative/absen-baru-ws**
5. Render akan otomatis mendeteksi file `render.yaml`
6. Klik **"Apply"**

### Langkah 3: Set Environment Variable DATABASE_URL

Saat proses blueprint, Render akan meminta Anda mengisi `DATABASE_URL`. Ini adalah connection string dari Supabase.

#### Cara Mendapatkan DATABASE_URL:

**Opsi 1: Dari Supabase Dashboard**
1. Buka: https://supabase.com/dashboard/project/oqsezgdlxahrgvxutbyb
2. Klik **Settings** (ikon gear di sidebar kiri)
3. Klik **Database**
4. Scroll ke bagian **Connection String**
5. Pilih tab **URI** (bukan "Session pooling")
6. Copy connection string yang muncul
7. Ganti `[YOUR-PASSWORD]` dengan password database Anda

Format yang benar:
```
postgresql://postgres.oqsezgdlxahrgvxutbyb:PASSWORD_ANDA@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

**Opsi 2: Jika Lupa Password Database**
1. Di Supabase Dashboard, pergi ke **Settings** → **Database**
2. Klik **Reset database password**
3. Simpan password baru
4. Gunakan password baru dalam connection string

#### Paste DATABASE_URL ke Render

1. Di halaman Blueprint Render, akan ada field untuk `DATABASE_URL`
2. Paste connection string yang sudah Anda copy
3. **PENTING**: Pastikan tidak ada spasi di awal atau akhir!

### Langkah 4: Review dan Deploy

1. Review konfigurasi yang muncul:
   - Service name: `facesenseattend`
   - Region: `singapore`
   - Plan: `free` (gratis, tapi service akan sleep setelah 15 menit)
   - Branch: `main`

2. Klik **"Apply"** untuk mulai deployment

3. Tunggu proses build selesai (biasanya 5-10 menit)
   - Anda bisa monitor progress di tab **"Logs"**

### Langkah 5: Update ALLOWED_ORIGINS

Setelah deployment selesai:

1. Catat URL service Anda (misal: `https://facesenseattend.onrender.com`)
2. Di Render Dashboard, pergi ke service **facesenseattend**
3. Klik tab **"Environment"**
4. Cari variable `ALLOWED_ORIGINS`
5. Update valuenya dengan URL yang sebenarnya
6. Klik **"Save Changes"**
7. Service akan otomatis redeploy

---

## 🧪 Verifikasi Deployment

### Test 1: Health Check

Buka di browser:
```
https://facesenseattend.onrender.com/api/health
```

Harus muncul response seperti ini:
```json
{
  "status": "ok",
  "timestamp": "2025-11-15T...",
  "database": "connected"
}
```

### Test 2: Akses Aplikasi

Buka:
```
https://facesenseattend.onrender.com
```

Harus muncul halaman login.

### Test 3: Cek Logs

1. Di Render Dashboard, buka service Anda
2. Klik tab **"Logs"**
3. Pastikan tidak ada error merah
4. Harus ada tulisan "Server started successfully" atau serupa

---

## ⚙️ Konfigurasi Tambahan (Opsional)

### Keep-Alive untuk Free Tier

Jika menggunakan **free plan**, service akan sleep setelah 15 menit tidak aktif. Untuk mencegahnya:

#### Menggunakan cron-job.org

1. Buka: **https://cron-job.org**
2. Sign up / Login
3. Klik **"Cronjobs"** → **"Create Cronjob"**
4. Isi konfigurasi:
   - **Title**: FaceSenseAttend Keep-Alive
   - **Address**: `https://facesenseattend.onrender.com/api/health`
   - **Schedule**: Pilih "Every 10 minutes"
   - **Timezone**: Asia/Jakarta
5. Klik **"Create"**

### Custom Domain (Opsional)

Jika punya domain sendiri:

1. Di Render service, klik tab **"Settings"**
2. Scroll ke **"Custom Domains"**
3. Klik **"Add Custom Domain"**
4. Ikuti instruksi untuk setup DNS

---

## 🐛 Troubleshooting

### Build Gagal

**Problem**: Build error dengan pesan npm install failed

**Solusi**:
1. Cek logs untuk error spesifik
2. Pastikan `package.json` tidak corrupt
3. Coba manual deploy ulang

### Database Connection Error

**Problem**: "Unable to connect to database"

**Solusi**:
1. Cek `DATABASE_URL` di Environment Variables
2. Pastikan formatnya benar dan tidak ada spasi
3. Test connection string dengan tools seperti Postbird atau pgAdmin
4. Pastikan password tidak ada karakter special yang perlu di-encode

### Service Sleep Terus (Free Tier)

**Problem**: Service butuh waktu lama untuk respond pertama kali

**Solusi**:
1. Setup keep-alive cron job (lihat di atas)
2. Atau upgrade ke Starter plan ($7/bulan) untuk always-on

### Logs Menunjukkan Error

**Problem**: Ada error di logs tapi tidak tahu penyebabnya

**Solusi**:
1. Copy pesan error lengkap
2. Cek apakah semua environment variables sudah di-set
3. Pastikan `NODE_ENV=production`
4. Cek apakah migrations sudah dijalankan

---

## 📊 Monitoring Service

### Metrics yang Perlu Dimonitor

1. **Response Time**: Harus di bawah 2 detik
2. **CPU Usage**: Idealnya di bawah 50%
3. **Memory**: Free tier max 512MB
4. **Request Count**: Monitor traffic

### Cara Monitoring

1. Di Render Dashboard → Service Anda
2. Klik tab **"Metrics"**
3. Lihat grafik CPU, Memory, dan Bandwidth

---

## 💰 Informasi Plan Render

### Free Tier
- ✅ 750 jam per bulan (25 hari)
- ✅ 512MB RAM
- ❌ Service sleep setelah 15 menit
- ❌ Cold start lambat
- ✅ Gratis selamanya

### Starter Plan ($7/bulan)
- ✅ Always on (tidak sleep)
- ✅ 512MB RAM
- ✅ Lebih cepat
- ✅ Lebih reliable
- 💰 $7 per bulan

**Rekomendasi**: 
- Untuk testing/development: **Free tier** + keep-alive cron
- Untuk production: **Starter plan** atau lebih tinggi

---

## 🔐 Keamanan

### Environment Variables yang Penting

Pastikan ini **TIDAK** pernah di-commit ke Git:
- ❌ `DATABASE_URL`
- ❌ `SESSION_SECRET`
- ❌ `JWT_SECRET`
- ❌ `ENCRYPTION_KEY`

Semua sudah di-handle oleh Render secara otomatis via `render.yaml`.

### Best Practices

1. ✅ Gunakan HTTPS (otomatis di Render)
2. ✅ Set `ALLOWED_ORIGINS` dengan benar
3. ✅ Jangan share database credentials
4. ✅ Rotate secrets secara berkala

---

## 📞 Support & Resources

### Link Penting

- **Render Dashboard**: https://dashboard.render.com
- **Supabase Dashboard**: https://supabase.com/dashboard/project/oqsezgdlxahrgvxutbyb
- **GitHub Repo**: https://github.com/techprocreative/absen-baru-ws
- **Render Docs**: https://render.com/docs
- **Supabase Docs**: https://supabase.com/docs

### Jika Ada Masalah

1. Cek logs di Render Dashboard
2. Cek database di Supabase Dashboard
3. Lihat file `docs/DEPLOYMENT_STEP_BY_STEP.md` untuk troubleshooting detail
4. Create issue di GitHub repo

---

## ✅ Checklist Deployment

Gunakan checklist ini untuk memastikan semua langkah sudah dilakukan:

- [ ] Database Supabase sudah siap dan migrations sudah dijalankan
- [ ] Kode sudah di-push ke GitHub branch main
- [ ] File `render.yaml` ada di root repository
- [ ] Blueprint sudah di-apply di Render
- [ ] `DATABASE_URL` sudah di-set dengan benar
- [ ] Deployment berhasil (tidak ada error di logs)
- [ ] Health check endpoint return success
- [ ] Bisa akses halaman login
- [ ] `ALLOWED_ORIGINS` sudah di-update dengan URL yang benar
- [ ] Keep-alive cron job sudah di-setup (jika free tier)
- [ ] Service berfungsi dengan baik (test login, attendance, dll)

---

## 🎉 Selamat!

Jika semua checklist di atas sudah ✅, maka aplikasi FaceSenseAttend Anda sudah berhasil di-deploy!

URL Aplikasi Anda: **https://facesenseattend.onrender.com**

---

**Terakhir diupdate**: 2025-11-15  
**Status**: Database ✅ | Code ✅ | Blueprint ✅ | Deploy ⏳