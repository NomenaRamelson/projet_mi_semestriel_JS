const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Session pour gérer les utilisateurs connectés
app.use(session({
    secret: 'pfm_secret_key_2026',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// Connexion à MariaDB
const db = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'pfm_user',
    password: 'pfm_password_2026',
    database: 'pfm_db'
});

// Tester la connexion
db.connect((err) => {
    if (err) {
        console.error('Erreur de connexion à MariaDB:', err.message);
        console.log('\nSolutions:');
        console.log('1. Verifiez que MariaDB/MySQL est demarre');
        console.log('2. Creez la base de donnees avec le script SQL fourni');
        console.log('3. Verifiez les identifiants dans server.js\n');
        process.exit(1);
    }
    console.log('Connecte a MariaDB avec succes!');
});

// ============ ROUTES D'AUTHENTIFICATION ============

// Route de login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Veuillez fournir nom utilisateur et mot de passe' });
    }
    
    const query = 'SELECT id, username, email, password_hash FROM users WHERE username = ?';
    
    db.query(query, [username], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Erreur serveur' });
        }
        
        if (results.length === 0) {
            return res.status(401).json({ success: false, message: 'Nom utilisateur ou mot de passe incorrect' });
        }
        
        const user = results[0];
        
        if (password === user.password_hash) {
            req.session.userId = user.id;
            req.session.username = user.username;
            
            res.json({
                success: true,
                message: 'Connexion reussie',
                user: { id: user.id, username: user.username, email: user.email }
            });
        } else {
            res.status(401).json({ success: false, message: 'Nom utilisateur ou mot de passe incorrect' });
        }
    });
});

// Route de logout
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Erreur lors de la deconnexion' });
        }
        res.json({ success: true, message: 'Deconnecte avec succes' });
    });
});

// Route pour vérifier si l'utilisateur est connecté
app.get('/api/check-auth', (req, res) => {
    if (req.session.userId) {
        res.json({ authenticated: true, userId: req.session.userId, username: req.session.username });
    } else {
        res.json({ authenticated: false });
    }
});

// Middleware pour vérifier l'authentification
function requireAuth(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Non authentifie' });
    }
    next();
}

// ============ API ROUTES (protégées) ============

// Route 1: Dashboard (KPIs)
app.get('/api/dashboard', requireAuth, (req, res) => {
    const userId = req.session.userId;
    const year = req.query.year || 2026;
    const month = req.query.month || 4;
    
    const startDate = year + '-' + month.toString().padStart(2, '0') + '-01';
    const endDate = year + '-' + month.toString().padStart(2, '0') + '-31';
    
    const query = `
        SELECT 
            SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
            SUM(CASE WHEN type = 'expense' THEN ABS(amount) ELSE 0 END) as total_expense
        FROM transactions 
        WHERE user_id = ? AND transaction_date BETWEEN ? AND ?
    `;
    
    db.query(query, [userId, startDate, endDate], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
        
        const totalIncome = results[0].total_income || 0;
        const totalExpense = results[0].total_expense || 0;
        const netBalance = totalIncome - totalExpense;
        
        db.query('SELECT SUM(current_amount) as total FROM savings_goals WHERE user_id = ?', [userId], (err2, savingsResult) => {
            const totalSavings = savingsResult[0].total || 0;
            
            res.json({
                netBalance: netBalance,
                totalIncome: totalIncome,
                totalExpense: totalExpense,
                totalSavings: totalSavings
            });
        });
    });
});

// Route 2: Transactions récentes
app.get('/api/transactions/recent', requireAuth, (req, res) => {
    const userId = req.session.userId;
    
    const query = `
        SELECT t.*, c.name as category_name
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = ?
        ORDER BY t.transaction_date DESC
        LIMIT 10
    `;
    
    db.query(query, [userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Route 3: Dépenses par catégorie pour le graphique
app.get('/api/expenses/by-category', requireAuth, (req, res) => {
    const userId = req.session.userId;
    const year = req.query.year || 2026;
    const month = req.query.month || 4;
    
    const startDate = year + '-' + month.toString().padStart(2, '0') + '-01';
    const endDate = year + '-' + month.toString().padStart(2, '0') + '-31';
    
    const query = `
        SELECT c.name, c.color, SUM(ABS(t.amount)) as total
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = ? 
            AND t.type = 'expense'
            AND t.transaction_date BETWEEN ? AND ?
        GROUP BY c.id
        ORDER BY total DESC
    `;
    
    db.query(query, [userId, startDate, endDate], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const total = results.reduce((sum, r) => sum + parseFloat(r.total), 0);
        const data = results.map(r => ({
            name: r.name,
            amount: parseFloat(r.total),
            percentage: total > 0 ? ((r.total / total) * 100).toFixed(1) : 0,
            color: r.color
        }));
        
        res.json(data);
    });
});

// Route 4: Objectifs d'épargne
app.get('/api/goals', requireAuth, (req, res) => {
    const userId = req.session.userId;
    
    const query = `
        SELECT * FROM savings_goals 
        WHERE user_id = ? AND status = 'active'
        ORDER BY (current_amount/target_amount) DESC
    `;
    
    db.query(query, [userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Route 5: Dépenses à venir
app.get('/api/upcoming', requireAuth, (req, res) => {
    const userId = req.session.userId;
    const today = new Date();
    const currentDay = today.getDate();
    
    const query = `
        SELECT re.*, c.name as category_name
        FROM recurring_expenses re
        LEFT JOIN categories c ON re.category_id = c.id
        WHERE re.user_id = ? AND re.is_active = 1
        ORDER BY 
            CASE 
                WHEN re.due_day >= ? THEN re.due_day
                ELSE re.due_day + 31
            END
        LIMIT 5
    `;
    
    db.query(query, [userId, currentDay], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const upcoming = results.map(r => ({
            id: r.id,
            name: r.name,
            amount: r.amount,
            due_day: r.due_day,
            daysUntil: r.due_day >= currentDay ? r.due_day - currentDay : r.due_day + 31 - currentDay,
            category_name: r.category_name
        }));
        
        res.json(upcoming);
    });
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log('\nServeur demarre avec succes!');
    console.log('Accedez a l application: http://localhost:' + PORT);
    console.log('Identifiants: Nomena / garfilde\n');
});