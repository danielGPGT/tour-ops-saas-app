const { exec } = require('child_process')

console.log('📦 Installing required dependencies for contract document upload...')

const dependencies = [
  'react-dropzone',
  '@types/react-dropzone'
]

dependencies.forEach(dep => {
  console.log(`Installing ${dep}...`)
  exec(`npm install ${dep}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Error installing ${dep}:`, error)
      return
    }
    console.log(`✅ ${dep} installed successfully`)
  })
})
