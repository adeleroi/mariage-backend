
// using Twilio SendGrid's v3 Node.js Library
// https://github.com/sendgrid/sendgrid-nodejs
// javascript
const dotenv = require('dotenv')
dotenv.config()
const sgMail = require('@sendgrid/mail')
const express = require('express')
const bodyParser = require('body-parser')
const stripe = require('stripe')(process.env.STRIPE_API_KEY)
const greeting = require('./greeting')
const { v4: uuidv4 } = require('uuid');

const app = express()

app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true }))

const PORT = 5000 || process.env.PORT
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

//////////////////////////////////////////////////// ***  SENDING EMAIL *** \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

app.post('/send-receipt-to-guest', (req, res) => {
  const senderEmail = 'ade.nguessan@outlook.fr'
  const { username, email, body } = req.body
  const msg = {
    to: email,
    from: senderEmail,
    subject: "Confirmation d'invitation",
    text: body,
    html: `
      <h2 style="margin-bottom:12px">${greeting()} ${username}<h3>
      <p style="margin-bottom:40px; font-size:500">Merci d'avoir confirmé votre présence à la cérémonie de mariage de Ruth et Dimitri<p>
      <strong>Ruth</strong>
      <img src="" alt="R&D_image style="margin-top:10px" width="100px" height="100px"/>
    `,
  }
  sgMail.send(msg).then(() => {
    res.status(200)
    res.send({ receipt:`Accusé de reception envoyé a ${username}`, username, email })
  }).catch((error) => {
    res.status(500)
    res.send({ error })
  })
})

app.post('/send-guest-msg', (req, res) => {
  console.log('req', req.body)
  const senderEmail = 'ade.nguessan@outlook.fr'
  const { username, body } = req.body
  const msg = {
    to: 'wilfriednguess@gmail.com',
    from: senderEmail,
    subject: "Confirmation d'invitation",
    text: 'bonjourno ruith',
    html: `
      <h2 style="margin-bottom:12px">${greeting()} Ruth<h3>
      <p style="margin-bottom:40px">L'invité ${username} a confirmé sa présence à la cérémonie de mariage.<p>
      <strong>Message:</strong>
      <p>${body}</p>
    `,
  }
  sgMail.send(msg).then(() => {
    res.status(200)
    res.send({ msgToRuth:'Confirmation envoyé a Ruth' })
  }).catch((error) => {
    res.status(500)
    res.send({ error })
  })
})


///////////////////////////////////////////////////////// *** CHECKOUT SECTION *** \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

app.get('/create-checkout-session', async (req, res) => {
  const domainURL = process.env.DOMAIN;

  const { quantity } = req.body;

  const pmTypes = (process.env.PAYMENT_METHOD_TYPES || 'card').split(',').map((m) => m.trim());
  const session = await stripe.checkout.sessions.create({
    payment_method_types: pmTypes,
    mode: 'payment',
    line_items: [
      {
        price: process.env.PRICE,
        quantity: 1,

      },
    ],
    success_url: `${domainURL}/success.html?session_id=${uuidv4()}`,
    cancel_url: `${domainURL}/canceled.html`,
  });

  return res.redirect(303, session.url);
});


////////////////////////////////////////////////////////// PAIEMENT INTENT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

app.post('/create-payment-intent', async (req, res) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 300,
      currency: 'cad',
    })
    res.json({ clientSecret: paymentIntent.client_secret})
  } catch (e) {
    res.status(400).json({ error: { message: e.message }})
  }
})




app.listen(PORT, console.log('listening to port', PORT))
