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
 * This function iterates over the result dataset and create output suitable for csv output
 */
export function processOoyalaResult(dataset, timeSegment) {
  return dataset.map(record => {
    const { data, start_date: startDate, end_date: endDate } = record;
    return parseDataArray(data, startDate, endDate, timeSegment);
  });
}

/**
 *  This function parses data array coming from Ooyala Response.
 */
export function parseDataArray(data, startDate, endDate, timeSegment) {
  return data
    .map(element => {
      const group = extractNumbersAndStrings(element.group);
      const metrics = extractNumbersAndStrings(element.metrics);
      return Object.assign({}, { start_date: startDate, end_date: endDate, time_segment: timeSegment }, group, metrics);
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
  reportType,
  dimensions,
  timeSegment
}) {
  return Object.assign({}, {
    page: page,
    limit: pageSize,
    api_key: apiKey,
    expires: expires,
    end_date: endDate,
    start_date: startDate,
    dimensions: dimensions,
    report_type: reportType,
    time_segment: timeSegment
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
  reportType,
  dimensions,
  timeSegment
}) {
  const ooyalaParams = getOoyalaParameters({
    page, apiKey, expires, endDate, pageSize,
    startDate, dimensions, reportType, timeSegment
  });
  return `${OOYALA_API_URL}/v3/analytics/reports?` +
    `report_type=${reportType}` +
    `&start_date=${startDate}` +
    `&end_date=${endDate}` +
    `&dimensions=${dimensions}` +
    `&limit=${pageSize}` +
    `&time_segment=${timeSegment}` +
    `&page=${page}` +
    `&api_key=${apiKey}` +
    `&expires=${expires}`+
    `&signature=${urlencode(getSignature('GET', `/v3/analytics/reports`, ooyalaParams, apiSecret ))}`;
}
