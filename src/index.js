const express = require("express")
const { v4: uuidv4 } = require ('uuid')

const app = express()

app.use(express.json())

const customers = []

function veryfyIfExistsAccountCpf(req, res, next) {
  const { cpf } = req.headers;

  const customer = customers.find(customer => customer.cpf === cpf);
  

  if (!customer) {
    return res.status(400).json({ message: 'customer not found!' })
  }

  req.customer = customer;

  next()
}

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if (operation.type ==='credit') {
      return acc + operation.amount;
    } else {
      return acc - operation.amount;
    }
  }, 0)

  return balance

}


app.post('/account', (req, res) => {
  const { cpf, name } = req.body

  const customerAlireadyExists = customers.some(
    customer => customer.cpf ===cpf
  )

  if (customerAlireadyExists){
    return res.status(400).json({
      message: "customer aleardy exist"
    })
  }


  customers.push({
    cpf,
    name,
    id: uuidv4(),
    statement: []
  })  
  

  return res.status(201).json({
    result: "sucess",
    message: "customer created sucesss!"
  })
  
})

app.get('/account', veryfyIfExistsAccountCpf, (req, res) => {
  const  { customer } = req;

  return res.json({
    message: "Success",
    customer
  })
})

app.patch('/account', veryfyIfExistsAccountCpf, (req, res) =>{
  const { customer } = req;
  const { name } = req.body;

  customer.name = name;

  return res.json({ message: 'Account updte!' })
  
})

app.delete('/account', veryfyIfExistsAccountCpf, (req, res) => {
  const { customer } = req;

  customers.splice(customer, 1);

  return res.json({
    message: 'Account deleted!',
    customers
  })
})

app.get('/statement', veryfyIfExistsAccountCpf, (req, res) => {
  const { customer } = req

  return res.json({
    message: 'Sucess',
    statement: customer.statement
  })
})

app.get('/statement/date', veryfyIfExistsAccountCpf, (req, res) => {
  const { customer } = req;
  const { date } = req.query;

  const dateFormat = new Date(date + " 00:00");
  const statement = customer.statement.filter(
    (statement) => statement.created_at.toDateString() === new Date(dateFormat).toDateString()
  )
  return res.json(statement);
})

app.post("/deposit", veryfyIfExistsAccountCpf, (req, res) => {
  const { customer } = req;

  const { amount, description } = req.body;

  const statementOperation = {
    amount,
    description,
    created_at: new Date(),
    type: 'credit'
  }

  customer.statement.push(statementOperation);

  return res.status(201).json({ message: "Successfully deposited!"})
})

app.post('/withdraw', veryfyIfExistsAccountCpf, (req, res)=> {
  const { customer } = req;
  const { amount } = req.body

  const balance = getBalance(customer.statement);

  if (balance < amount) {
    return res.status(400).json({ message: 'Insufficient funds!' });
  }

  const statementOperation = {
    amount,
    created_at: new Date(),
    type: 'debit'
  }

  customer.statement.push(statementOperation);

  return res.status(201).json({ message: 'Successfully withdraw!' });
})

app.get('/balance', veryfyIfExistsAccountCpf, (req, res) =>{
  const { customer } = req;

  const balance = getBalance(customer.statement);
  return res.json({message: 'Sucess!', balance});

})

app.listen(3333)

