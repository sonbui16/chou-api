/** Hằng số dùng chung — tránh fix cứng, lặp code. Import: @/config/constants.js */
const constants = {
  httpCodes: {
    // success
    ok: 200,
    created: 201,
    noContent: 204,
    // client error
    badRequest: 400,
    unauthorized: 401,
    forbidden: 403,
    notFound: 404,
    conflict: 409,
    unprocessableEntity: 422,
    tooManyRequests: 429,
    // server error
    internalServerError: 500,
  },
}

module.exports = constants
