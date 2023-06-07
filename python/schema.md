---
title: 数据校验
---

用户输入的数据，需要校验其合法性和类型转换，以保证数据的正确性。Pydantic 提供了基于 type hints 的数据校验和类型转换功能。

## 是什么

Pydantic 是一个数据校验和类型转换的库，它可以根据 type hints 来校验数据的合法性和类型转换。

## 为什么

- 数据校验的目的是为了保证数据的正确性，防止用户输入不合法的数据。
- Type hints 可以提高代码的可读性，Pydantic 可以根据 type hints 来校验数据的合法性和类型转换，可以减少代码的重复性。

## 有什么

数据校验的方法有很多，常见的有：

- 前端校验
- 后端校验（本篇涉及）
- 数据库校验

## 怎么做

1. 输入来源

- query string
- path parameter
- body
- header
- cookie
- file
- form

2. 函数参数如何判断来源

固定参数名称，如 `def index(query: Model, body: Model)`

::: details fastapi
在 fastapi 中是如下规定的：
- 如果指定了类型（fastapi内部支持），比如 Query、Path，则为对应的参数
- 如果参数名在 path 中，那么它是 path parameter
- 如果参数类型是 singular type (int, float, str, bool)，那么它是 query string
- 如果参数类型是一个 pydantic model，那么它是 body
:::

3. 解析这些参数
4. 校验、转换
5. 错误处理

## References

- https://github.com/lzjun567/flask-siwadoc 兼具数据校验和openapi(swagger)文档自动生成的项目
- https://github.com/luolingchun/flask-openapi3 Generate REST API and OpenAPI documentation for Flask
- https://github.com/miguelgrinberg/APIFairy
