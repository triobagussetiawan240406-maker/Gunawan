import { Feedback } from './types'

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_API_URL =
  process.env.GROQ_API_URL ?? 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = process.env.GROQ_MODEL ?? 'llama3-8b-8192'

export async function runCode(
  code: string,
  input: string,
  language: 'python' | 'javascript'
): Promise<{ output: string; error?: string }> {
  if (!GROQ_API_KEY) {
    return { 
      output: '', 
      error: 'GROQ_API_KEY tidak dikonfigurasi. Silakan set environment variable GROQ_API_KEY.' 
    }
  }

  // Prepare prompt for Groq to execute code
  const executionPrompt = language === 'python' 
    ? `Jalankan code Python berikut dan kembalikan output atau error yang terjadi.

INPUT (jika ada):
${input || '(tidak ada input)'}

CODE:
\`\`\`python
${code}
\`\`\`

PETUNJUK:
1. Eksekusi code secara literal seperti interpreter Python
2. Untuk input: gunakan nilai yang diberikan di atas (simulasikan input())
3. Kembalikan HANYA output code, tanpa penjelasan tambahan
4. Jika ada error, tampilkan error message
5. Format response: 
   - Jika berhasil: output langsung
   - Jika error: ERROR: [deskripsi error]`
    : `Jalankan code JavaScript berikut dan kembalikan output atau error yang terjadi.

INPUT (jika ada):
${input || '(tidak ada input)'}

CODE:
\`\`\`javascript
${code}
\`\`\`

PETUNJUK:
1. Eksekusi code secara literal seperti Node.js interpreter
2. Kembalikan HANYA output code, tanpa penjelasan tambahan
3. Jika ada error, tampilkan error message
4. Format response:
   - Jika berhasil: output langsung
   - Jika error: ERROR: [deskripsi error]`

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: executionPrompt }],
        temperature: 0,
        max_tokens: 500
      })
    })

    if (!response.ok) {
      const error = await response.json()
      return {
        output: '',
        error: `Groq API Error: ${error.error?.message || 'Unknown error'}`
      }
    }

    const json = await response.json()
    const content = json?.choices?.[0]?.message?.content || ''
    
    if (!content) {
      return {
        output: '',
        error: 'Groq API returned empty response'
      }
    }

    // Check if output contains error marker
    if (content.trim().startsWith('ERROR:')) {
      return {
        output: '',
        error: content.trim().replace('ERROR:', '').trim()
      }
    }

    return {
      output: content.trim()
    }
  } catch (error: any) {
    return {
      output: '',
      error: `Execution failed: ${error.message}`
    }
  }
}

async function callGroqFeedback(
  testResults: Array<{ passed: boolean; input: string; output: string; expected: string }>,
  code: string
): Promise<Feedback[] | null> {
  if (!GROQ_API_KEY) {
    return null
  }

  const failedTests = testResults.filter((r) => !r.passed)
  
  // Build detailed test case summary
  const testCaseSummary = testResults.map((test, idx) => `
Test Case ${idx + 1}: ${test.passed ? '✅ LOLOS' : '❌ GAGAL'}
Input: ${test.input || '(empty)'}
Expected Output: ${test.expected}
Actual Output: ${test.output || '(empty/error)'}
`).join('\n')

  const prompt = `Anda adalah instruktur pemrograman. Analisis kode siswa di bawah ini dan berikan feedback RINCI tentang kesalahan spesifik dan cara memperbaikinya.

KODE SISWA:
\`\`\`
${code}
\`\`\`

HASIL TEST CASE:
${testCaseSummary}

PERSYARATAN FEEDBACK:
1. Identifikasi MASALAH SPESIFIK (bukan umum) di kode siswa
2. Tunjukkan BARIS KODE atau BAGIAN yang bermasalah
3. Jelaskan MENGAPA output tidak sesuai dengan expected output
4. Berikan SARAN PERBAIKAN yang detail dan praktis
5. Jika ada pattern kesalahan di multiple test cases, tunjukkan polanya

Gunakan kategori:
- success: Jika semua test case lolos
- logic: Kesalahan logika/algoritma (detail cara memperbaiki)
- syntax: Syntax error/indentation (tunjukkan baris yang salah)
- output: Lupa print() atau format output salah
- loop: Problem dengan loop (infinite loop, kondisi salah, dst)
- input: Problem dengan mengambil input

Respon dalam JSON array, contoh:
[
  {"message": "Baris 5-7: Loop Anda tidak berhenti karena kondisi 'while True'. Ganti dengan 'while i < n:' dan tambah 'i += 1' di dalam loop.", "category": "loop"},
  {"message": "Baris 3: Gunakan int(input()) untuk konversi input string ke angka", "category": "input"}
]`

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 500
      })
    })

    const json = await response.json()
    const content =
      json?.choices?.[0]?.message?.content || json?.choices?.[0]?.text || ''
    if (!content) {
      return null
    }

    const parsed = JSON.parse(content.trim())
    if (Array.isArray(parsed)) {
      return parsed.map((item) => ({
        message: String(item.message ?? 'Cek kembali kode Anda.'),
        category: String(item.category ?? 'logic') as Feedback['category']
      }))
    }
  } catch (error) {
    console.error('Groq feedback error:', error)
  }

  return null
}

