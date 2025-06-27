require('dotenv').config({ path: '.env.local' });
console.log('NEO4J_URI:', process.env.NEO4J_URI ? '✅ Found' : '❌ Missing');
console.log('NEO4J_USERNAME:', process.env.NEO4J_USERNAME ? '✅ Found' : '❌ Missing');
console.log('NEO4J_PASSWORD:', process.env.NEO4J_PASSWORD ? '✅ Found' : '❌ Missing');
