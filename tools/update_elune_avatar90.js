const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'asset', 'json', 'avatar', 'data');
const template = JSON.parse(fs.readFileSync(path.join(dataDir, 'avatar91.json'), 'utf8'));

template.id = 90;
template.oriMode = 8;
template.picUrls = [
  'asset/image/avatar/character/elune/Elune_standby_8dir.png',
  'asset/image/avatar/character/elune/Elune_walk_8dir.png',
];

const target = path.join(dataDir, 'avatar90.json');
fs.writeFileSync(target, `${JSON.stringify(template, null, 4)}\n`, 'utf8');
console.log(`updated ${target}`);
