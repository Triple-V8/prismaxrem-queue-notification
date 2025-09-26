"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testConnection = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const getDatabaseConfig = () => {
    if (process.env.DATABASE_URL) {
        return {
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        };
    }
    return {
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'reminder_app',
        password: process.env.DB_PASSWORD || 'password',
        port: Number(process.env.DB_PORT) || 5432,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
    };
};
const poolConfig = getDatabaseConfig();
const pool = new pg_1.Pool(poolConfig);
pool.on('connect', () => {
    console.log('✅ Connected to PostgreSQL database');
});
pool.on('error', (err) => {
    console.error('❌ Unexpected error on idle client', err);
    process.exit(-1);
});
const testConnection = async () => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        console.log('Database connection test successful:', result.rows[0]);
        client.release();
    }
    catch (err) {
        console.error('Database connection test failed:', err);
        throw err;
    }
};
exports.testConnection = testConnection;
exports.default = pool;
