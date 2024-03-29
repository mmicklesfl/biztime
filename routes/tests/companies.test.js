const request = require('supertest');
const app = require('../../app');
const db = require('../../db');

describe('Company Routes', () => {
  const testCompany = { code: "testco", name: "Test Company", description: "This is a test company" };

beforeEach(async () => {
    // Insert a test company into the companies table
    await db.query(`INSERT INTO companies (code, name, description) VALUES ('testco', 'Test Company', 'This is a test company')`);
    // Setup test data for invoices related to the test company
    await db.query(`INSERT INTO invoices (comp_code, amt) VALUES ('testco', 100)`);
});

afterEach(async () => {
    // Cleanup test data from invoices
    await db.query(`DELETE FROM invoices`);
    // Specifically remove the test company from the companies table
    await db.query(`DELETE FROM companies WHERE code = 'testco'`);
});
  
  test('GET /companies/:code - fetch a single company by code', async () => {
    const response = await request(app).get(`/companies/${testCompany.code}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.company).toHaveProperty('code', testCompany.code);
  });

  test('POST /companies - create a new company', async () => {
    const newCompany = { code: "testco2", name: "Test Company 2", description: "Another test company" };
    const response = await request(app).post('/companies').send(newCompany);
    expect(response.statusCode).toBe(201); // Checks for 201 Created
    expect(response.body.company).toHaveProperty('code', newCompany.code);
  });

  test('PUT /companies/:code - update a company', async () => {
    const updates = { name: "Updated Test Company", description: "Updated description" };
    const response = await request(app).put('/companies/testco').send(updates);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('company');
  });

  test('DELETE /companies/:code - delete a company', async () => {
    const response = await request(app).delete('/companies/testco');
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ status: "deleted" });
  });
});
