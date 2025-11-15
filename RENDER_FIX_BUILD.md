# 🔧 Fix Build Command di Render

## ⚠️ Problem

Render masih menggunakan build command lama (`npm ci`) meskipun `render.yaml` sudah diupdate ke `npm install`.

**Root Cause**: Service tidak dibuat menggunakan Blueprint, jadi `render.yaml` tidak digunakan.

---

## ✅ Solution: Update Build Command Manual

### Opsi 1: Update Build Command di Dashboard (Tercepat)

1. **Buka Render Dashboard**
   - URL: https://dashboard.render.com
   - Pilih service: **facesenseattend**

2. **Update Build Command**
   - Klik tab **"Settings"**
   - Scroll ke bagian **"Build & Deploy"**
   - Cari field **"Build Command"**
   - Ubah dari: `npm ci && npm run build`
   - Menjadi: `npm install && npm run build`
   - Klik **"Save Changes"**

3. **Trigger Manual Deploy**
   - Kembali ke tab **"Overview"** atau **"Deploys"**
   - Klik **"Manual Deploy"** → **"Deploy latest commit"**
   - Tunggu build selesai

### Opsi 2: Hapus dan Re-deploy dengan Blueprint (Recommended untuk Long-term)

Ini akan memastikan semua config dari `render.yaml` digunakan.

#### Step 1: Backup Info Service yang Ada

Sebelum hapus, catat:
- Environment variables yang sudah di-set (terutama `DATABASE_URL`)
- Custom domain (jika ada)
- Settings lainnya

#### Step 2: Hapus Service Lama

1. Buka service **facesenseattend** di Dashboard
2. Klik tab **"Settings"**
3. Scroll ke bawah
4. Klik **"Delete Web Service"**
5. Konfirmasi dengan ketik nama service

#### Step 3: Deploy Ulang dengan Blueprint

1. Di Render Dashboard, klik **"New"** → **"Blueprint"**
2. Pilih repository: **techprocreative/absen-baru-ws**
3. Render akan auto-detect `render.yaml`
4. Klik **"Apply"**
5. Set **DATABASE_URL** saat diminta:
   ```
   postgresql://postgres.oqsezgdlxahrgvxutbyb:YOUR_PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```
6. Tunggu deployment selesai

---

## 🔍 Verifikasi

Setelah deploy, cek di logs bahwa command yang dijalankan adalah:
```
==> Running build command 'npm install && npm run build'...
```

Bukan:
```
==> Running build command 'npm ci && npm run build'...
```

---

## 📊 Expected Successful Build

```
✅ npm install - Install semua dependencies
✅ Models already present, skipping download
✅ vite build - Build frontend
✅ tsc - Compile TypeScript
✅ Build succeeded
```

---

## 💡 Why This Happens

Render memiliki 2 cara deployment:
1. **Manual Service Creation** - Config disimpan di Render (tidak pakai render.yaml)
2. **Blueprint Deployment** - Config dibaca dari render.yaml di Git

Jika service dibuat manual, perubahan di `render.yaml` tidak akan otomatis apply.

---

## 🎯 Recommended Action

**Pilih Opsi 1** (Update manual) untuk fix cepat sekarang.

Nanti di masa depan, gunakan Blueprint untuk deployment agar config selalu sync dengan Git.

---

**Updated**: 2025-11-15