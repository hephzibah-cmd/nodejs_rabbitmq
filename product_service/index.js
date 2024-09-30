require('dotenv').config(); // Load environment variables

const express = require('express');
const amqp = require('amqplib/callback_api');
const app = express();

app.use(express.json());

let channel;

// Connect to RabbitMQ 
amqp.connect(process.env.RABBITMQ_URL, (err, conn) => {
  if (err) throw err;
  conn.createChannel((err, ch) => {
    if (err) throw err;
    channel = ch;

    channel.assertQueue('product_queue', { durable: false });
  });
});

// Product endpoint
app.post('/product', (req, res) => {
  const product = req.body;

  // Publish product creation event to RabbitMQ
  channel.sendToQueue('product_queue', Buffer.from(JSON.stringify(product)));
  res.status(201).send(`Product created: ${product.name}`);
});

// Use port from environment variable
app.listen(process.env.PRODUCT_SERVICE_PORT, () => {
  console.log(`Product service running on port ${process.env.PRODUCT_SERVICE_PORT}`);
});