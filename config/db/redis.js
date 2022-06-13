import { createClient } from 'redis';
const client = createClient();
client.on('error', (err) => console.log('Redis Client Error', err));

exports.redis = async() => {
  await client.connect();
  const result = await client.set('key4', 'ddaawas')
  console.log('resulttt', result)
  return client
}


