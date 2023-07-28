# @amplication/plugin-integrate-openai

[![NPM Downloads](https://img.shields.io/npm/dt/@amplication/plugin-integrate-openai)](https://www.npmjs.com/package/@amplication/plugin-integrate-openai)

Adds a service to use OpenAI API

## Purpose

This plugin adds a module and a service to use OpenAI API, and adds the `openai` package as a dependency.
It expose a single function `createChatCompletion` that can be used to create a chat completion using the OpenAI API.

```ts
const result = await this.openaiService.createChatCompletion(
  "gpt-3.5-turbo",
  [
    {
      role: "system",
      content: "This is a test system message",
    },
    {
      role: "user",
      content: "This is a test user message",
    },
  ],
  {
    temperature: 1,
    max_tokens: 2048,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  }
);
```

## Configuration

This plugin requires the following environment variables:
OPENAI_API_KEY=[open-ai-key]
