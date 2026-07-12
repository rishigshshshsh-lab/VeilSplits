const fs = require('fs');
const path = require('path');

const mdPath = path.join(__dirname, '../docs/real_user_proof.md');
if (fs.existsSync(mdPath)) {
  const content = fs.readFileSync(mdPath, 'utf8');
  const lines = content.split('\n');
  const targetLine = lines.find(l => l.includes('48e8ca7ce59a'));
  if (targetLine) {
    console.log("Found line:", targetLine);
    console.log("Character codes of the URL part:");
    const urlMatch = targetLine.match(/\((.*?)\)/);
    if (urlMatch) {
      const url = urlMatch[1];
      console.log("URL:", url);
      const chars = [];
      for (let i = 0; i < url.length; i++) {
        chars.push(`${url[i]}:${url.charCodeAt(i)}`);
      }
      console.log(chars.join(' '));
    } else {
      console.log("No URL match found in line");
    }
  } else {
    console.log("Target line not found");
  }
} else {
  console.log("Markdown proof file not found");
}
