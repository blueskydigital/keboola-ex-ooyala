'use strict';
import fs from 'fs';
import crypto from 'crypto';
import urlencode from 'urlencode';
import {
  first,
  isString,
  isNumber
} from 'lodash';
import { OOYALA_API_URL } from '../constants';

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

/**
 * This function get ooyala parameters required for Ooyala processing
 */
export function getOoyalaParameters({
  page,
  apiKey,
  expires,
  endDate,
  pageSize,
  startDate,
  dimensions,
  reportType
}) {
  return Object.assign({}, {
    page: page,
    limit: pageSize,
    api_key: apiKey,
    expires: expires,
    end_date: endDate,
    start_date: startDate,
    dimensions: dimensions,
    report_type: reportType
  });
}

/**
 * This function generate uri required for data download
 */
export function getOoyalaUri({
  page,
  apiKey,
  expires,
  endDate,
  pageSize,
  apiSecret,
  startDate,
  dimensions,
  reportType
}) {
  const ooyalaParams = getOoyalaParameters({
    page, apiKey, expires, endDate, pageSize,
    startDate, dimensions, reportType
  });
  return `${OOYALA_API_URL}/v3/analytics/reports?` +
    `report_type=${reportType}` +
    `&start_date=${startDate}` +
    `&end_date=${endDate}` +
    `&dimensions=${dimensions}` +
    `&limit=${pageSize}` +
    `&page=${page}` +
    `&api_key=${apiKey}` +
    `&expires=${expires}`+
    `&signature=${urlencode(getSignature('GET', `/v3/analytics/reports`, ooyalaParams, apiSecret ))}`;
}
