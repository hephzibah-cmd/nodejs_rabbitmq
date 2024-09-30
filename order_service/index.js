require('dotenv').config();

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

    // Consume product creation events
    channel.consume('product_queue', (msg) => {
      const product = JSON.parse(msg.content.toString());
      console.log(`Received product: ${product.name}`);
      // Handle product logic (e.g., create order)
    }, { noAck: true });
  });
});

// Order endpoint
app.post('/order', (req, res) => {
  const order = req.body;

  // Publish order event to RabbitMQ
  channel.sendToQueue('order_queue', Buffer.from(JSON.stringify(order)));
  res.status(201).send(`Order created for product: ${order.product}`);
});

// Use port from environment variable
app.listen(process.env.ORDER_SERVICE_PORT, () => {
  console.log(`Order service running on port ${process.env.ORDER_SERVICE_PORT}`);
});