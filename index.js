require('dotenv').config()
export const handler = (req, res) => res.send(process.env.SECRET_MSG)
