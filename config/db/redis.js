import { createClient } from 'redis';
let client = createClient();
client.on('error', (err) => console.log('Redis Client Error', err));

exports.redis = async() => {
  await client.connect();
  return client
}



