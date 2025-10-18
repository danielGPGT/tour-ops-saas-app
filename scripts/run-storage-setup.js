const { exec } = require('child_process')
const path = require('path')

console.log('🚀 Setting up Supabase storage for contracts...')

const scriptPath = path.join(__dirname, 'setup-contracts-storage.js')

exec(`node ${scriptPath}`, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error running storage setup:', error)
    return
  }
  
  if (stderr) {
    console.error('⚠️ Warnings:', stderr)
  }
  
  console.log(stdout)
  console.log('✅ Storage setup complete!')
})
