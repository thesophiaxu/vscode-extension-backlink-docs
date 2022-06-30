# VSCode Bi-directional link

Bi-directional links in vscode documentations and elsewhere!

## Demos

### Autocomplete

![Sample](demo2.gif)

### Link navigation

![Sample](demo1.gif)

### Symbol-level links

![Sample](demo3.gif)

## Motivation

I've been thinking about how we could improve documentation for a while - Dendron looks good, but if we want to enable richer
documentation in an existing codebase, we should be able to make it really easy to build these backlinks directly from code.

I had the idea when I was writing some high-level architectural docs for Unigraph, and the use case I had was to track implementation
within a codebase: codebases change all the time, especially for my project Unigraph which has scaffolding everywhere, and it is really
easy for documentation to get outdated. With the backlink extension, developers will be able to see documentations referencing a symbol 
at the same time as references in the codebase, and will be able to update them together too.

## Etc

Spent 3 hours on this for a basic MVP. For backlinks I used pretty basic string searches (not rly efficient but it is starting from scratch), and for the extension I referenced the official list of sample extensions.