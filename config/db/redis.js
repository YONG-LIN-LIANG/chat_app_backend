import { createClient } from 'redis';
let client = createClient();
client.on('error', (err) => console.log('Redis Client Error', err));

const redis = async() => {
  await client.connect();
  return client
}

export { redis }



