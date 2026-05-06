# Cara Memperbaiki Error "Row-Level Security Policy" saat Membuat Soal

## Masalah
Ketika Anda mencoba membuat soal baru di Admin Panel, muncul error:
```
new row violates row-level security policy for table "problems"
```

Ini berarti database sudah memiliki **Row Level Security (RLS)** tetapi **tidak ada policy** yang mengizinkan admin untuk membuat soal baru.

## Penyebab
Tabel `problems` memiliki RLS enabled, tetapi hanya ada policy untuk:
- ✅ **SELECT** (membaca soal) - boleh semua orang
- ❌ **INSERT** (membuat soal) - TIDAK ADA POLICY → dilarang untuk semua

## Solusi

### Step 1: Jalankan SQL Script
1. Buka [Supabase Console](https://app.supabase.com)
2. Pilih project Anda
3. Buka **SQL Editor** → **New Query**
4. Copy-paste script dari file **`add-admin-insert-policy.sql`** 
5. Klik **Run** atau tekan **Ctrl+Enter**

### Step 2: Verifikasi Hasilnya
Setelah script selesai, Anda akan melihat output yang menampilkan semua policies:

```
schemaname  | tablename  | policyname                    | permissive | roles
------------|------------|-------------------------------|-----------|-------
public      | problems   | Problems are viewable by...   | PERMISSIVE| {public}
public      | problems   | Only admins can insert...     | PERMISSIVE| {public}
public      | problems   | Only admins can update...     | PERMISSIVE| {public}
public      | problems   | Only admins can delete...     | PERMISSIVE| {public}
public      | test_cases | Test cases are viewable by... | PERMISSIVE| {public}
public      | test_cases | Only admins can insert...     | PERMISSIVE| {public}
public      | test_cases | Only admins can delete...     | PERMISSIVE| {public}
```

Jika sudah ada policies untuk `insert`, `update`, `delete` → **Berhasil! ✅**

### Step 3: Test Membuat Soal
1. Kembali ke Admin Panel
2. Coba membuat soal baru
3. Seharusnya sekarang bisa dibuat tanpa error

## Penjelasan Technical

### Apa itu Row Level Security (RLS)?
RLS adalah fitur keamanan database yang membatasi akses ke baris data berdasarkan user. 

### Policy yang Ditambahkan
Script menambahkan 5 policies baru:

#### 1. **Insert Problems Policy**
```sql
CREATE POLICY "Only admins can insert problems" ON problems
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin')
  );
```
**Artinya:** Hanya user dengan role='admin' yang bisa membuat soal baru.

#### 2. **Update Problems Policy**
Memungkinkan admin untuk mengedit soal yang sudah ada.

#### 3. **Delete Problems Policy**
Memungkinkan admin untuk menghapus soal.

#### 4. **Insert Test Cases Policy**
Memungkinkan admin untuk menambah test case.

#### 5. **Delete Test Cases Policy**
Memungkinkan admin untuk menghapus test case.

## Troubleshooting

### Masih Error Setelah Menjalankan Script?

**Kemungkinan 1: User Anda Bukan Admin**
```sql
-- Cek role user Anda
SELECT id, email, (SELECT role FROM profiles WHERE id = auth.users.id) as role
FROM auth.users
WHERE email = 'your-email@example.com';
```

Jika role = NULL atau 'student', ubah menjadi admin:
```sql
UPDATE profiles 
SET role = 'admin' 
WHERE id = 'your-user-id-here';
```

**Kemungkinan 2: Profiles Belum Ada**
```sql
-- Verifikasi profile untuk user Anda ada
SELECT * FROM profiles WHERE id = auth.uid();
```

Jika tidak ada, jalankan script di `fix-profile-role.sql` terlebih dahulu.

**Kemungkinan 3: Policy Masih Menggunakan Nama Lama**
```sql
-- List semua policies di problems table
SELECT policyname FROM pg_policies WHERE tablename = 'problems';
```

Jika masih ada policies lama (yang di-DROP di script), coba refresh browser Anda.

## File-File Terkait
- `database-schema.sql` - Schema database utama
- `add-admin-insert-policy.sql` - Script untuk fix RLS policy (JALANKAN INI)
- `add-role-column.sql` - Script untuk menambah kolom role (jika belum ada)
- `fix-profile-role.sql` - Script untuk fix profile issues

## Kontak Support
Jika masih ada masalah:
1. Buka Supabase console Anda
2. Cek tab **Logs** untuk error messages
3. Pastikan Anda sudah login dengan akun admin
