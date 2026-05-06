# Cara Menambahkan Kolom Role ke Database

## Masalah
Error: `kolom "role" dari relasi "profiles" tidak ada`

Ini berarti tabel `profiles` sudah ada tapi kolom `role` belum dibuat.

## Solusi

### Step 1: Jalankan Script di Supabase
1. Buka [Supabase Console](https://app.supabase.com)
2. Pilih project Anda
3. Buka **SQL Editor** → **New Query**
4. Copy-paste script dari **`add-role-column.sql`** di project Anda
5. Klik **Run** atau tekan **Ctrl+Enter**

### Step 2: Verifikasi Hasil
Setelah script selesai, Anda akan melihat output:
```
total_profiles | null_roles | student_count | admin_count
```

Jika hasilnya menunjukkan:
- ✅ `total_profiles` > 0
- ✅ `null_roles` = 0 (tidak ada yang NULL)
- Berarti sudah berhasil!

### Step 3: Update Admin User (Optional)
Jika Anda ingin mengubah user tertentu menjadi admin:

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@example.com')
RETURNING id, full_name, role;
```

Ganti `admin@example.com` dengan email user yang ingin dijadikan admin.

## Troubleshooting

### Masih Error?
Cek apakah kolom sudah ada:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'profiles';
```

Harusnya ada kolom: `id`, `full_name`, `role`, `created_at`, `updated_at`

### Kolom role tapi tetap error
Jalankan query ini:
```sql
-- Check the constraint
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'profiles';

-- Reset the constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('student', 'admin'));
```

## Setelah Berhasil

Coba login lagi di aplikasi. Sekarang error "gagal memverifikasi profil" seharusnya hilang!
