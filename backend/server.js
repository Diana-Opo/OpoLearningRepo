require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: true }));
app.use(express.json());

// Routes
app.use('/api/health', require('./routes/health'));
app.use('/api/auth',   require('./routes/auth'));
app.use('/api/users',  require('./routes/users'));
app.use('/api/agents',          require('./routes/agents'));
app.use('/api/platform_issues', require('./routes/platformIssues'));
app.use('/api/tickets',         require('./routes/tickets'));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
