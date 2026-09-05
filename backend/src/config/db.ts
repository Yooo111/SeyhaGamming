import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'register_db';

const DB_URL = process.env.DATABASE_URL || process.env.MYSQL_URL;
const USE_SSL = process.env.DB_SSL === 'true' || (process.env.NODE_ENV === 'production' && !DB_HOST.includes('localhost'));

let pool: mysql.Pool;

export const initDatabase = async (): Promise<mysql.Pool> => {
  if (pool) return pool;

  try {
    if (DB_URL) {
      console.log(`📡 Connecting to MySQL Database via connection URL...`);
      let connUrl = DB_URL.trim();

      // Remove query parameters
      if (connUrl.includes('?')) {
        connUrl = connUrl.split('?')[0];
      }

      // Forcefully replace /sys or missing database path with /test
      connUrl = connUrl.replace(/\/sys\b/gi, '/test');
      if (connUrl.endsWith(':4000') || connUrl.endsWith(':4000/')) {
        connUrl = connUrl.replace(/:4000\/?$/, ':4000/test');
      }

      console.log(`🔗 Sanitized connection URL target: ${connUrl.replace(/:[^:@]+@/, ':****@')}`);

      pool = mysql.createPool({
        uri: connUrl,
        ssl: { rejectUnauthorized: false },
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });
    } else {
      // Local fallback
      pool = mysql.createPool({
        host: DB_HOST,
        port: DB_PORT,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME,
        ssl: USE_SSL ? { rejectUnauthorized: false } : undefined,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });
    }

    // Ensure connection uses 'test' schema
    try {
      await pool.query('USE `test`');
      console.log('✅ Executed: USE `test`');
    } catch (e: any) {
      console.warn('⚠️ USE test note:', e.message);
    }

    // Create required tables if missing
    await createTables();

    return pool;
  } catch (error) {
    console.error('❌ Failed to initialize database connection:', error);
    throw error;
  }
};

const createTables = async () => {
  try {
    await pool.query('USE `test`');
  } catch (e: any) {
    console.warn('⚠️ createTables USE test note:', e.message);
  }

  const createUsersTableSQL = `
    CREATE TABLE IF NOT EXISTS users (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      phone_number VARCHAR(50) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  const createAdminTableSQL = `
    CREATE TABLE IF NOT EXISTS admin_users (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(createUsersTableSQL);
    console.log('✅ Table "users" verified/created (BIGINT ID, Phone Number set to UNIQUE).');
  } catch (e: any) {
    console.warn('⚠️ Users table verification note:', e.message);
  }

  // Upgrade existing table columns if needed
  try {
    await pool.query('ALTER TABLE users MODIFY COLUMN id BIGINT AUTO_INCREMENT, MODIFY COLUMN name VARCHAR(255), MODIFY COLUMN phone_number VARCHAR(50)');
    await pool.query('ALTER TABLE admin_users MODIFY COLUMN id BIGINT AUTO_INCREMENT, MODIFY COLUMN username VARCHAR(100)');
  } catch (e) {
    // Ignore alter errors if columns are already upgraded or disallowed
  }

  try {
    await pool.query(createAdminTableSQL);
    console.log('✅ Table "admin_users" verified/created.');
  } catch (e: any) {
    console.warn('⚠️ Admin table verification note:', e.message);
  }

  // Drop old OTP table if it exists
  try {
    await pool.query('DROP TABLE IF EXISTS otp_codes');
  } catch (e) {
    // Ignore if already dropped
  }

  // Seed or update default admin account (SeyhaAdmin / Seyha@123) with Bcrypt hashing
  try {
    const hashedPassword = await bcrypt.hash('Seyha@123', 10);
    const [admins]: any = await pool.query('SELECT id FROM admin_users LIMIT 1');
    if (admins.length === 0) {
      await pool.query('INSERT INTO admin_users (id, username, password) VALUES (1, ?, ?)', ['SeyhaAdmin', hashedPassword]);
      console.log('🔑 Default Admin created with Bcrypt hashing: Username="SeyhaAdmin"');
    } else {
      await pool.query('UPDATE admin_users SET username = ?, password = ? WHERE id = 1', ['SeyhaAdmin', hashedPassword]);
      console.log('🔑 Admin account synced with Bcrypt hashing: Username="SeyhaAdmin"');
    }
  } catch (e: any) {
    console.error('⚠️ Admin seeding warning:', e.message);
  }
};

export const getPool = (): mysql.Pool => {
  if (!pool) {
    throw new Error('Database pool has not been initialized. Call initDatabase() first.');
  }
  return pool;
};
