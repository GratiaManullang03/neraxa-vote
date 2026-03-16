const fs = require('fs');
const path = require('path');

// Read .env file
const envPath = path.join(__dirname, '.env');
let redisUrl = '';
let redisToken = '';

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const urlMatch = envContent.match(
        /UPSTASH_REDIS_REST_URL=["']?([^"'\n]+)["']?/,
    );
    const tokenMatch = envContent.match(
        /UPSTASH_REDIS_REST_TOKEN=["']?([^"'\n]+)["']?/,
    );

    if (urlMatch) redisUrl = urlMatch[1];
    if (tokenMatch) redisToken = tokenMatch[1];
}

// Update script.js
const scriptPath = path.join(__dirname, 'script.js');
let scriptContent = fs.readFileSync(scriptPath, 'utf8');
scriptContent = scriptContent.replace(
    /const UPSTASH_REDIS_REST_URL = '[^']*'/,
    `const UPSTASH_REDIS_REST_URL = '${redisUrl}'`,
);
scriptContent = scriptContent.replace(
    /const UPSTASH_REDIS_REST_TOKEN = '[^']*'/,
    `const UPSTASH_REDIS_REST_TOKEN = '${redisToken}'`,
);
fs.writeFileSync(scriptPath, scriptContent);

// Update admin.html
const adminPath = path.join(__dirname, 'admin.html');
let adminContent = fs.readFileSync(adminPath, 'utf8');
adminContent = adminContent.replace(
    /const UPSTASH_REDIS_REST_URL = '[^']*'/,
    `const UPSTASH_REDIS_REST_URL = '${redisUrl}'`,
);
adminContent = adminContent.replace(
    /const UPSTASH_REDIS_REST_TOKEN = '[^']*'/,
    `const UPSTASH_REDIS_REST_TOKEN = '${redisToken}'`,
);
fs.writeFileSync(adminPath, adminContent);

console.log('✓ Environment variables injected successfully');
console.log(`  Redis URL: ${redisUrl ? 'configured' : 'not set'}`);
console.log(`  Redis Token: ${redisToken ? 'configured' : 'not set'}`);
