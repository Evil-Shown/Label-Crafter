import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createBarcodeField, createQrField } from '../src/elements/factories.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const srcDir = path.resolve(__dirname, '../src')

function getAllFiles(dir, ext = ['.js', '.jsx', '.ts', '.tsx']) {
  let results = []
  const list = fs.readdirSync(dir)
  for (const file of list) {
    const fullPath = path.join(dir, file)
    const stat = fs.statSync(fullPath)
    if (stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, ext))
    } else if (ext.some((e) => file.endsWith(e))) {
      results.push(fullPath)
    }
  }
  return results
}

test('Invariant: no hardcoded fake part numbers or domains in src/', () => {
  const files = getAllFiles(srcDir)
  const forbidden = ['123456789012', 'spil-labs.com']

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8')
    for (const term of forbidden) {
      assert.strictEqual(
        content.includes(term),
        false,
        `Forbidden literal "${term}" found in ${path.relative(srcDir, file)}`
      )
    }
  }
})

test('Regression: factory defaults for barcode and QR code must never contain sample literals', () => {
  const bc = createBarcodeField()
  assert.strictEqual(bc.value, '', 'createBarcodeField value must be empty string by default')
  assert.strictEqual(bc.fallbackValue, '', 'createBarcodeField fallbackValue must be empty string by default')

  const qr = createQrField()
  assert.strictEqual(qr.value, '', 'createQrField value must be empty string by default')
  assert.strictEqual(qr.fallbackValue, '', 'createQrField fallbackValue must be empty string by default')
})
