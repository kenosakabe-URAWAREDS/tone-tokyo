const {createClient} = require('next-sanity');
const c = createClient({
  projectId: 'w757ks40',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: 'skxZIZIacGMhcmp2ArMJueQcFK1SQpcpj8CQTAsn49g3eMmonbcs8SGCT43oe7MQE2Qvalwd9cKYvuzyvmMhBo0RF3tDsqYKjiz4FlgRgyqiydAVNZrk22LosoNSNIut5GK8E0KJqR80b88LIyboa8CcaCjkesKyuXLlbEB1KnMacAgg1Zqi'
});
c.delete('cbF5URwD8NwlNtnKdNkQWI').then(() => {
  console.log('Test Article deleted!');
}).catch(e => console.error('Error:', e.message));