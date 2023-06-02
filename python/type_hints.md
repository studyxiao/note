---
title: Type Hints
---
- 输入尽可能是包含所有类型
- 输出尽可能是最小的类型

## 是什么

Type Hints 将动态的Python语言有了静态类型检查的能力，这对于在编码阶段发现bug，提高代码可读性，IDE自动补全等都有很大的帮助。但是，Type Hints并不会影响运行时的行为，也就是说，Type Hints只是一种静态检查，而不是强制性的类型约束。不过，pydantic这个库可以将Type Hints转换成强制性的类型约束，这样就可以在运行时强制检查类型了。

## 为什么

通常在函数或模块中，我们会使用注释来说明参数的类型，返回值的类型，并利用 mypy 等类型检查器来获得IDE类型提示、类型检查等功能，从而提高代码的可维护性。

:::details
Python 是动态类型语言，这是它的优势也是它的劣势。动态类型语言的优势在于灵活，劣势在于不利于维护。在大型项目中，我们通常会使用静态类型语言，如 Java、C++ 等，来提高代码的可维护性。但是，静态类型语言的缺点在于不够灵活，而且需要编译，这使得开发效率降低。Type Hints 就是为了解决这个问题而产生的。如果项目很小，那么使用动态类型语言就足够了，但是如果项目很大，那么使用静态类型语言就更好了。Type Hints 就是为了让 Python 也能够像静态类型语言一样，提高代码的可维护性。
:::

## 有什么

