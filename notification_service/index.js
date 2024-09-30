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

    channel.assertQueue('order_queue', { durable: false });

    // Consume order events
    channel.consume('order_queue', (msg) => {
      const order = JSON.parse(msg.content.toString());
      console.log(`Notification: Order placed for product ${order.product}`);
      // Handle notification logic (e.g., send email)
    }, { noAck: true });
  });
});

app.listen(process.env.NOTIFICATION_SERVICE_PORT, () => {
  console.log(`Notification service running on port ${process.env.NOTIFICATION_SERVICE_PORT}`);
});