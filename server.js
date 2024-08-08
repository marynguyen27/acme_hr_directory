const express = require('express');
const app = express();
const pg = require('pg');
const client = new pg.Client(
  process.env.DATABASE_URL ||
    'postgres://postgres:12345678@localhost:5432/acme_hr_directory'
);
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(require('morgan')('dev'));

app.get('/api/employees', async (req, res, next) => {
  try {
    const SQL = `
      SELECT * from employees
    `;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (ex) {
    next(ex);
  }
});

app.get('/api/departments', async (req, res, next) => {
  try {
    const SQL = `
      SELECT * FROM departments;
    `;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (ex) {
    next(ex);
  }
});

app.post('/api/employees', async (req, res, next) => {
  try {
    const { name, department_id } = req.body;
    const SQL = `INSERT INTO employees(name, department_id) VALUES($1, $2) RETURNING *;`;
    const response = await client.query(SQL, [name, department_id]);
    res.send(response.rows[0]);
  } catch (ex) {
    next(ex);
  }
});

app.put('/api/employees/:id', async (req, res, next) => {
  try {
    const { name, department_id } = req.body;
    const { id } = req.params;
    const SQL = `UPDATE employees SET name = $1, department_id = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *;`;
    const response = await client.query(SQL, [name, department_id, id]);
    res.send(response.rows[0]);
  } catch (ex) {
    next(ex);
  }
});

app.delete('/api/employees/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const SQL = `DELETE FROM employees WHERE id = $1;`;
    await client.query(SQL, [id]);
    res.sendStatus(204);
  } catch (ex) {
    next(ex);
  }
});

const init = async () => {
  try {
    await client.connect();
    const SQL = `
    DROP TABLE IF EXISTS employees;
    DROP TABLE IF EXISTS departments;
    CREATE TABLE departments (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100)
    );
      CREATE TABLE employees (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        department_id INTEGER REFERENCES departments(id)
      );

      INSERT INTO departments(name) VALUES('HR'), ('Engineering'), ('Sales');
      INSERT INTO employees(name, department_id) VALUES('Apple Appleton', 1), ('Blue Berry', 2), ('Grape Fruit', 3);
    `;
    await client.query(SQL);
    console.log('Database tables created and seeded.');

    app.listen(port, () => console.log(`Server listening on port ${port}`));
  } catch (error) {
    console.error(
      'Error initializing the database or starting the server:',
      error
    );
  }
};

init();
