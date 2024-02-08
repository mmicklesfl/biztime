const express = require('express');
const router = express.Router();

// PostgreSQL pool setup for database connection as suggested by mentor Sean
const pool = require('../db');

// GET all invoices - List basic info about all invoices
router.get('/', async (req, res, next) => {
    try {
        // Query database for all invoices and return their ID and company code
        const result = await pool.query('SELECT id, comp_code FROM invoices');
        // Send query results back to the client
        res.json({ invoices: result.rows });
    } catch (err) {
        // Handle errors 
        return next(err);
    }
});

// GET a specific invoice by ID - Return detailed info about a single invoice
router.get('/:id', async (req, res, next) => {
    try {
        // Extract invoice ID from the request parameters
        const { id } = req.params;
        // Query database for the invoice, including company details through a JOIN
        const result = await pool.query(
            'SELECT invoices.id, invoices.comp_code, invoices.amt, invoices.paid, invoices.add_date, invoices.paid_date, companies.code, companies.name, companies.description FROM invoices JOIN companies ON invoices.comp_code = companies.code WHERE invoices.id = $1', 
            [id]
        );

        // If no invoice found, return a 404
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        // Construct the detailed invoice object, including nested company info
        const invoice = {
            id: result.rows[0].id,
            amt: result.rows[0].amt,
            paid: result.rows[0].paid,
            add_date: result.rows[0].add_date,
            paid_date: result.rows[0].paid_date,
            company: {
                code: result.rows[0].code,
                name: result.rows[0].name,
                description: result.rows[0].description
            }
        };

        // Send detailed invoice object back to the client
        res.json({ invoice });
    } catch (err) {
        // Handle errors 
        return next(err);
    }
});

// POST a new invoice - Add an invoice to the database
router.post('/', async (req, res, next) => {
    try {
        const { comp_code, amt } = req.body;
        const result = await pool.query(
            'INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING id, comp_code, amt, paid, add_date, paid_date', 
            [comp_code, amt]
        );
        res.status(201).json({ invoice: result.rows[0] }); // Set status to 201 Created and sends new invoice details back to the client
    } catch (err) {
        return next(err);
    }
});

// PUT to update an existing invoice - Modify details of an invoice
router.put('/:id', async (req, res, next) => {
    try {
        // Extract invoice ID from the request params and new amount and paid status from the request body
        const { id } = req.params;
        const { amt, paid } = req.body;
        
        // Fetch the current invoice details
        const fetchResult = await pool.query(
            'SELECT * FROM invoices WHERE id = $1', 
            [id]
        );

        // If no invoice is found, return a 404
        if (fetchResult.rows.length === 0) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        // Get the current paid status and paid date
        const currentPaid = fetchResult.rows[0].paid;
        const currentPaidDate = fetchResult.rows[0].paid_date;

        // Set the new paid status and paid date based on the request body
        let newPaidDate = currentPaidDate;
        if (paid && !currentPaid) {
            newPaidDate = new Date().toISOString().split('T')[0]; // Set to today's date if paying an unpaid invoice
        } else if (!paid && currentPaid) {
            newPaidDate = null; // Set to null if un-paying an invoice
        }

        // Update the invoice in the database with the new amount and paid status
        const updateResult = await pool.query(
            'UPDATE invoices SET amt = $1, paid = $2, paid_date = $3 WHERE id = $4 RETURNING id, comp_code, amt, paid, add_date, paid_date', 
            [amt, paid, newPaidDate, id]
        );

        // Send updated invoice details back to the client
        res.json({ invoice: updateResult.rows[0] });
    } catch (err) {
        // Handle errors
        return next(err);
    }
});


// DELETE an invoice - Remove an invoice from the database
router.delete('/:id', async (req, res, next) => {
    try {
        // Extract invoice ID from the request parameters
        const { id } = req.params;
        // Delete specified invoice from the database and return the ID of the deleted invoice
        const result = await pool.query('DELETE FROM invoices WHERE id = $1 RETURNING id', [id]);

        // If no invoice found, return a 404
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        // Confirm deletion 
        res.json({ status: 'deleted' });
    } catch (err) {
        // Handle errors
        return next(err);
    }
});

// Export the router to be used by app.js
module.exports = router;
