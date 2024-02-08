const request = require('supertest');
const app = require('../../app');
const db = require('../../db');

describe('Invoice Routes', () => {
    beforeEach(async () => {
        // Insert a test company into the companies table
        await db.query(`INSERT INTO companies (code, name, description) VALUES ('test-company', 'Test Company', 'This is a test company')`);
        // Setup test data for invoices linked to the test company
        await db.query(`INSERT INTO invoices (comp_code, amt) VALUES ('testco', 100)`);
    });
    
    afterEach(async () => {
        // Cleanup test data from invoices first to maintain referential integrity
        await db.query(`DELETE FROM invoices`);
        // Specifically remove the test company from the companies table
        await db.query(`DELETE FROM companies WHERE code = 'testco'`);
    });
    
    test('GET /invoices - fetch all invoices', async () => {
        const response = await request(app).get('/invoices');
        expect(response.statusCode).toBe(200);
        expect(response.body.invoices).toBeInstanceOf(Array);
    });

    test('POST /invoices - create a new invoice', async () => {
        const newInvoice = { comp_code: 'test-company', amt: 150 }; // Use slugified company code
        const response = await request(app).post('/invoices').send(newInvoice);
        expect(response.statusCode).toBe(201); // Checks for 201 Created
        expect(response.body.invoice).toHaveProperty('id');
        expect(response.body.invoice.amt).toBe(newInvoice.amt);
    });

    test('GET /invoices/:id - fetch a single invoice by ID', async () => {
        // Insert an invoice to fetch
        const insertRes = await db.query(`INSERT INTO invoices (comp_code, amt) VALUES ('test-company', 200) RETURNING id`);
        const invoiceId = insertRes.rows[0].id;

        const response = await request(app).get(`/invoices/${invoiceId}`);
        expect(response.statusCode).toBe(200);
        expect(response.body.invoice).toHaveProperty('id', invoiceId);
    });

    test('PUT /invoices/:id - update an invoice', async () => {
        // Insert an invoice to update
        const insertRes = await db.query(`INSERT INTO invoices (comp_code, amt) VALUES ('test-company', 250) RETURNING id`);
        const invoiceId = insertRes.rows[0].id;
    
        const updatedInvoice = { amt: 300 };
        const response = await request(app).put(`/invoices/${invoiceId}`).send(updatedInvoice);
        expect(response.statusCode).toBe(200);
        expect(response.body.invoice.amt).toBe(updatedInvoice.amt);
    });

    test('DELETE /invoices/:id - delete an invoice', async () => {
    // Insert an invoice to delete
    const insertRes = await db.query(`INSERT INTO invoices (comp_code, amt) VALUES ('test-company', 100) RETURNING id`);
    const invoiceId = insertRes.rows[0].id;

    const response = await request(app).delete(`/invoices/${invoiceId}`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ status: 'deleted' });
});
});
