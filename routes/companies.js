const express = require('express');
const router = express.Router(); 

// PostgreSQL pool for database connection as suggested by mentor Sean
const pool = require('../db');

// Route to get a list of all companies
router.get('/', async (req, res) => {
    try {
        // Execute SQL query to select all companies
        const result = await pool.query('SELECT code, name, description FROM companies');
        // Send list of companies as a response
        res.json({ companies: result.rows });
    } catch (err) {
        // Handle errors
        res.status(500).json({ error: err.message });
    }
});

// Route to get details of a specific company by its code
router.get('/:code', async (req, res) => {
    try {
        const { code } = req.params; // Extract company code from URL parameters
        // Fetch company details from the database
        const compResult = await pool.query('SELECT code, name, description FROM companies WHERE code = $1', [code]);
        
        // If no company found, return a 404
        if (compResult.rows.length === 0) {
            return res.status(404).json({ error: 'Company not found' });
        }

        // Fetch related invoices for company
        const invResult = await pool.query(
            'SELECT id, comp_code, amt, paid, add_date, paid_date FROM invoices WHERE comp_code = $1',
            [code]
        );

        // Construct the company object including nested invoices information
        const company = {
            code: compResult.rows[0].code,
            name: compResult.rows[0].name,
            description: compResult.rows[0].description,
            invoices: invResult.rows.map(inv => ({
                id: inv.id,
                comp_code: inv.comp_code,
                amt: inv.amt,
                paid: inv.paid,
                add_date: inv.add_date,
                paid_date: inv.paid_date
            }))
        };

        // Respond with detailed company information
        res.json({ company });
    } catch (err) {
        // Handle errors
        res.status(500).json({ error: err.message });
    }
});

// Route to add a new company
router.post('/', async (req, res) => {
    try {
        console.log("Request body:", req.body); // Logging request body
        const { code, name, description } = req.body;
        
        const result = await pool.query(
            'INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING *',
            [code, name, description]
        );
        res.status(201).json({ company: result.rows[0] });  // Set status to 201 Created and sends new company details back to the client
    } catch (err) {
        console.error("Error in POST /companies route:", err); // Logging the complete error for debugging purposes
        res.status(500).json({ error: err.message });
    }
});

// Route to update an existing company's details
router.put('/:code', async (req, res) => {
    try {
        const { code } = req.params; // Extract company code from URL parameters
        const { name, description } = req.body; // Extract updated details from request body
        // Update company details in the database
        const result = await pool.query('UPDATE companies SET name = $1, description = $2 WHERE code = $3 RETURNING *', [name, description, code]);

        // If no company found, return a 404
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Company not found' });
        }

        // Respond with updated company details
        res.json({ company: result.rows[0] });
    } catch (err) {
        // Handle errors
        res.status(500).json({ error: err.message });
    }
});

// Route to delete a company
router.delete('/:code', async (req, res) => {
    try {
        const { code } = req.params; // Extract company code from URL parameters
        // Delete specified company from the database
        const result = await pool.query('DELETE FROM companies WHERE code = $1 RETURNING *', [code]);

        // If no company found, return a 404
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Company not found' });
        }

        // Confirm deletion to the client
        res.json({ status: 'deleted' });
    } catch (err) {
        // Handle errors
        res.status(500).json({ error: err.message });
    }
});

// Export the router to be used by app.js
module.exports = router; 
