const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

const logPath = path.join('server.log')
const logStream = fs.createWriteStream(logPath, { flags: 'a' })

const port = process.env.PORT || '3000'
const nextBin = path.join('node_modules', 'next', 'dist', 'bin', 'next')
const standaloneServer = path.join('.next', 'standalone', 'server.js')

const useStandalone = fs.existsSync(standaloneServer)
const args = useStandalone ? [standaloneServer] : [nextBin, 'start', '-p', port]
const child = spawn(process.execPath, args, {
  env: { ...process.env, NODE_ENV: 'production' },
  stdio: ['ignore', 'pipe', 'pipe']
})

child.stdout.on('data', (data) => {
  process.stdout.write(data)
  logStream.write(data)
})

child.stderr.on('data', (data) => {
  process.stderr.write(data)
  logStream.write(data)
})

child.on('close', (code) => {
  logStream.end()
  process.exit(code ?? 0)
})