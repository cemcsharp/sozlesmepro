const fs = require('fs')
const path = require('path')

async function copyDir(src, dest) {
  await fs.promises.mkdir(dest, { recursive: true })
  if (fs.promises.cp) {
    await fs.promises.cp(src, dest, { recursive: true, force: true })
    return
  }
  const entries = await fs.promises.readdir(src, { withFileTypes: true })
  await Promise.all(entries.map(async (entry) => {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath)
    } else if (entry.isSymbolicLink()) {
      const link = await fs.promises.readlink(srcPath)
      await fs.promises.symlink(link, destPath)
    } else {
      await fs.promises.mkdir(path.dirname(destPath), { recursive: true })
      await fs.promises.copyFile(srcPath, destPath)
    }
  }))
}

async function main() {
  const standaloneDir = path.join('.next', 'standalone')
  const standaloneNextDir = path.join(standaloneDir, '.next')
  await fs.promises.mkdir(standaloneNextDir, { recursive: true })

  const staticSrc = path.join('.next', 'static')
  const staticDest = path.join(standaloneNextDir, 'static')
  if (fs.existsSync(staticSrc)) {
    await copyDir(staticSrc, staticDest)
  }

  const publicSrc = 'public'
  const publicDest = path.join(standaloneDir, 'public')
  if (fs.existsSync(publicSrc)) {
    await copyDir(publicSrc, publicDest)
  }
}

main().catch((err) => { console.error(err); process.exit(1) })