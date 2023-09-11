export default {
  body: {
    type: "object",
    properties: {
      url: { type: "string" },
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
