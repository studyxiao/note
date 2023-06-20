---
title: websocket
---
## Websocket

HTTP 是请求-响应模型，只能客户端请求后，服务端返回响应数据。所以又开发出新的协议 websocket，他是建立在TCP上的双工通信协议，地位与 HTTP 一样属于应用层协议，但他用到了HTTP的连接方式（先HTTP方式连接，再升级到websocket连接）。主要是为了复用端口80和443，但有自己的协议名 ws和wss。

> websocket 不同于 socket，socket是一组方便使用TCP的工具，而websocket是一个协议，要想使用，还得自己实现接口。
> 为什么不直接使用TCP，因为浏览器的限制，不能直接使用TCP，就又包装类一层。

websocket 是基于流，也就是数据使用的二进制帧。头部定义还有点复杂。

## 有什么

二进制数据流，数据一般是简单str或json的字符串。

### 消息格式

```sh
      0               1               2               3
      0 1 2 3 4 5 6 7 0 1 2 3 4 5 6 7 0 1 2 3 4 5 6 7 0 1 2 3 4 5 6 7
     +-+-+-+-+-------+-+-------------+-------------------------------+
     |F|R|R|R| opcode|M| Payload len |    Extended payload length    |
     |I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
     |N|V|V|V|       |S|             |   (if payload len==126/127)   |
     | |1|2|3|       |K|             |                               |
     +-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - - +
     |     Extended payload length continued, if payload len == 127  |
     + - - - - - - - - - - - - - - - +-------------------------------+
     |                               |Masking-key, if MASK set to 1  |
     +-------------------------------+-------------------------------+
     | Masking-key (continued)       |          Payload Data         |
     +-------------------------------- - - - - - - - - - - - - - - - +
     :                     Payload Data continued ...                :
     + - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
     |                     Payload Data continued ...                |
     +---------------------------------------------------------------+
```

- FIN 表示结束，后面的三个 RSV 是保留位，必须是0
- OPCODE 操作码（帧类型）
  - 1 表示纯文本
  - 2 二进制
  - 8 关闭连接
  - 9 保活的 PING
  - 10 保活的 PONE

- MASK 帧内容是否加密（xor 异或加密）
  - 客户端发送数据必须加密
  - 服务端不加密

- Payload len（7）表示有效负载（长度），只有7位只能表示不超过127位，所以有新规定
  - 等于127，那么长度使用后面的8个字节（data[2:10]）来表示真正的长度
  - 等于126，由后面的2个字节（data[2:4]）表示
  - 小于126，就是你（data[1] & 127）

- Masking-key 如果 MASK 为1 是一个4字节的随机数，为0不存在（但位置还在）
- Payload Data 剩下的都是有效负载

```json
{
  "event": "connected",
  "data": {}
}
```

- `event`：事件类型
  - connected 有连接进入
  - message 传递消息
  - closed 有连接断开

### 常用方法（client）

属性

onopen 连接时

onclose 关闭时

onerror 发生错误

onmessage 发送消息

readyState 当前状态

方法

close() 主动关闭

send(data) 发送消息

### URI

复用 80 443 使用 ws wss 协议。

```
ws-URI = "ws:" "//" host [ ":" port ] path [ "?" query ]
wss-URI = "wss:" "//" host [ ":" port ] path [ "?" query ]
```

### 握手

使用 http 作为握手，请求头使用

- Connection: Upgrade，表示要求协议升级；
- Upgrade: websocket，表示要升级成 WebSocket 协议；
- Sec-WebSocket-Key：一个 Base64 编码的 16 字节随机数，作为简单的认证密钥；
- Sec-WebSocket-Version：协议的版本号，当前必须是 13

成功的话返回

- Connection: Upgrade，表示同意协议升级；
- Upgrade: websocket，表示同意升级成 WebSocket 协议；
- Sec-WebSocket-Accept 用于验证客户端请求报文，

## 使用

websocket 不像现有的 flask 框架，已经基于标准构建了便捷api，websocket虽也有websockets这样的类库，但还是偏底层，需要我们重点实现一些功能。

### 鉴权

两种形式，一般采取第二种

- `/path?token=xxx` 可在 uri 中添加token在 http 握手阶段进行验证，如果鉴权失败，还可以设置 401/403 状态码，但对于安全而言在uri中有暴露token风险（一般会将uri放入日志中）。
- `{"event": "token", "data": "xxx"}` 在首次进入 websocket 时通过传入的有效负载鉴权。相对来说安全，但不能修改 header 了（不是 http 协议了）。

main.py

