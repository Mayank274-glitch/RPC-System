const amqp = require('amqplib');//Used for rabbitmq
const EventEmitter = require('events');// What is eventEmitter? -https://www.freecodecamp.org/news/how-to-code-your-own-event-emitter-in-node-js-a-step-by-step-guide-e13b7e7908e1/#:~:text=The%20EventEmitter%20is%20a%20module,including%20prominent%20frameworks%20like%20Express. 
const uuid = require('uuid');//Used for generating UUID
const express = require('express')// Used express framework 
const app = express()// Default app object

//For using this proj we only need to set two variables, RABBITMQ and q.
const RABBITMQ = 'amqp://localhost';//set this according to environment 

// pseudo-queue for direct reply-to
const REPLY_QUEUE = 'amq.rabbitmq.reply-to';
//What is direct reply-to and why i used it? - https://www.rabbitmq.com/direct-reply-to.html

// Why i used "direct reply-to" = The client declares a single-use queue for each request-response pair in normal RPC.Means Creating and deleting
// each time for a request, But this is inefficient; 
// So rabbit mq has a feature named "direct reply-to" direct reply-to feature
// allows RPC clients to receive replies directly from their RPC server, without going through a reply queue.

const q = 'rpc_queue'; //set this according to server side queue name. ex - DemoQueue 
//Keep in mind we need to create this queue on server side and it should be running for using this proj.


//Why EventEmitter is used? Ans(my view)- So it is used to resolve a problem where any request is not able to wait for response came from server.
// So we genrated event whenever a response message came from server and listen it.

//No need to change this function use as it is.
const createClient = rabbitmqconn =>
  amqp
    .connect(rabbitmqconn)
    .then(conn => conn.createChannel())
    .then(channel => {
      channel.responseEmitter = new EventEmitter();// Created EventEmitter object.     
      channel.responseEmitter.setMaxListeners(0);// 0 meanse infinite check - https://nodejs.org/api/events.html#emittersetmaxlistenersn
      channel.consume(//This method asks the server to start a "consumer".
        REPLY_QUEUE,
        msg => {
          channel.responseEmitter.emit(// Emit means Calling to listner
            msg.properties.correlationId,
            msg.content.toString('utf8'),
          );// Emit will be called whenever message arrived.
        },
        { noAck: true },
      );
      return channel;
    });

//No need to change this function use as it is.
const sendRPCMessage = (channel, message, rpcQueue) =>
  new Promise(resolve => {
    const correlationId = uuid.v4();
    channel.responseEmitter.once(correlationId, resolve);// Emit resolved here
    channel.sendToQueue(rpcQueue, Buffer.from(message), {
      correlationId,
      replyTo: REPLY_QUEUE,
    });
  });

//No need to change this function use as it is.
const init = async (fileName) => {
  var responseforhtml = ''; 
  const channel = await createClient(RABBITMQ);//Initializing Client and consume func.
  const message = fileName;// In working scenerio we can send any thing to server in this message variable.(Ex - Json/text/Html)

  console.log(`[ ${new Date()} ] Message sent: ${JSON.stringify(message)}`);

  const response = await sendRPCMessage(channel,message, q);//sending message.
  // We will only get data in response variable once promise is resolved. Or in other words when over event listner is called and that is resolving promise

  console.log(`[ ${new Date()} ] Message received: ${response} and file name = ${fileName}`);// Response came from server i just logged it but we can use it.

  responseforhtml = response;

  console.log(`Response from queue is ${responseforhtml} and file name = ${fileName}`);

  return responseforhtml;
  //process.exit(); 
};

//We can call init() without http req like this.(just add code for calling async function init())
// try {
//   init();
// } catch (e) {
//   console.log(e);
// }

// In working scenerio we can use any type of http req(Get/Post/Put/Patch), and copy parameter in massage varibale of init() function.
app.get('/a',async(req, res) =>{
  res.send(await init("a"))
})

app.get('/b',async(req, res) =>{
  res.send(await init("b"))
})
app.get('/c',async(req, res) =>{
  res.send(await init("c"))
})
app.get('/d',async(req, res) =>{
  res.send(await init("d"))
})

  
  app.listen(3000,() => console.log('Listening on port 3000'))
