import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  jwtSecret: process.env.JWT_SECRET || 'pmoc_super_secret_jwt_key_2026',
  jwtExpiresIn: '8h',
  bodyLimit: process.env.BODY_LIMIT || '250mb',
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  database: {
    host: process.env.DB_HOST || 'mariadb',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'pmoc_user',
    password: process.env.DB_PASSWORD || 'pmoc_password_2026',
    database: process.env.DB_NAME || 'pmoc_db',
    connectionLimit: 10,
    maxAllowedPacket: 256 * 1024 * 1024
  },
  activeDirectory: {
    host: process.env.AD_HOST || '',
    port: parseInt(process.env.AD_PORT || '389', 10),
    baseDN: process.env.AD_BASE_DN || 'DC=BSFS,DC=LOCAL',
    adminGroup: process.env.AD_GROUP_ADMIN || 'BSFS_OPE_SYSADMIN',
    userGroup: process.env.AD_GROUP_USER || 'BSFS_OPE_SYSUSER'
  }
};
