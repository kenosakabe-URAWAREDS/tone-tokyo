const fs = require('fs');
let f = fs.readFileSync('app/HomeClient.tsx', 'utf8');
// Wrap the section in an <a> tag
f = f.replace(
  '    <section style={{ position: "relative", height: "85vh", minHeight: 480, overflow: "hidden", background: CHARCOAL }}>',
  '    <a href={"/article/" + FEATURED.slug} style={{ textDecoration: "none", display: "block" }}><section style={{ position: "relative", height: "85vh", minHeight: 480, overflow: "hidden", background: CHARCOAL }}>'
);
f = f.replace(
  '    </section>\n  );',
  '    </section></a>\n  );'
);
fs.writeFileSync('app/HomeClient.tsx', f);
console.log('Done');
