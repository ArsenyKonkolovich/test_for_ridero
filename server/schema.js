export default {
  description: "Request a JSON",
  tags: ["HTML to PDF"],
  body: {
    type: "object",
    properties: {
      url: { type: "string", description: "Нужна строка" },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        message: { type: "string" },
      },
    },
  },
}
