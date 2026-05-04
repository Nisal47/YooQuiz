/**
 * Parse PapaParse output into validated quiz questions.
 *
 * Expected CSV headers (case-insensitive):
 *   question, option_a, option_b, option_c, option_d, correct, time_limit
 *
 * Returns { valid: Question[], rows: ParsedRow[] }
 * where ParsedRow = { index, rawRow, question?, errors: string[] }
 */

const CORRECT_MAP = { a: 0, b: 1, c: 2, d: 3 }

export function parseQuizCsv(papaParsedData) {
  const rows = papaParsedData.data

  const result = rows
    .filter(row => Object.values(row).some(v => String(v).trim() !== '')) // skip blank rows
    .map((row, index) => {
      const norm = normalise(row)
      const errors = []

      const question = (norm.question || '').trim()
      if (!question) errors.push('Question text is required')

      const optA = (norm.option_a || '').trim()
      const optB = (norm.option_b || '').trim()
      if (!optA) errors.push('option_a is required')
      if (!optB) errors.push('option_b is required')

      const optC = (norm.option_c || '').trim()
      const optD = (norm.option_d || '').trim()

      // Build options array, omitting trailing empty options
      const allOpts = [optA, optB, optC, optD]
      const lastFilled = [...allOpts].reverse().findIndex(o => o !== '')
      const options = allOpts.slice(0, allOpts.length - lastFilled)

      const correctRaw = (norm.correct || '').trim().toLowerCase()
      let correctIndex = -1
      if (correctRaw === '') {
        errors.push('Correct answer is required (A/B/C/D or 0/1/2/3)')
      } else if (/^[abcd]$/.test(correctRaw)) {
        correctIndex = CORRECT_MAP[correctRaw]
      } else if (/^[0-3]$/.test(correctRaw)) {
        correctIndex = Number(correctRaw)
      } else {
        errors.push(`Invalid correct value "${norm.correct}" — use A/B/C/D or 0/1/2/3`)
      }

      if (correctIndex >= 0 && correctIndex >= options.length) {
        errors.push(`Correct answer points to option ${correctIndex + 1} but only ${options.length} options provided`)
      }

      const timeLimitRaw = (norm.time_limit || '').trim()
      let timeLimit = 30
      if (timeLimitRaw !== '') {
        const parsed = Number(timeLimitRaw)
        if (isNaN(parsed) || parsed <= 0) {
          errors.push(`Invalid time_limit "${timeLimitRaw}" — must be a positive number`)
        } else {
          timeLimit = parsed
        }
      }

      const parsed = errors.length === 0
        ? { question, options, correctIndex, timeLimit, order: index }
        : null

      return { index, rawRow: row, parsed, errors }
    })

  const valid = result.filter(r => r.errors.length === 0).map(r => r.parsed)
  return { valid, rows: result }
}

/** Normalise a row's keys to lowercase with underscores. */
function normalise(row) {
  const out = {}
  for (const [k, v] of Object.entries(row)) {
    out[k.toLowerCase().replace(/\s+/g, '_')] = v
  }
  return out
}

/** Generate a sample CSV string for download. */
export function buildCsvTemplate() {
  const header = 'question,option_a,option_b,option_c,option_d,correct,time_limit'
  const rows = [
    '"What is 2 + 2?","1","2","3","4","C","30"',
    '"Capital of France?","Berlin","Paris","Rome","Madrid","B","20"',
  ]
  return [header, ...rows].join('\n')
}
