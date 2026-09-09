const fs = require('fs');

const file = 'src/screens/TeamLeadDashboard.js';
let t = fs.readFileSync(file, 'utf8');

// Accept onLogout in tabs
t = t.replace(/const (\w+)Tab = \(\{ token \}\) => \{/g, 'const $1Tab = ({ token, onLogout }) => {');

// Pass onLogout to DashHeader
t = t.replace(/<DashHeader title="([^"]+)" subtitle="([^"]+)" \/>/g, '<DashHeader title="$1" subtitle="$2" onLogout={onLogout} />');

fs.writeFileSync(file, t);
console.log("Updated TeamLeadDashboard.js");
