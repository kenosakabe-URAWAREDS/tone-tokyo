// _sanity.jsを差し替え
const {createClient} = require('next-sanity');
const c = createClient({
  projectId: 'w757ks40',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: 'skxZIZIacGMhcmp2ArMJueQcFK1SQpcpj8CQTAsn49g3eMmonbcs8SGCT43oe7MQE2Qvalwd9cKYvuzyvmMhBo0RF3tDsqYKjiz4FlgRgyqiydAVNZrk22LosoNSNIut5GK8E0KJqR80b88LIyboa8CcaCjkesKyuXLlbEB1KnMacAgg1Zqi'
});

async function run() {
  const arts = await c.fetch('*[_type == "article" && !defined(heroImageUrl)]{_id, title}');
  for (const a of arts) {
    await c.patch(a._id).set({heroImageUrl: 'https://images.unsplash.com/photo-1554797589-7241bb691973?w=1200&q=80'}).commit();
    console.log('Fixed: ' + a.title);
  }
  console.log('Done!');
}
run();