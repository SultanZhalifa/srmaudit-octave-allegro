# 1. Record architecture decisions

Date: 2026-06-06

## Status

Accepted

## Context

The project began as three large vanilla-JS files with inline event handlers and
raw HTML string templating. It needed to become a long-lived, maintainable,
enterprise-grade codebase.

## Decision

We will keep a log of architecturally significant decisions as ADRs in
`docs/adr`, using the lightweight Nygard format.

## Consequences

Future contributors can see *why* the codebase is shaped the way it is, not just
*what* it does. Superseded decisions remain on record rather than being deleted.
