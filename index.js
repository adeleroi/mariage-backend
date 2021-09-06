
// using Twilio SendGrid's v3 Node.js Library
// https://github.com/sendgrid/sendgrid-nodejs
// javascript
const dotenv = require('dotenv')
dotenv.config()
const sgMail = require('@sendgrid/mail')
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const stripe = require('stripe')(process.env.STRIPE_API_KEY)
const { v4: uuidv4 } = require('uuid');

const app = express()
app.use(cors())

app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true }))

const PORT = 4242 || process.env.PORT
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

function greeting() {
  const date = new Date()  
  return ( 
    date.getHours() > 12 ? 'Bonsoir':
    date.getHours() == 12 && date.getMinutes() > 0 ? 'Bonsoir':
    'Bonjour'
  )
}

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

app.post('/send-email-to-guest', async (req, res) => {
  const { email, username } = req.body;
  const msg = {
    to: [email, 'ruthtisam@yahoo.fr'],
    from: 'ade.nguessan@outlook.fr',
    subject: "Confirmation d'invitation",
    text: 'Accuse de reception',
    html: `
    <br/>
    <h2 style="margin-bottom:12px; margin-top: 5px; font-size:12px; font-weight: normal;">${greeting()} ${username},<h2>
    <p style="margin-bottom:4px; font-size:12px; font-weight: normal;">Merci d'avoir confirmé votre présence à la cérémonie de mariage de Ruth et Dimitri.<p>
    `,
  }
  try {
    await sgMail.send(msg)
    res.status(200).send({sendToGuest: true})
  } catch(e) {
    res.status(500).send({sendToGuest: false})
  }
});

app.post('/send-email-to-bride', async (req, res) => {
  const { email, username, message } = req.body;
  const msg = {
    to: ['ruthtisam@yahoo.fr'],
    from: 'ade.nguessan@outlook.fr',
    subject: "Confirmation d'invitation",
    text: 'Accuse de reception',
    html: `
    <img src="" style="margin-bottom:5px"/>
    <br/>
    <h2 style="margin-bottom:12px; margin-top: 5px; font-size:12px; font-weight: normal;">${greeting()} Les maries,<h2>
    <p style="margin-bottom:4px; font-size:12px; font-weight: normal;">${username} a confirmé sa presence à votre mariage.<p>
    
    <h4>Message:</h4>
    <p>${message}</p>
    `,
  }
  
  try {
    await sgMail.send(msg)
    res.status(200).send({sendToBride: true})
  } catch(e) {
    res.status(500).send({sendToBride: false})
  }
});

app.listen(PORT, () =>
  console.log(`Node server listening to ${PORT}`)
);

if(process.env.NODE_ENV ===  'production'){
  app.use(express.static(__dirname + '/public/'));
  app.get(/.*/, (req, res) => {
    res.sendFile(__dirname + '/public/index.html')
  });
}