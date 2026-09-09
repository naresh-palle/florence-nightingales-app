const fs = require('fs');

const file = 'src/screens/EmployeeDashboard.js';
let t = fs.readFileSync(file, 'utf8');

// Accept onLogout in tabs
t = t.replace(/const (\w+)Tab = \(\{ token \}\) => \{/g, 'const $1Tab = ({ token, onLogout }) => {');

// Pass onLogout to DashHeader
t = t.replace(/<DashHeader title="([^"]+)" subtitle="([^"]+)" \/>/g, '<DashHeader title="$1" subtitle="$2" onLogout={onLogout} />');

// Pass onLogout from navigator
t = t.replace(/<Tab\.Screen name="([^"]+)">\{\(\) => <(\w+)Tab token=\{token\} \/><\/Tab\.Screen>/g, '<Tab.Screen name="$1">{() => <$2Tab token={token} onLogout={onLogout} />}</Tab.Screen>');

fs.writeFileSync(file, t);
console.log("Updated EmployeeDashboard.js");