**规范：**
- [PEP 484 – Type Hints](https://peps.python.org/pep-0484/) 在 PEP3107 基础上规范 type hint 标准语义。`3.5` 2014.9.29
  - [PEP 3107 – Function Annotations](https://peps.python.org/pep-3107/) 函数注解语法初步提出 `3.0`
  - [PEP 526 – Syntax for Variable Annotations](https://peps.python.org/pep-0526/) 变量注解语法 `3.6`
  - [PEP 544 – Protocols: Structural subtyping (static duck typing)](https://peps.python.org/pep-0544/) `3.8`
  - [PEP 585 – Type Hinting Generics In Standard](https://peps.python.org/pep-0585/) 支持标准库类型作为类型变量（之前必须typing.List）`3.9`
  - [PEP 593 – Flexible function and variable annotations](https://peps.python.org/pep-0593/) 使用一个特定于上下文的元数据包装现有类型，Annotated[T, x] T作为静态类型检查，x作为运行时实际值 `3.9`
  - [PEP 613 – Explicit Type Aliases](https://peps.python.org/pep-0613/) 显示类型别名 `3.10`
  -  [PEP 604 – Allow writing union types as X | Y](https://peps.python.org/pep-0604/) `3.10`
  -  [PEP 673 - Self type](https://peps.python.org/pep-0673/) `3.11`
  -  [More](https://docs.python.org/3/library/typing.html#relevant-peps)

**工具：**
- [mypy](https://github.com/python/mypy) static type checker for Python
- [pyright/pylance]() another static type checker for Python，与 vscode 集成(pylance)。

**分类：**

type hints 使用 type variable(类型变量) 来表示类型，可以分为**特定类型**和**泛型类型**
- 特定类型指已存在的指定类型，如 `a: int`、`b: str`、`c: list`、`d: dict`、`self: Self`、`e: Any`等。
- 泛型类型指（可变）类型变量，如使用 TypeVar 定义的 `T = TypeVar('T') list[T]`泛型参数 和 `Generic[T]`、`Protocol`  （只要有某个方法）定义的泛型类。

还可以分为**普通类型**和**容器类型**
- 普通类型，如`a: int`、`b: str`、`item: Book | Video | Music`、`Protocol`、`Self`
- 容器类型(使用`[]`来表示容器内容，内容可以是普通或容器类型)，如 `position: tuple[int, int]`，`items: list[Book | Video | Music]`、`Callable[[int, str], bool]`

其它工具类型还有：类型别名（TypeAlias）、overload、cast、Annotated（注解的注释）。

特别的一般普通类型是协变的（即声明类型是弗父类，则传入子类也是正确的），而对于容器类型则存在不同情况。
- 协变 convariant(可以子类替代)：只读容器如 Sequence 的item
- 逆变 contravariant（可以父类替代）：Callable的输入类型，但return 是协变
- 不变 invariant（只能自身）：可变容器, list

## 具体怎么做

- int > float > complex, `a: int` a 可以是 int、float、complex
- Sequence（序列）、Iterable（可迭代） > list/tuple，`a: Sequence[int]` a 可以是 list、tuple等, 作为参数要尽可能只包含必要的方法，如只需要迭代，那么使用 Iterable，返回值尽可能明确，如返回 list。

```python
from typing import Any, NamedTuple, NotRequired


def add(a: int, b: str="", c: int | None = None) -> list[Any]:
    return [a, b, c]

# 具名元组
class Book(NamedTuple):
    name: str
    price: int

# tuple
tuple[int, ...]  # 多个 int 组成
tuple[int]  # 的那个int 组成

# dict
dict[str, int]  # key 是 str，value 是 int
dict[str, Any]  # key 是 str，value 是任意类型

# TypedDict
from typing import TypedDict
class Book(TypedDict):
    name: str
    price: int
    date: NotRequired[str]  # 可选

# Callable
from typing import Callable
def func(a: int, b: str) -> bool:
    return True
Callable[[int, str], bool]  # 输入是 int 和 str，返回是 bool

# 有界限泛型
from typing import TypeVar
T = TypeVar('T', bound=Sequence)  # T 是 Sequence 的子类(实现了某些方法)
def func(a: T) -> T:  # a 是 T（int） 类型，返回也是 T（int） 类型
    return a

# 限定泛型
from typing import TypeVar
T = TypeVar('T', int, str)  # T 是 int 或 str，只能是这两者之一
def func(a: T) -> T:
    return a

```

### 装饰器

可选的参数装饰器（参数只在装饰器函数内使用）

```python
from collections.abc import Callable
from functools import wraps
from typing import ParamSpec, TypeVar, overload


P = ParamSpec("P")
R = TypeVar("R")


@overload
def login_required(func: Callable[P, R]) -> Callable[P, R]:
    ...


@overload
def login_required(*, optional: bool = False) -> Callable[[Callable[P, R]], Callable[P, R]]:
    ...


def login_required(
    func: Callable[P, R] | None = None, *, optional: bool = False
) -> Callable[[Callable[P, R]], Callable[P, R]] | Callable[P, R]:
    def decorator_login_required(func: Callable[P, R]) -> Callable[P, R]:
        @wraps(func)
        def wrapper_login_required(*args: P.args, **kwargs: P.kwargs) -> R:
            user = current_user.get()
            if not optional and user is None:
                raise Exception()
            return func(*args, **kwargs)

        return wrapper_login_required

    if func is not None:
        return decorator_login_required(func)

    return decorator_login_required

# 使用
@login_required
def index():
    pass

@login_required(optional=True)
def index():
    pass

```

必须参数装饰器，且参数需要传递给被装饰的函数

```python
from collections.abc import Callable
from functools import wraps
from typing import Any, Concatenate, ParamSpec, TypeVar

P = ParamSpec("P")
R = TypeVar("R")
S = TypeVar("S", bound=BaseModel)

def parameter(schema: type[S]) -> Callable[[Callable[Concatenate[S, P], R]], Callable[P, R]]:
    def decorator_parameter(func: Callable[Concatenate[S, P], R]) -> Callable[P, R]:
        @wraps(func)
        def wrapper_parameter(*args: P.args, **kwargs: P.kwargs) -> R:
            # Validate and convert query parameters using the provided schema
            return func(data, *args, **kwargs)

        return wrapper_parameter

    return decorator_parameter

# 使用
@parameter(schema=Book)
def index(data: Book, a: int):  # a 是本来的，data 是注入的
    pass

```

### 泛型类 Generic

```python
from dataclasses import dataclass
from typing import Generic, Self, TypeVar

T = TypeVar("T")

@dataclass
class Node(Generic[T]):
    value: T
    next: Self | None = None

    def set_value(self, value: T) -> Self: ...

@dataclass
class OrdinalNode(Node[int]):
    def ordinal_value(self) -> str:
        return self.value
```

### 鸭子类型 Protocol

```python

```

相较于抽象类(abc.ABC)
- 定义时无需在方法上加abstractmethod等装饰器
- “子”类定义时无需继承，只要你定义方法就行（这也是弊端，不知道哪些方法需要实现）
- 当作参数时，必须调用时检查（method(a)），而抽象子类在实例化时报错。

```python

class Obj(Protocol):
    def foo(self) -> None: ...
    def bar(self) -> None: ...

class SomeObj:
    # def foo(self) -> None:
    #     pass
    def bar(self) -> None:
        pass
def method(a: Obj) -> None:
    a.foo()  # 不会报错
    a.bar()

method(SomeObj)  # SomeObj 没有实现 foo 方法，这里会报错

class ObjABC(ABC):
    @abstractmethod
    def foo(self) -> None: ...
    @abstractmethod
    def bar(self) -> None: ...

class OtherObj(ObjABC):
    def bar(self) -> None:
        pass
def fun(a: OtherObj):
    a.foo()  # 如果 OtherObj 没有实现方法，就直接报错
```

### 动态时获取 type hints

```python
# 会绑定到对象的`__annotations__`属性上，目前版本会返回具体类型，未来版本可能会指返回字符串，所以要真正获得类型，需要使用`get_annotations`函数
from inspect import get_annotations

get_annotations(func)  # dict[str, obj]

```
## References

- https://zhuanlan.zhihu.com/p/464979921 Fluent Python 2 Type Hints 笔记
- https://www.playfulpython.com/type-hinting/
- https://lemonfold.io/posts/2022/dbc/typed_decorator/ 装饰器类型提示
- [Python interfaces: abandon ABC and switch to Protocols](https://levelup.gitconnected.com/python-interfaces-choose-protocols-over-abc-3982e112342e)
- https://www.reddit.com/r/Python/comments/10zdidm/why_type_hinting_sucks/ Type Hints 争议，不能忙不追求类型提示
