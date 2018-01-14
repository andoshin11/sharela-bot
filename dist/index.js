'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
require('dotenv').config();
var handler = exports.handler = function handler(req, res) {
  return res.send(process.env.SECRET_MSG);
};