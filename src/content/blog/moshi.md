---
author: Xiu-Zhe Luo
pubDatetime: 2024-07-29 15:00:00
title: Moshi - pattern matching and algebraic data types for Julia
featured: true
draft: false
tags:
  - julia
  - ways-of-programming
  - metaprogramming
  - pattern-matching
  - compiler
  - algebraic-data-types
description: Announcing Moshi, the next-gen MLStyle. Pattern matching and algebraic data types for Julia.
---

In this post, I'm excited to announce [Moshi](https://github.com/Roger-luo/Moshi.jl) (模式), a new package for Julia that brings **pattern matching** and **type-stable generic algebraic data types** to the language. It also provides a **derive macro** similar to [Rust’s derive macro](https://doc.rust-lang.org/reference/procedural-macros.html#derive-macros) for deriving traits (_a set of interface functions_) for algebraic data types (ADT) or Julia structs.
Moshi is a complete rewrite of the [MLStyle](https://github.com/thautwarm/MLStyle.jl) package.

I have been iterating the design and implementation of Moshi in the past 3 year through various packages (mostly [Expronicon](https://github.com/Roger-luo/Expronicon.jl)). The syntax and implementation is gettign stable. However, the package is still in its early stages (mostly on stabilizing the package and covering more patterns on Julia's `Base` types), I would like to announce it here and invite the community to try it out and provide feedback.

## Installation

You can install `Moshi` using the Julia package manager. From the Julia REPL, type `]` to enter the Pkg REPL mode and run:

```julia
pkg> add Moshi
```

## The Name and Acknowledgement

The name "Moshi" is derived from the Chinese word "模式" (móshì) which means "pattern". The design of pattern matching is inspired by its predecessor [MLStyle](https://github.com/thautwarm/MLStyle.jl), which tries to bring pattern matching and algebraic data types from ML family languages to Julia.

The generic algebraic data type is highly inspired by previous work done in Julia ecosystem:

- [SumTypes](https://github.com/MasonProtter/SumTypes.jl) by [@MasonProtter](https://github.com/MasonProtter).

- [Expronicon](https://github.com/Roger-luo/Expronicon.jl) by [myself](https://github.com/Roger-luo/).

- [this discussion](https://github.com/JuliaLang/julia/discussions/48883) about "generated struct" and how Julia implements `Union` types by [@vjnash](https://github.com/vtjnash).

## Quick Example

Here is a quick example of defining a simple algebraic data type:

```julia
using Moshi.Data: @data

@data Message begin
    Quit
    struct Move
        x::Int
        y::Int
    end

    Write(String)
    ChangeColor(Int, Int, Int)
end
```

For pattern matching, if you already used `MLStyle`, the syntax is very similar:

```julia
using Moshi.Match: @match

@match [1.0, 2, 3] begin
    [1, xs::Float64...] => xs
end

@match (1, 2.0, "a") begin
    (1, x::Int, y::String) => x
    (1, x::Real, y::String) => y
end
```

## What is MLStyle? And Why Rewrite?

[MLStyle](https://thautwarm.github.io/MLStyle.jl/latest/) has been one of the "go-to" patterns-matching packages in the Julia ecosystem. It is the most flexible and extensible pattern-matching system in Julia. 77 packages have been built on top of it, receiving 13k monthly downloads.

MLStyle has been a great success, but it has some problems and let me explain why I decided to rewrite it and what Moshi is trying to achieve:

### Pattern Matching Syntax Had Correctness Issues

[@thautwarm](https://github.com/thautwarm/) and I have been discussing various designs that were not made correctly back in ~2018, such as:

- [redundancy of the referencing pattern](https://github.com/thautwarm/MLStyle.jl/issues/160)
- [not being able to match ADT's namespace](https://github.com/thautwarm/MLStyle.jl/issues/156).

The main reason here is when MLStyle was designed in 2018, we didn't have enough experience in designing the pattern matching syntax in Julia. However, as a user of MLStyle in the past 6 years. I have a better understanding of the problems in MLStyle. Some ideas from [@thautwarm](https://github.com/thautwarm/) have also been floating around for [MLStyle v0.5](https://github.com/thautwarm/MLStyle.jl/issues/140). Some syntax design has become problematic when I started integrating my ADT implementation with MLStyle afterwards.

### The History of Supporting Algebraic Data Types in Julia

In fact, MLStyle also provides GADTs since 2018, but the implementation is not type-stable and the performance of generated code is not good.

Around 2021, [@YingboMa](https://github.com/YingboMa) tried to improve the performance of symbolic expression in [SymbolicUtils](https://github.com/JuliaSymbolics/SymbolicUtils.jl) in [Unityper](https://github.com/YingboMa/Unityper.jl) by manually generating tagged union types with the same C layout. However, the implementation does not support pattern matching and thus can be very verbose.

After several discussion with [@thautwarm](https://github.com/thautwarm/), I decided to use a similar approach like [Unityper](https://github.com/YingboMa/Unityper.jl) on memory management (how the `struct`s are created) and integrate my implementation with MLStyle's pattern matching system. I learned about how memory alignment should be done from [@MasonProtter](https://github.com/MasonProtter) later to further improve the performance.
This becomes the ADT in [Expronicon](https://github.com/Roger-luo/Expronicon.jl) around early 2023.

The ADT in Expronicon is type-stable and has relatively good performance. However, it has trouble supporting generic ADTs and what was more problematic is I find it is hard to support namespace in Julia. To explain this, let me ask a question: is the following code type piracy?

```julia
function Base.getproperty(::MyType, field::Symbol)
    # blabla
end
```

It should be type-stable and should not be type piracy, right? Because we are overloading the method on our own type `MyType`. Now, what about the following code?

```julia
function Base.getproperty(::Type{MyType}, field::Symbol)
    # blabla
end
```

This is actually type piracy because this effects the behaviour `.` operator inside `Core.Compiler` and methods on `Type` will need to be invalidated. This is a problem raised by [@vjnash](https://github.com/vtjnash). Thus the support of namespace in Expronicon, e.g `Message.Move(1, 2)` has been an evil implementation causing massive invalidations in packages using Expronicon.

And most importantly, from that discussion, we learned Julia's `Union` is doing the tagged Union memory layout in a similar way as `Expronicon`, `Unityper` and `SumTypes`. Thus in principle, one can just use a `Union` as the storage instead of calculating the memory layout manually. In 2023 summer, [@MasonProtter](https://github.com/MasonProtter) decided to abandon the manual memory management in [SumTypes](https://github.com/MasonProtter/SumTypes.jl). It turns out not only simplifying the implementation but also improving the performance because now Julia compiler understands the ADT and can optimize the code better via passes like union splitting.

Some has started using [@MasonProtter](https://github.com/MasonProtter)'s work in `SumTypes` since then. However, the pattern matching system in `SumTypes` is not as powerful as MLStyle. [@MasonProtter](https://github.com/MasonProtter) asked me a few times about how to integrate with MLStyle and he also complained about how hard it is to integrate with MLStyle, which I fully agree.

The implementation of ADT and pattern matching turns out to be closely related. _One need a good ADT implementation to support pattern matching and one need a good pattern matching system to support ADT_.

From a more practical perspective, I started realizing the importance of a good pattern matching system in implementing the next-gen of [Yao](https://github.com/QuantumBFS/Yao.jl) and symbolic engines like [SymbolicUtils](https://github.com/JuliaSymbolics/SymbolicUtils.jl). The proof of concept ADT in [Expronicon](https://github.com/Roger-luo/Expronicon.jl) finds its [usefulness in the refactor of SymbolicUtils combined with MLStyle](https://github.com/JuliaSymbolics/SymbolicUtils.jl/issues/611). Some of the quantum error correction compiler in [QuEra](https://github.com/QuEraComputing) was also built on top of Expronicon and MLStyle internally. These practical usage of ADT and pattern matching in Julia pushed me to rewrite MLStyle to support ADT and pattern matching in a more integrated way -- this is the born of Moshi.

### We don't like the name

Many has asked about what is "MLStyle"? It seems not everyone knows the name is inspired by "ML family languages" but instead think it is a style for machine learning. The name is also not very easy to remember.

## Conlusion

So In summary, we want the following:

- Generic Algebraic Data Types (GADT) that are type-stable and performant.
- Proper namespace support for (G)ADT in Julia that does not make compiler mad.
- A pattern matching system that is as powerful as MLStyle
  - all the standard built-in patterns in MLStyle
  - zero runtime dependency (only `Base` and `Core`)
  - expression patterns (this is the nicest feature in MLStyle for meta-programming)
  - extensible pattern matching system _(you can define your own patterns in MLStyle, just most people don't know how to do it)_
- A set of reflection tools for (G)ADT and pattern matching
- A formal definition of the pattern matching language so we can at least reason about the correctness in discussions and maybe even automatically.

Moshi is trying to achieve all of these. The package is still in its early stages (v0.3), but I believe the design is getting stable and the implementation is getting mature. I would like to invite the community to try it out and provide feedback.

## Future Work

The next step is to stabilize the package and cover more patterns on Julia's `Base` types. For example, patterns like [range patterns](https://thautwarm.github.io/MLStyle.jl/latest/syntax/pattern.html#range-patterns) and custom pattern syntax is not yet fully supported. However, they shouldn't change the main design of Moshi.

Happy coding!
