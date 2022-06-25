using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RpcServer
{
    internal class rpcConsumer
    {
        public IModel _channel;
        public IConnection _connection;
        public event EventHandler<string> MessageReceived;

        public void Connect()
        {
            var factory = new ConnectionFactory() { HostName = "localhost" };

            string replyQueueName = "rpc_queue";

            string path = "D:\\Freelance_Work\\Rpc_Server\\RpcServer\\RpcServer\\";


            _connection = factory.CreateConnection();

            _channel = _connection.CreateModel();


            _channel.QueueDeclare(queue: replyQueueName,
                                        durable: false,
                                         exclusive: false,
                                         autoDelete: false//this should be false because we are giving TTL on queue
                                         );//passing arguments here


            var consumer = new EventingBasicConsumer(_channel);

            _channel.BasicConsume(queue: replyQueueName,
              autoAck: false, consumer: consumer);

            Console.WriteLine(" Awaiting RPC requests");

            consumer.Received += (model, ea) =>
            {
                string response = null;

                var body = ea.Body.ToArray();
                var props = ea.BasicProperties;
                var replyProps = _channel.CreateBasicProperties();
                replyProps.CorrelationId = props.CorrelationId;

                try
                {
                    var message = Encoding.UTF8.GetString(body);
                    Console.WriteLine("Message recieved");
                    response = System.IO.File.ReadAllText(path + message + ".txt");
                }
                catch (Exception e)
                {
                    Console.WriteLine(" [.] " + e.Message);
                    response = "";
                }
                finally
                {
                    var responseBytes = Encoding.UTF8.GetBytes(response);
                    _channel.BasicPublish(exchange: "", routingKey: props.ReplyTo,
                      basicProperties: replyProps, body: responseBytes);
                    _channel.BasicAck(deliveryTag: ea.DeliveryTag,
                      multiple: false);
                }
            };

            Console.WriteLine(" Press [enter] to exit.");
            Console.ReadLine();
        }
    }
}
