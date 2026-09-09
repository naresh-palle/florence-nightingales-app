const fs = require('fs');

const makeClickable = (file) => {
  let t = fs.readFileSync(file, 'utf8');
  
  t = t.replace(/<View style=\{s\.rowCard\}>/g, '<TouchableOpacity style={s.rowCard} onPress={() => alert("Detailed view coming soon")}>');
  t = t.replace(/<\/View>(\s+)<\/TouchableOpacity>/g, '</View>$1</TouchableOpacity>'); // to prevent double nesting if any
  t = t.replace(/<View style=\{\[s\.rowCard, \{ alignItems: 'flex-start' \}\]\}>/g, '<TouchableOpacity style={[s.rowCard, { alignItems: "flex-start" }]} onPress={() => alert("Detailed view coming soon")}>');
  
  t = t.replace(/<View style=\{s\.invoiceCard\}>/g, '<TouchableOpacity style={s.invoiceCard} onPress={() => alert("Detailed view coming soon")}>');
  
  // Replace the closing tags
  t = t.replace(/<\/View>(\s+)\}\)/g, '</TouchableOpacity>$1})');
  
  fs.writeFileSync(file, t);
};

makeClickable('src/screens/AdminDashboard.js');
makeClickable('src/screens/TeamLeadDashboard.js');
makeClickable('src/screens/EmployeeDashboard.js');

console.log("Made cards clickable");
