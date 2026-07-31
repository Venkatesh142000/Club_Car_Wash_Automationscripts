import { test, expect } from '../fixtures/baseFixture.js';
import helpers from '../utils/helpers.js';

const isDbConfigured =
  !!(process.env.DB_USER || process.env.MYSQL_USER) &&
  !!(process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD) &&
  !!(process.env.DB_NAME || process.env.MYSQL_DATABASE);

test.describe('MySQL database validation', () => {
  test.beforeEach(async () => {
    if (!isDbConfigured) {
      test.skip();
    }
  });

  test('should connect and run a simple query when DB env vars are configured', async ({ dbHelper }) => {
    const connection = await dbHelper.connect();
    const [rows] = await connection.execute('SELECT 1 as result');

    expect(rows[0].result).toBe(1);
    await helpers.logTestStep({ step: 'Successfully connected to database and executed simple query', status: 'PASS' });
  });

  test('should fetch customer row count and validate data quality', async ({ dbHelper }) => {
    const customerCount = await helpers.assertDbRowCount({ dbHelper, tableName: 'customers', expectedCount: 100 });
    expect(customerCount).toBeGreaterThan(0);

    const customers = await helpers.queryDbWithRetry({
      dbHelper,
      query: 'SELECT customer_id, first_name, last_name, email, phone, city FROM customers',
    });
    
    const nullValues = helpers.findNullValuesInRows({ rows: customers, columns: ['customer_id', 'first_name', 'last_name', 'email', 'phone', 'city'] });
    expect(nullValues).toEqual([]);

    const nonNullRows = helpers.getNonNullRows({ rows: customers, columns: ['customer_id', 'first_name', 'last_name', 'email'] });
    expect(nonNullRows.length).toBeGreaterThan(0);
    
    await helpers.logTestStep({ step: 'Customer data quality validation passed', status: 'PASS', data: { count: customerCount, nullValues: nullValues.length } });
  });

  test('should fetch rows and eliminate null values from result set', async ({ dbHelper }) => {
    const rows = await dbHelper.query('SELECT customer_id, first_name, last_name, email, phone, city FROM customers WHERE city IS NOT NULL');
    const cleanedRows = rows.map((row) => ({
      customer_id: row.customer_id,
      first_name: row.first_name ?? 'N/A',
      last_name: row.last_name ?? 'N/A',
      email: row.email ?? 'N/A',
      phone: row.phone ?? 'N/A',
      city: row.city ?? 'N/A',
    }));

    expect(cleanedRows.length).toBeGreaterThan(0);
    expect(cleanedRows[0].first_name).toBeTruthy();
    
    await helpers.logTestStep({ step: 'Null value elimination test passed', status: 'PASS', data: { rowsCount: cleanedRows.length } });
  });

  test('should validate uniqueness and email format for customers', async ({ dbHelper }) => {
    const customers = await helpers.queryDbWithRetry({
      dbHelper,
      query: 'SELECT customer_id, email FROM customers',
    });
    
    const duplicates = helpers.findDuplicateValues({ rows: customers, column: 'email' });
    expect(duplicates).toEqual([]);

    const invalidEmails = helpers.assertEmailFormat({ rows: customers, column: 'email' });
    expect(invalidEmails).toEqual([]);
    
    await helpers.logTestStep({ step: 'Email uniqueness and format validation passed', status: 'PASS', data: { totalEmails: customers.length } });
  });

  test('should validate foreign keys and order totals', async ({ dbHelper }) => {
    const invalidForeignKeys = await helpers.validateForeignKeyIntegrity({
      dbHelper,
      tableName: 'orders',
      column: 'customer_id',
      referencedTable: 'customers',
      referencedColumn: 'customer_id',
    });

    expect(invalidForeignKeys).toEqual([]);

    const orderMismatches = await helpers.assertOrderTotals({ dbHelper });
    expect(orderMismatches).toEqual([]);
    
    await helpers.logTestStep({ step: 'Foreign key and order total validation passed', status: 'PASS' });
  });
});
