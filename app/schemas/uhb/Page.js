({
  Entity: {},

  name: {
    type: 'string',
    length: {
      min: 5,
      max: 20,
    },
    unique: true,
  },

  slug: { type: 'string', unique: true },
});