export async function generateFeedback(
  testResults: Array<{ passed: boolean; input: string; output: string; expected: string }>,
  code: string
): Promise<Feedback[]> {
  const groqFeedback = await callGroqFeedback(testResults, code)
  if (groqFeedback && groqFeedback.length > 0) {
    return groqFeedback
  }

  const feedbacks: Feedback[] = []
  const failedTests = testResults.filter((r) => !r.passed)
  const passedCount = testResults.filter((r) => r.passed).length
  const totalCount = testResults.length

  // All tests passed
  if (failedTests.length === 0) {
    feedbacks.push({
      message: `🎉 Sempurna! Semua ${totalCount} test case berhasil lolos. Kode Anda sudah benar!`,
      category: 'success'
    })
    return feedbacks
  }

  // Show which tests passed/failed
  const testSummary = failedTests
    .map((test, idx) => {
      const testNum = testResults.indexOf(test) + 1
      return `Test Case ${testNum}: Input="${test.input}" | Expected="${test.expected}" | Got="${test.output || '(empty)'}"`
    })
    .join('\n  ')

  // Detailed analysis of failures
  if (failedTests.every((test) => test.output.trim() === '')) {
    feedbacks.push({
      message: `⚠️  MASALAH: Output kosong di semua test case yang gagal.\n\n${testSummary}\n\n💡 SOLUSI: Gunakan print() untuk menampilkan hasil. Contoh:\nprint(result)\n\nTanpa print(), program tidak menampilkan output apapun.`,
      category: 'output'
    })
  } else if (failedTests.some((test) => test.output.includes('Error'))) {
    const errorTests = failedTests.filter((test) => test.output.includes('Error'))
    const errorMsg = errorTests[0].output.split('\n')[0]
    feedbacks.push({
      message: `❌ SYNTAX/RUNTIME ERROR:\n${errorMsg}\n\n${testSummary.substring(0, 150)}...\n\n💡 SOLUSI: \n- Cek indentasi (gunakan 4 spasi atau 1 tab konsisten)\n- Cek kurung buka-tutup ( ) [ ] { }\n- Cek tanda titik dua (:) di akhir if/for/while\n- Periksa apakah variabel sudah dideklarasikan sebelum digunakan`,
      category: 'syntax'
    })
  } else if (failedTests.some((test) => test.output.includes('Traceback'))) {
    feedbacks.push({
      message: `❌ RUNTIME ERROR:\nKode Anda mengalami error saat dijalankan.\n\n${testSummary}\n\n💡 KEMUNGKINAN MASALAH:\n- Variabel tidak terdefinisi\n- Tipe data tidak sesuai (int vs string)\n- Index out of range\n- Division by zero\n\nPeriksalah variabel dan tipe data yang digunakan.`,
      category: 'syntax'
    })
  } else if (failedTests.some((test) => test.output.trim() && test.output.trim() !== test.expected)) {
    // Logic error - output ada tapi tidak sesuai
    const firstFailedTest = failedTests[0]
    feedbacks.push({
      message: `❌ LOGIKA SALAH:\nProgram Anda berjalan tapi hasilnya tidak sesuai.\n\n📊 ANALISIS:\n${testSummary}\n\n💡 INVESTIGASI:\n- Cek perhitungan/rumus Anda\n- Cek kondisi if/else, apakah semua kasus tercakup?\n- Cek loop, apakah iterasi sesuai?\n- Cek operator (+, -, *, /, %, ==, !=, <, >, dll)\n\nCara debug:\n1. Tambahkan print() di tengah kode untuk lihat nilai variabel\n2. Trace step-by-step apa yang terjadi di setiap baris\n3. Bandingkan dengan expected output untuk cari perbedaannya`,
      category: 'logic'
    })
  } else if (!code.includes('for') && !code.includes('while')) {
    feedbacks.push({
      message: `⚠️  KURANG LOOP:\nTest case ini memerlukan pengulangan (loop).\n\n${testSummary}\n\n💡 GUNAKAN:\n- 'for' jika tahu jumlah iterasi (for i in range(n))\n- 'while' jika kondisi pengulangan kompleks (while i < 10)\n\nCONTOH:\nfor i in range(5):\n    print(i)`,
      category: 'loop'
    })
  }

  // If still no specific feedback, give general guidance
  if (feedbacks.length === 0) {
    feedbacks.push({
      message: `⚠️  ${passedCount}/${totalCount} test case lolos, ${failedTests.length} gagal.\n\n${testSummary}\n\n💡 TIPS DEBUG:\n1. Baca input dengan benar: gunakan int(input()) untuk angka\n2. Periksa logika di setiap kondisi (if/else/elif)\n3. Cek loop: apakah iterasi benar?\n4. Bandingkan output Anda dengan expected output\n5. Gunakan print() untuk debug nilai variabel\n\nPerlu bantuan? Tunjukkan kode Anda ke instruktur.`,
      category: 'logic'
    })
  }

  return feedbacks
}
