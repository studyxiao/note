---
title: Web API 风格指南
---

## Web API 设计指南

遵循 RESTful api。考虑以下内容：

- 版本：`/api/v1/`
- 资源：URI表示某一资源
- 动作：HTTP方法表示对资源的操作
- [数据](./schema.md)：JSON格式数据(请求和响应)，带校验
- 状态码：HTTP状态码表示请求结果
- [认证](./auth.md)：OAuth 2使用了[承载令牌(Bearer tokens](http://tools.ietf.org/html/rfc6750)) 并且依赖于SSL的底层传输加密。
- 缓存：[ETag](http://en.wikipedia.org/wiki/HTTP_ETag)和[Last-Modified](http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.29)
- 错误


## 1. RESTful API设计规范

### 1.1 资源

- 资源名尽可能使用名词，不使用动词
- URI中的名词表示资源的集合，使用复数形式
- URI中可以包含子资源，用/分隔，嵌套层级不要超过三层
- URI中可以包含查询参数，用?分隔
- URI中的查询参数，应该表示为资源的属性， 过滤、排序、分页等操作
- 复杂参数使用 Body（JSON 格式）

### 1.2 动作

使用HTTP方法表示对资源的操作
- GET：查询资源
- POST：创建资源
- PUT：更新资源
- DELETE：删除资源

### 1.3 数据

- 数据使用JSON格式
- 数据的键使用`_`连接单词

### 1.4 状态码

- 200：成功（查询）
   - 201：成功，资源被创建
   - 203：成功，资源被修改
   - 204：成功，无内容（可以表示删除成功）
   - 206：部分成功（分块下载）
- 300：重定向
  - 301：永久重定向
  - 302：临时重定向
  - 304：资源未修改，使用缓存
- 400：客户端请求错误
  - 401：客户端未认证
  - 403：客户端认证通过，但是没有权限
  - 404：资源不存在
  - 405：HTTP方法不支持
  - 429：请求过多，限流
- 500：服务器内部错误
  - 501：服务器不支持当前请求所需要的某个功能(即将开业)
  - 502：网关错误
  - 503：服务器暂时不可用
  - 504：服务器处理超时

### 1.5 认证

- OAuth 2使用了[承载令牌(Bearer tokens](http://tools.ietf.org/html/rfc6750)) 并且依赖于SSL的底层传输加密。
- CORS

### 1.6 缓存

```sh
# TODO Etag or Last-Modified
```

### 1.7 错误

```json
{
  "code": 1234,
  "message": "Something bad happened :(",
  "description": "More details about the error here"
}
```
PUT or POST
```json
{
  "code": 1024,
  "message": "Validation Failed",
  "errors": [
    {
      "code": 5432,
      "field": "first_name",
      "message": "First name cannot have fancy characters"
    },
    {
      "code": 5622,
      "field": "password",
      "message": "Password cannot be blank"
    }
  ]
}
```

## 2. RESTful API设计 Checklist

| 问题                                                                  |            选择             |                              备注                              |
| :-------------------------------------------------------------------- | :-------------------------: | :------------------------------------------------------------: |
| **URL**                                                               |                             |                                                                |
| API Path 里面 Prefix                                                  |           `/api`            |                                                                |
| Path 里面是否包含 API 版本                                            |              ✅              |                           `/api/v1/`                           |
| Path 是否包含动作                                                     |        尽可能不包括         |                       例外：`auth/login`                       |
| 模型 ID 形式                                                          |  Readable Stable Identity   |                                                                |
| URL 中模型单数还是复数                                                |            复数             |                                                                |
| 资源是一级（平铺）还是多级（嵌套）                                    |         多级 + 一级         | 注：80% 情况都是遵循模型的归属，少量情况（常见在搜索）使用一级 |
| 搜索如何实现，独立接口（`/models/search`）还是基于列表`/models/` 接口 |            统一             |                         `/search` 接口                         |
| 是否有 Alias URL                                                      |              🚫              |                             简单点                             |
| URL 中模型是否允许缩写（或精简）                                      |              ✅              |               一旦做了精简，需要在术语表标记出来               |
| URL 中模型多个词语拼接的连字符                                        |             `-`             |                                                                |
| **Header**                                                            |                             |                                                                |
| 是否所有 Verb 都使用 POST                                             |              🚫              |                                                                |
| 修改（Modify）动作是 POST 还是 PATCH？                                |            POST             |                                                                |
| HTTP Status 返回值                                                    |    充分利用 HTTP Status     |                                                                |
| 是否使用考虑限流系统                                                  |            ✅ 429            |                                                                |
| 是否使用缓存系统                                                      |              🚫              |              简单一些，使用动态数据，去除缓存能力              |
| 是否校验 UserAgent                                                    |              ✅              |                                                                |
| 是否校验 Referrral                                                    |              🚫              |                                                                |
| **Request**                                                           |                             |                                                                |
| 复杂的参数是放到 Form Fields 还是单独一个 JSON Body                   |            Body             |                                                                |
| 子资源是一次性查询还是独立查询                                        |            嵌套             |                                                                |
| 分页参数存放                                                          |          URL Query          |                                                                |
| 分页方式                                                              |            Page             |                                                                |
| 分页控制者                                                            |           服务端            |                                                                |
| **Response**                                                          |                             |                                                                |
| 模型呈现种类                                                          |          多种模型           |                  使用的 BO / VO / Tiny / Rich                  |
| 大模型如何包含子模型模型                                              | 核心模型 + 多次关联资源查询 |                                                                |
| 字段返回是按需还是归并还是统一                                        |            统一             |    Tiny Model（可选） / Model（默认） / Rich Model（可选）     |
| 字段表现格式                                                          |        `snake_case`         |                                                                |
| 错误码                                                                |             无              |                    注：很多场景只要 message                    |
| 错误格式                                                              |          全局统一           |                                                                |
| 时区                                                                  |          ISO 8601           |                只使用一种格式，不再支持多种方案                |

*修改自：[实用 Web API 规范](https://blog.alswl.com/2023/04/web-api-guidelines/#我个人风格)*

## 3. API 文档

OpenAPI API 接口规范，是一种定义 RESTful API 的标准，它是基于 Swagger 项目的开源规范，可以用 YAML 或 JSON 格式编写 API 文档。包括 API 的基本信息、整体设计、安全、请求、响应等等。

> RESTful API 只是一种风格指导，没有规范（落地），OpenAPI 是一种将 RESTful API 规范化的标准，并进行扩展。

- https://openapi-map.apihandyman.io/
- https://bump.sh/blog/what-is-openapi 版本间区别

## References

- https://www.freecodecamp.org/news/rest-api-design-best-practices-build-a-rest-api/
- https://blog.alswl.com/2023/04/web-api-guidelines/
- https://www.cnblogs.com/traditional/tag/%E6%B7%B1%E5%BA%A6%E8%A7%A3%E5%AF%86%20HTTP%20%E5%8D%8F%E8%AE%AE/
