Docker 是一种为程序提供隔离环境的容器化技术，以到达“一次封装，到处运行”。

- 文件、资源、网络隔离。
- 变更管理、日志记录
- 写时复制

Docker 可以

- 有效利用系统资源，不需要虚拟硬件及完整的操作系统。
- 更快的启动时间。直接运行在宿主内核，无需启动完整的操作系统。
- 一致的运行环境。不仅提供一致的内核，还有一致的运行时环境。更方便移植和部署。
- 轻松的维护和扩展。使用分层存储和镜像技术，重复部分可复用，基于镜像易于扩展。

**与传统虚拟机的对比**

| 特性       | Docker     | 虚拟机 |
| ---------- | ---------- | ------ |
| 启动       | 秒级       | 分钟级 |
| 硬盘使用   | MB         | GB     |
| 性能       | 接近原生   | 弱     |
| 系统支持量 | 单机上千个 | 十几个 |

## Docker核心概念

三大组件：

- 镜像（Image）：一个操作系统的最小核心文件（如ubuntu root文件系统），可分层文件系统。

- 容器（Container）：一种在运行中（隔离于宿主机的进程）的镜像。

- 仓库（Repository）：盛放镜像的地方，方便不同服务器部署。

![](https://docs.docker.com/engine/images/architecture.svg)

*from offical docs*

### 安装 Docker 和 Docker Compose

[Install Docker Engine on Ubuntu](https://docs.docker.com/engine/install/ubuntu/)

### Docker Image Build（Dockerfile）

[Docker Best Practices for Python Developers](https://testdriven.io/blog/docker-best-practices/)

- Use Multi-stage Builds
- Use Small Docker Image (slim)
- Minimize the Number of Layers
- Cache Python Packages to the Docker Host
- ENTRYPOINT and CMD Use exec Syntax

Web development example:

::: code-group
```dockerfile [Dockerfile] {1}
# syntax=docker/dockerfile:1
#### builder stage
FROM python:3.11.3-slim-bullseye AS builder

RUN --mount=type=cache,target=/var/cache/apt \
    apt-get update && apt-get install -y procps \
    && rm -rf /var/lib/apt/list/*

# install pdm
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install pdm==2.4.5

# install dependencies
COPY pyproject.toml pdm.lock /
RUN mkdir __pypackages__
RUN --mount=type=cache,target=/root/.cache/pdm \
    pdm install --dev --no-lock --no-editable


#### final stage
FROM python:3.11.3-slim-bullseye

# dependencies
ENV PYTHONPATH=/pkgs/lib
ENV PATH="/pkgs/bin:$PATH"
ENV TZ=Asia/Shanghai

COPY --from=builder /__pypackages__/3.11 /pkgs

COPY ./entrypoint /entrypoint
RUN chmod +x /entrypoint

WORKDIR /app

ENTRYPOINT ["/entrypoint"]

```

```sh [Build]
# 构建 image
# . 表示把当前文件夹所有文件作为构建环境（build context）
# 构建环境会发送给docker进行之后的构建操作。
# 可以使用 .dockerignore 排除不需要参加构建的文件。
docker image build -t <tag_name> .

# 查看本段镜像
# -a all 所有镜像，包含历史映像层
# -q quit 只显示镜像id
docker images -a -q

# 查看构建过程
docker history <commit>
```
:::

::: tip
Dockerfile 第一行的注释是使用新语法的标准，启用新语法后可以将 RUN 指令缓存到 Docker 中。
:::

生产中 Dockerfile 还应该：

- 使用非 root 用户
- COPY file
- 非密码
- 设置内存和CPU限制

```dockerfile
# 创建用户和分组, -r 创建系统组，与普通组没有本质区别，useradd 不会创建对应的主目录
# -g 设置主分组， -G 添加额外分组， -u 添加uid
RUN groupadd -r appgroup && \  # 创建系统分组
	useradd -r -u 5678 -g appgroup appuser  && \  # 创建用户并加入分组
	chown -R appgroup:appuser /app  # 设置文件权限
# 切换用户， 之后都是appuser 用户在操作
USER appuser

# 容器启动命令
# ENTRYPOINT 不会覆盖，可以多个
ENTRYPOINT ['命令', '参数']
# CMD 在 docker container run 时可以覆盖，多条 CMD 只会执行最后一个
# CMD ['<命令>', '<参数>']
CMD ["gunicorn", "--worker-tmp-dir", "/dev/shm", "--bind", "0.0.0.0:8000", "wsgi:app"]
# 有时会联合使用 ENTRYPOINT 指定 命令， CMD 指定参数，这样run时可以修改参数。
```

::: details Tip

- FROM 基础镜像尽量选择小的，alpine 是最小的Linux镜像，许多 Image 都有基于它的基础镜像。slim在alpine基础上增加了常用软件，体积也较小。
- RUN 命令尽量占一行，并删除不必要的文件（节省空间）
- COPY 用于拷贝普通文件，ADD用于拷贝压缩文件。
- 只构建尽量使用 ARG，如果后面还需要使用则 ENV
- 多阶段构建多用于先编译的，然后执行分开的构成。
- Gunicorn 20.1.0 使用基于文件的信号检测系统来确保 worker 进程存活，heartbeat files 一般存在 `/tmp` ，由于 docker 不支持 tmpfs 文件系统，可能会导致worker阻塞，可以通过 --worker-tmp-dir 修改 heartbeat directory 为/dev/shm解决。/dev/shm 是Ubuntu中指定的 tmpfs 文件系统。

:::

#### 新语法

启用新语法，比如缓存 RUN COPY

https://www.docker.com/blog/image-rebase-and-improved-remote-cache-support-in-new-buildkit/


```dockerfile {1}
# syntax=docker/dockerfile:1 // [!code focus]
FROM ubuntu:22.04

# install app dependencies
RUN apt-get update && apt-get install -y python3 python3-pip
RUN pip install flask==2.1.*

# install app
COPY hello.py /

# final configuration
ENV FLASK_APP=hello
EXPOSE 8000
CMD flask run --host 0.0.0.0 --port 8000
```

###  Docker Container Run

命令行运行

```sh
# 运行 容器（当前Dockerfile目录）
docker contaienr run --rm -it <容器名>
# --rm 退出时自动删除容器，这样就不会每次运行退出后都产生一个退出状态的容器了，要不还得prune删除
# -it 交互式运行哪个容器

# 进入容器的命令行交互环境下
docker container exec -it <容器名> /bin/sh
```

###  Docker volume 存储

分两种：Data Volume 和 Bind Volume。Data Volume 是 Docker 管理，可以通过 docker volume 来管理，默认存储在`/var/lib/docker/volumes`，Bind Volume 是用户把文件系统的某一位置（通常是当前目录下的data文件夹）绑定到容器某一位置。推荐使用 data volume 会减少管理困难，比如多个项目都使用的权限问题。

```dockerfile
# 在文件中设置容器需要绑定的位置，然后会在系统文件中创建对应的备份，系统自动命名
VOLUME ['/app/data']
# 还可以
VOLUME /app/data

# 在run 时指定 -v，my-data 就是自己命名 volume 名称，对应后面的 /app/data
docker container run --rm -v my-data:/app/data <image_name>

# bind volume 是指定具体路径
docker container run --rm -v ./data:/app/data <image_name>
```

常用的命令

```sh
docker volume ls
docker volume inspect <volume-name>
```

###  Docker network 网络

- 容器间通信
- 容器访问外部，涉及到ip转换（NAT），把容器的ip换成docker的ip对外请求
- 容器与宿主机通信
- 外部访问容器

Docker 默认的网络是 bridge （网桥）类型，名称是 docker 0。

默认的容器（连接路由器的电脑）创建都是在这里被分配（相当于路由器，自定义的网络还有DNS解析作用），可以让所有容器（电脑）都相连。他们之间可以轻松访问。

`-p <宿主机port>:<容器port>` 使用端口转发让容器具有外部访问的能力，相当于让宿主机的某个端口监听请求，有了请求就来容器的某个端口。这样外部就能访问容器了

- ”路由器“作用：可以NAT（network transaction），让统一网络之间可以相互访问，以及访问外部
- ”DNS解析“作用：同一网络中的容器可以通过容器名字（name）访问到容器，它会自动解析真实 IP。
- 除了 bridge 类型还有 host表示和宿主机使用同一网络。

常用命令

```sh
# 查看网络
docker network ls

# 具体信息
docker network inspect <network-name>

# 创建一个网络（路由器）,-d指定driver
docker network create -d bridge <network-name>

# 创建连接到指定网络的容器
docker  container run -d --rm --name container1 --network <network-name> <iamge-name>

# 容器连接到某个网络
docker network connect <network-name> <contaienr-name>

# 网络转发 -p <宿主机port>:<容器port>
docker container run -d --rm --name container2 --network <network-name> -p 8080:80 <image-name>
```

进阶命令

```sh
# 快速获得容器 ip 地址
docker container inspect --format '{{.NetworkSettings.IPAddress}}' <container-name>
# 输出： 172.17.0.1
```

network中使用到了 iptables ，可以查阅相关文档深入学习。

###  Clean

```sh
# 清理 不用的 容器和网络、镜像？
docker system prune -f
#清理 不用的 镜像
docker image prune -a

# 删除所有容器, -a 表示列出所有（默认只列出运行的）， -q (quiet)只列出 IDS
docker container rm -f $(docker container ps -aq)
# 再清理用不到（都用不到了）的网络、volume、镜像
docker system prune -a -f

# 删除所有 volume !!! 所有的都会删除
docker volume rm -f $(docker volume ls -q)
```

.dockerignore 当使用`.`作为构建环境时，可以忽略**不**所需内容（如 venv文件夹），以提高构建速度和减小image大小。同时对于 COPY 来说使用 `.` 也会忽略 .dockerignore 中内容。

## Docker Compose

编排多个容器，使得管理容器更加方便。一个项目可能有多个容器（web、mysql、redis、celery），把所有容器启动、volume、network都定义在一个文件中，方便每次操作或者连接。

::: code-group
```yaml [compose.yml]
services:
  service_name: # 服务名称，可以作为容器 id使用，会默认增加`_1`
    container_name: web # 容器名称，可选，全局唯一
    build: . # 需要构建的自定义镜像
    env_file: ./env # 环境变量文件
    command: [] # 容器启动后运行命令
    ports:
      - 8000:8000 # 对外开放端口
    networks:
      - frontend
    volumes:
      - server_data:/data # 持久化容器文件
    depends_on:
      - service_name_1 # 依赖的服务名称
  service_name_1:
    image: mysql:8.0.23
    networks:
      - frontend
networks:
  frontend: {} # 在同一网络中的服务可通过 服务名来访问。

volumes:
  server_data: {} # 容器关闭后其内部变化的文件将会丢失， volumes 可以将容器内文件同步到宿主机
```

:::

注意：

- service_name 不同于 container_name ，docker-compose 会默认创建以`项目（当前目录）_servicename_number`形式创建容器名，两者都可以作为 DNS 别名进行网络访问。
- 不创建 networks 的话， compose 默认创建一个 `项目名称_default` 的 bridge 类型的网络。
- 在 v1.27.0 之前，需要在最开始添加 version 来指定不同 compose 版本所支持的 指令。

例子

```yaml
services:
  web:
    build: ./app
    environment:
      - password=123
    networks:
      - web-net
    ports:
      - 8000:5000
    depends_on:
      - db
  db:
    image: mysql:5.7
    environment:
      - password=123
    networks:
      - web-net
networks:
  web-net: {} # 指定默认形式（bridge）创建网络
```

docker compose 命令行工具，必须在docker-compose.yml 文件所在目录运行，或者在命令行加上 `-f <指定compose.yml文件>`

```sh
# 启动, -d 后台运行
docker-compose up -d

# 查看容器（服务，service）
docker-compose ps

# 停止
docker-compose stop

# 删除停止的服务
docker-compose rm

# 把需要构建的镜像先 build
docker-compose build

# 启动，并对需要重新构建的镜像进行 build
docker-compose up --build
# 启动，并自动更新配置文件
docker-compose restart
#启动，并删除不需要的(孤儿)容器
docker-compose up --remove-arphons

# 查看配置是否正确
docker-compose config

# 删除容器和卷
docker compose down -v

# 运行命令
docker compose exec web command
```

### 水平扩展 scale

让容器可以重复出现，可以实现简单的 web 服务器负载均衡

```sh
# 只定义一个 server 但是可以启动多个容器，
docker-compose up -scale server_name=number
```

### 环境变量

指定secret配置，在 docker-compose.yml 同目录下创建 .env 文件，或者使用 `docker-compose --env-file <env_path>`指定环境变量位置。

```sh
REDIS_PASSWORD=123
```

在docker-compose.yml引用

```yaml
version: '3.8'
services:
  web:
    image: iamge_name
    environment:
      - REDIS_PASSWORD=${REDIS_PASSWORD}
```

### 健康检测

depends_on 只能依赖是否启动服务，但是不能保证服务是否正常。结合健康检测可以更好的维护启动。

```yaml
version: '3.8'
services:
  web:
    image: image
    depends_on:
      redis:
        condition: service_healthy # 依赖 healthy
  redis:
    image: redis:latest
    healthcheck: # 检查
      test: [CMD, redis-cli, ping]
      interval: 10s #
      timeout: 10s # 超时限制
      start_period: 10s
      retries: 3 # 重试次数
```

- test 要测试的命令
- interval 测试时间间隔
- timeout 等待响应最长时间
- start_period 何时启动运行状况检查
- retries 最大重试此时

## 例子

::: code-group
```sh [MySQL]
docker network create ---subnet=172.20.0.0/18 backend
# MySQL
docker run -it -d --name mysql_1 -p 12001:3306 \
--net backend --ip 172.20.0.2
-m 400m -v ./data/mysql/data:/var/lib/mysql \
-v ./data/mysql/config:/etc/mysql/conf.d \
--privileged=true \
-e MYSQL_ROOT_PASSWORD=123456 \
-e TZ=Asia/Shanghai \
mysql:8.0.31 \
--lower_case_table_names=1
```
```sh [MongoDB]
docker run -it -d --name mongo \
-p 27017:27017 \
--net backend --ip  172.20.0.3 \
-m 400m \
-v ./data/mongo:/etc/mongo \
-v ./data/mongo/data/db:/data/db \
-e MONGO_INITDB_ROOT_USERNAME=admin \
-e MONGO_INITDB_ROOT_PASSWORD=abc123456 \
-e TZ=Asia/Shanghai \
--privileged=true \
docker.io/mongo \
--config /etc/mongo/mongod.conf
```
```sh [Redis]
docker run -it -d --name redis \
-p 6379:6379 \
--net backend --ip 172.20.0.4 \
-m 200m \
-v ./redis/conf:/usr/local/etc/redis \
-e TZ=Asia/Shanghai \
redis:7.0.1 \
redis-server /usr/local/etc/redis/redis.config
```
```sh [RabbitMQ]
docker run -it -d --name mq \
-p 5672:5672 \
--net backend --ip 172.20.0.5 \
-m 500m \
-e TZ=Asia/Shanghai --privileged=true \
rabbitmq
```
:::

::: code-group Config
```sh [mongod.conf]
net:
   port: 27017
   bindIp: "0.0.0.0"

storage:
   dbPath: "/data/db"

security:
   authorization: enabled
```
```sh [redis.conf]
bind 0.0.0.0
protected-mode yes
port 6379
tcp-backlog 511
timeout 0
tcp-keepalive 0
loglevel notice
logfile ""
databases 12
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir ./
requirepass abc123456
```

## Reference

[Docker Documentation](https://docs.docker.com/)

[Docker 从入门到实践](https://yeasy.gitbook.io/docker_practice/)

[Compose file | Docker Documentation](https://docs.docker.com/compose/compose-file/)

[Developing inside a Container using Visual Studio Code Remote Development](https://code.visualstudio.com/docs/remote/containers)

[Docker系统性入门+实践 - 慕课网 (imooc.com)](https://coding.imooc.com/class/511.html) 不错的视频课程

[Docker Tips (Docker笔记) — Docker Tips 0.1 documentation](https://dockertips.readthedocs.io/en/latest/#)  上面课程的课件

[Example Docker Compose app](https://github.com/dockersamples/example-voting-app) 很好的学习样板

[docker compose health check example](https://gist.github.com/phuysmans/4f67a7fa1b0c6809a86f014694ac6c3a) 学习样板2（old）

[Docker Best Practices for Python Developers |TestDriven.io](https://testdriven.io/blog/docker-best-practices/#use-multi-stage-builds) 优秀教程

https://testdriven.io/blog/flask-docker-traefik/

[How to building Minimal Docker Containers for Python Applications --- 如何为 Python 应用程序构建最小的 Docker 容器 (morioh.com)](https://morioh.com/p/d777482dea93) 关于 pip install 与 pip wheel 区别

[Docker 容器优雅终止方案 – 云原生实验室 (icloudnative.io)](https://icloudnative.io/posts/why-does-my-docker-container-take-10-seconds-to-stop/) 容器停止需要10 秒问题解决
