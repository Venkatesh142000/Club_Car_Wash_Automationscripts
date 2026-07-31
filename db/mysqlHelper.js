import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

export class MySqlHelper {
  constructor(config = {}) {
    this.config = {
      host: config.host || process.env.DB_HOST || process.env.MYSQL_HOST || "127.0.0.1",
      port: Number(config.port || process.env.DB_PORT || process.env.MYSQL_PORT || 3306),
      user: config.user || process.env.DB_USER || process.env.MYSQL_USER,
      password: config.password || process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD,
      database: config.database || process.env.DB_NAME || process.env.MYSQL_DATABASE,
      connectTimeout: Number(config.connectTimeout || process.env.DB_CONNECT_TIMEOUT || 10000),
      ...config,
    };

    this.connection = null;
    this.pool = null;
  }

  async connect() {
    if (this.connection) {
      return this.connection;
    }

    if (!this.config.user || !this.config.password || !this.config.database) {
      throw new Error(
        "MySQL configuration is incomplete. Set DB_HOST, DB_USER, DB_PASSWORD, and DB_NAME."
      );
    }

    this.pool = mysql.createPool({
      host: this.config.host,
      port: this.config.port,
      user: this.config.user,
      password: this.config.password,
      database: this.config.database,
      connectTimeout: this.config.connectTimeout,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    this.connection = await this.pool.getConnection();
    return this.connection;
  }

  async query(sql, params = []) {
    const connection = await this.connect();
    // Use query() so mysql2 identifier placeholders (??) are formatted correctly.
    const [rows] = await connection.query(sql, params);
    return rows;
  }

  async execute(sql, params = []) {
    return this.query(sql, params);
  }

  async disconnect() {
    if (this.connection) {
      this.connection.release();
      this.connection = null;
    }

    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }

  getConfig() {
    return { ...this.config };
  }
}

export default new MySqlHelper();
