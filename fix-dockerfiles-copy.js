const fs = require('fs');
const { execSync } = require('child_process');

try {
  const files = execSync('dir /s /b Dockerfile*', { encoding: 'utf8' })
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && l.includes('Dockerfile') && !l.includes('node_modules') && !l.includes('.antigravity'));

  let count = 0;
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    content = content.split('\n').map(line => {
      if (/^\s*COPY\s+/i.test(line) && !line.includes('--chmod=')) {
        return line.replace(/^(\s*COPY\s+)/i, '$1--chmod=0755 ');
      }
      return line;
    }).join('\n');

    if (content !== original) {
      fs.writeFileSync(file, content);
      console.log('Fixed', file);
      count++;
    }
  }
  console.log(`Fixed ${count} files.`);
} catch (err) {
  console.error(err);
}
