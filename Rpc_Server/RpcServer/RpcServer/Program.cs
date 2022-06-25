using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RpcServer
{
    internal class Program
    {
        static void Main(string[] args)
        {
            rpcConsumer consumer = new rpcConsumer();
            consumer.Connect();
        }
    }
}
