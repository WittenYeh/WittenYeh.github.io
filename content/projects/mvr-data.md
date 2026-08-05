---
title: MVR-Data
category: data
date: 2026-08-01
tags: [Multi-Vector Retrieval, Apache Arrow, C++, Python]
role: maintainer
badge: C++ & Python APIs
featured: true
featuredImage: /images/projects/mvr-data-preview.svg
summary: An Arrow-based multi-vector data format with matching C++20 and native Python APIs for schemas, manifests, readers, and integrity.
highlights:
  - Supports raw multimodal objects and variable-length sets of embedded vectors.
  - Provides a header-only C++20 core built around Apache Arrow schemas and IPC.
  - Exposes the same public names through a typed pybind11 package using native PyArrow values.
extraLinks:
  - label: Documentation
    url: /projects/mvr-data
  - label: GitHub
    url: https://github.com/WittenYeh/MVR-Data
---

A compact multi-vector retrieval format with a header-only C++ reader core and same-named native Python bindings.
