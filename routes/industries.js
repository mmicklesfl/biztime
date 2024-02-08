const express = require('express');
const slugify = require('slugify'); 
const router = express.Router(); 
const db = require('../db'); // Import the database pool connection

// Route to add an industry with POST request
router.post('/', async (req, res, next) => {
    try {
        const { industry } = req.body; // Extract the industry name from the request body
        const code = slugify(industry, { lower: true, strict: true }); // Generate slugified code from industry name
        // Insert new industry into db and return inserted data
        const result = await db.query(
            'INSERT INTO industries (code, industry) VALUES ($1, $2) RETURNING code, industry',
            [code, industry]
        );
        return res.status(201).json({ industry: result.rows[0] }); // Respond with newly created industry
    } catch (err) {
        return next(err); 
    }
});

// Route to list all industries with their associated company codes
router.get('/', async (req, res, next) => {
    try {
        // Query to select all industries and aggregate associated company codes
        const results = await db.query(
            'SELECT i.industry, ARRAY_AGG(ci.company_code) AS companies FROM industries i LEFT JOIN company_industries ci ON i.code = ci.industry_code GROUP BY i.industry'
        );
        return res.json({ industries: results.rows }); // Respond with list of industries and their companies
    } catch (err) {
        return next(err); 
    }
});

// Route to associate an industry with a company using POST request
router.post('/associate', async (req, res, next) => {
    try {
        const { companyCode, industryCode } = req.body; // Extract company and industry codes from request body
        // Insert association into the db and return inserted data
        const result = await db.query(
            'INSERT INTO company_industries (company_code, industry_code) VALUES ($1, $2) RETURNING company_code, industry_code',
            [companyCode, industryCode]
        );
        return res.status(201).json({ association: result.rows[0] }); // Respond with newly created association
    } catch (err) {
        return next(err); 
    }
});

module.exports = router; 