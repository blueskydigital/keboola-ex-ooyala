'use strict';
import fs from 'fs';
import crypto from 'crypto';
import { first, isString, isNumber } from 'lodash';

/**
 * This function helps signs requests coming to Ooyala API.
 */
export function getSignature(method, path, params, secret) {
  const hash = crypto.createHash('sha256');
  let string = secret + method + path;
  Object
    .keys(params)
    .sort()
    .forEach(key => string += key + '=' + params[key]);
  return hash
    .update(string)
    .digest('base64')
    .slice(0, 43)
    .replace(/=+$/, '');
}

/**
 * This function read the object and returns only string or number data
 */
export function extractNumbersAndStrings(data) {
  return Object
    .keys(data)
    .filter(element => isNumber(data[element]) || isString(data[element]))
    .map(element => {
      return { [ element ]: data[element] };
    })
    .reduce((memo, object) => {
      const key = first(Object.keys(object));
      memo[key] = object[key];
      return memo;
    }, {});
}

/**
 *  This function parses data array coming from Ooyala Response.
 */
export function parseDataArray(data, startDate, endDate) {
  return data
    .map(element => {
      const group = extractNumbersAndStrings(element.group);
      const metrics = extractNumbersAndStrings(element.metrics);
      return Object.assign({}, { start_date: startDate, end_date: endDate }, group, metrics);
    });
}

/**
 * This function generates the timestamp related to Ooayala's token expiration time.
 */
export function getExpiresTimestamp(ooyalaTokenExpires) {
  return ooyalaTokenExpires + Math.floor(Date.now() / 1000);
}
