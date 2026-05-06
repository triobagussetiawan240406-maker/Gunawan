# Solusi: Gagal Memverifikasi Profil Pengguna

## Masalah
Saat login, muncul error "Gagal memverifikasi profil pengguna" atau similar errors.

## Penyebab
1. Trigger database tidak membuat profil dengan role yang benar
2. Profil tidak dibuat saat user signup
3. RLS policies mungkin menghalangi akses ke profil

## Solusi

### Step 1: Update Database Schema (Required)
1. Buka [Supabase Console](https://app.supabase.com)
2. Pilih project Anda
3. Buka **SQL Editor**
4. Copy-paste script dari file `fix-profile-role.sql` di project ini
5. Jalankan script

Script ini akan:
- Fix trigger untuk selalu set role = 'student'
- Update semua existing profiles yang role-nya NULL
- Ensure semua auth users punya profil

### Step 2: Verify Database Fix
Di SQL Editor, jalankan:
```sql
SELECT COUNT(*) as total_users FROM auth.users;
SELECT COUNT(*) as total_profiles FROM profiles;
SELECT id, full_name, role FROM profiles WHERE role IS NULL;
```

Pastikan:
- Jumlah profiles = jumlah users
- Tidak ada profiles dengan role NULL

### Step 3: Clear Browser Cache
1. Buka DevTools (F12)
2. Clear cache dan cookies
3. Atau gunakan incognito window

### Step 4: Test Login
1. Buat akun baru atau gunakan akun existing
2. Login dengan email dan password
3. Seharusnya berhasil dan redirect ke dashboard

## Troubleshooting

### Masih error "gagal memverifikasi profil pengguna"
Check browser console (F12):
1. Buka tab **Console**
2. Cari error messages
3. Share error message untuk debugging

### RLS Policy Error
Jika error menyebutkan "row level security policy", jalankan di SQL Editor:
```sql
-- Check RLS policies
SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename = 'profiles';

-- If missing, recreate policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

### Profile tidak terbuat saat signup
Check apakah trigger berjalan:
```sql
SELECT tgname, tgenabled FROM pg_trigger WHERE trelid = 'profiles'::regclass;
```

Harusnya ada trigger `on_auth_user_created`.

## Developer Notes

Perubahan yang sudah dibuat:
- ✅ Updated database trigger untuk set role = 'student'
- ✅ Added retry logic di `lib/profile.ts`
- ✅ Improved error logging
- ✅ Simplified login flow (removed manual role selection)
- ✅ Auto-create profile saat login jika belum ada

Files yang dimodifikasi:
- `app/login/page.tsx` - Removed role selection UI
- `app/register/page.tsx` - Use new profile utils
- `lib/profile.ts` - Added retry logic dan better error handling
- `database-schema.sql` - Updated trigger

## Testing Checklist

- [ ] Jalankan fix-profile-role.sql di Supabase
- [ ] Buat akun baru via register page
- [ ] Login dengan akun baru
- [ ] Verify user redirect ke /dashboard
- [ ] Login dengan akun admin dan redirect ke /admin
- [ ] Check browser console untuk errors