```python
import asyncio
import json
import logging
import signal
from typing import Any, TypeVar

import websockets
from pydantic import BaseModel
from websockets.server import WebSocketServerProtocol, serve

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

R = TypeVar("R", bound=BaseModel)


class Event(BaseModel):
    """强制使用该结构传递数据"""

    type: str
    data: str | dict[str, Any]


class TokenEvent(Event):
    type: str = "token"
    data: str


USERS = {"123": "xiao"}


def get_user(token: str):
    """Find user authenticated by token or return None."""
    return USERS.get(token)


async def parse_event(websocket: WebSocketServerProtocol, model: type[R]) -> R | None:
    data = await websocket.recv()
    try:
        return model.parse_raw(data)
    except Exception as e:
        logging.error(e)
        await websocket.send(json.dumps({"type": "error", "data": "parameter error"}))


async def handler(websocket: WebSocketServerProtocol) -> None:
    data = await parse_event(websocket, TokenEvent)
    if data is None or data.type != "token":
        # 首次进入必须传递 token
        return
    # 判断 user
    user = get_user(data.data)
    if user is None:
        await websocket.close(1011, "authentication failed")
        return
    print(user)
    async for message in websocket:
        # 之后不再验证 token
        try:
            data = Event.parse_raw(message)
        except Exception as e:
            logging.error(e)
            # 客户端需要处理错误后续操作，关闭连接还是重试
            await websocket.send(json.dumps({"type": "error", "data": "参数错误"}))


async def main(port: int = 8765) -> None:
    # set the stop condition when receiving SIGINT or SIGTERM.
    loop = asyncio.get_running_loop()
    stop = loop.create_future()
    loop.add_signal_handler(signal.SIGINT, stop.set_result, None)
    loop.add_signal_handler(signal.SIGTERM, stop.set_result, None)

    async with serve(handler, "localhost", port):
        logging.info(f"Running server on port {port}")
        await stop
        logging.info("exit")


if __name__ == "__main__":
    asyncio.run(main())
```

### 心跳机制

websockets 库自带[Timeouts - websockets](https://websockets.readthedocs.io/en/stable/topics/timeouts.html)

```python
async with serve(
    handler,
    "localhost",
    port,
    ping_interval=20,  # 20 秒 ping 一次， None 禁用
    ping_timeout=20,  # 20 秒内没有收到 pong，关闭连接(1011)
)
```

如果判断已断开连接，websockets 会终止连接并尝试向你的 client 报 ConnectionClosed 异常。

客户端（浏览器）要在应用层处理这种心跳操作，以确保 keepalive。

### 断线重连

服务端不进行短线重连，会造成拥堵，所有连接应该从客户端发起，所以应在客户端设置短线重连

```js
ws.onClose(() => {
  // 最大重连次数
  if (retryCount > maxCount)
    return

  retryCount++

  setTimeout(() => {
    ws.connect()
  }, retryCount * 1000 + Math.random() * 1000)
})
```

### 离线消息和历史消息(消息补发)

如果消息要永久保存，还需要将信息存储到数据库，当用户再次连线后发送 http 请求即可。

*跟websocket关系不大，但可看作一部分，实质只是打开网页或重新连接时查询数据库。*

### 客户端在线列表,上下线提醒

在进入时将 websocket 添加到全局变量或 redis，退出后删除。

```python
CLIENTS = set()

async def handler(websocket: WebSocketServerProtocol) -> None:
    # 加入客户端列表
    CLIENTS.add(websocket)
    # 向所有客户端发送消息
    websockets.broadcast(CLIENTS, f"clients num: {len(CLIENTS)}")
    try:
        async for message in websocket:
            print(message)
    finally:
        CLIENTS.remove(websocket)
        # 向所有客户端再次发送消息
   	    websockets.broadcast(CLIENTS, f"clients num: {len(CLIENTS)}")
```

### 群发和专发（room）信息

[Broadcasting messages - websockets 11.0.3 documentation --- 广播消息 - websockets 11.0.3 文档](https://websockets.readthedocs.io/en/stable/topics/broadcast.html)

### 数据压缩

websockets 默认开启 Deflate 算法压缩 [Compression](https://websockets.readthedocs.io/en/stable/topics/compression.html)

```python
websockets.serve(
    ...,
    compression=None,  # None 禁用
)

# 自定义压缩设置
from websockets.extensions import permessage_deflate
websockets.serve(
    ...,
    extensions=[
        permessage_deflate.ServerPerMessageDeflateFactory(
            server_max_window_bits=12,  # 9-15之间
            client_max_window_bits=12,
            compress_settings={"memLevel": 5},
        ),
    ],
)
```

### TLS

使用 Nginx 代理

```python
async with websockets.unix_serve(
    echo,
    path="websocket.sock",
):
    await stop
```

nginx

```nginx
http {
    upstream websocket {
        server unix:websocket.sock;
    }

    server {
        listen localhost:8080;

        location /ws {
            proxy_http_version 1.1;
            proxy_pass http://websocket;
            proxy_set_header Connection $http_connection;
            proxy_set_header Upgrade $http_upgrade;
        }
    }
}
```

## 参考

慕课网 大前端

[详解 WebSocket](https://mp.weixin.qq.com/s/he6l__TQBJt4_J9uSRx2dw) 使用 python 简单实现 websocket

[搭建websocket消息推送服务，必须要考虑的几个问题](https://mp.weixin.qq.com/s/k6cjBQe9SEw6Vk0MeOz83w)

[Websocket 可以玩出些什么花儿？](https://mp.weixin.qq.com/s/XKjTrMDXlNQ8v8RUQERhUw)

[WebSocket, HTTP/2 and gRPC - SoByte --- WebSocket、HTTP/2 和 gRPC - SoByte](https://www.sobyte.net/post/2022-01/websocket-http2-and-grpc/)
