// convert-px.mjs
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, extname } from 'path'

const TARGET_EXTS = ['.jsx', '.tsx', '.js', '.ts', '.css']
const ROOT = './src'

function convertPxToRem(content) {
  return content.replace(/(\d+(\.\d+)?)px/g, (match, num) => {
    const val = parseFloat(num)
    if (val === 0) return '0'
    if (val <= 4) return match  // border 등 작은 값은 유지
    return `${+(val / 16).toFixed(4)}rem`
  })
}

function walkDir(dir) {
  readdirSync(dir).forEach(file => {
    const fullPath = join(dir, file)
    if (statSync(fullPath).isDirectory()) {
      walkDir(fullPath)
    } else if (TARGET_EXTS.includes(extname(file))) {
      const original = readFileSync(fullPath, 'utf8')
      const converted = convertPxToRem(original)
      if (original !== converted) {
        writeFileSync(fullPath, converted)
        console.log('✅', fullPath)
      }
    }
  })
}

walkDir(ROOT)
console.log('🎉 완료!')