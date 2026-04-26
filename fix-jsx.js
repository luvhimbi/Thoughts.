const fs = require('fs');
const path = require('path');

const paths = [
  'src/pages/ViewEntry.jsx',
  'src/pages/Affirmations.jsx',
  'src/components/TemplateSelector.jsx',
  'src/components/RichTextEditor.jsx',
  'src/components/MoodSelector.jsx',
  'src/components/DesignSelector.jsx',
  'src/pages/Release.jsx',
  'src/components/Navigation.jsx'
];

paths.forEach(p => {
  const fullPath = path.join(__dirname, p);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    content = content.replace(/<style jsx="true">/g, '<style>');
    content = content.replace(/<style jsx>/g, '<style>');
    fs.writeFileSync(fullPath, content);
    console.log('Fixed', p);
  }
});
