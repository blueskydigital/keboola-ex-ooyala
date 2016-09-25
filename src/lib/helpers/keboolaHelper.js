'use strict';
import fs from 'fs';
import csv from 'fast-csv';
import moment from 'moment';
import isThere from 'is-there';
import jsonfile from 'jsonfile';
import {
  size,
  join,
  isNull,
  isEmpty,
  isArray,
  isUndefined
} from 'lodash';
import {
  EVENT_ERROR,
  EVENT_FINISH,
  IS_INCREMENTAL,
  DEFAULT_BUCKET_NAME,
  DEFAULT_REPORT_TYPE
} from '../constants';
/**
 * This function check the input configuration specified in KBC.
 * Check whether the required fields are provided.
 * Prepare simple output that is going to be used in later phases.
 */
export async function parseConfiguration(configObject) {
  return new Promise((resolve, reject) => {
    // We need to read #api_key and #api_secret.
    // If neither of them is specified, we need to stop the extractor.
    const apiKey = configObject.get('parameters:#apiKey');
    const apiSecret = configObject.get('parameters:#apiSecret');
    if (isUndefined(apiKey) || isUndefined(apiSecret)) {
      reject('Missing parameters #api_key and/or #api_secret! Please check out the documentation for more information.');
    }
    // Specification of the parameter reportType.
    const reportType = configObject.get('parameters:reportType') || DEFAULT_REPORT_TYPE;
    if (reportType.toLowerCase() !== DEFAULT_REPORT_TYPE) {
      reject('Invalid report_type parameter. Please check out the documentation for more information.');
    }
    // Specification of the parameter bucket.
    const bucket = configObject.get('parameters:bucket') || DEFAULT_BUCKET_NAME;
    // Specification of the parameter table.
    const table = configObject.get('parameters:table') || DEFAULT_REPORT_TYPE;
    // Read the dimensions parameter.
    const dimensionsInput = configObject.get('parameters:dimensions');
    if (isUndefined(dimensionsInput) || !isArray(dimensionsInput)) {
      reject('Missing parameter dimensions! Please check out the documentation for more information.');
    };
    // Prepare the dimensions parameter based on the dimensionsInput value.
    const dimensions = size(dimensionsInput) > 0
      ? join(dimensionsInput, ',')
      : '';
    // Read date information.
    const startDate = configObject.get('parameters:startDate');
    const endDate = configObject.get('parameters:endDate');
    // Prepare the output object.
    resolve({
      table,
      apiKey,
      bucket,
      endDate,
      startDate,
      apiSecret,
      reportType,
      dimensions
    });
  });
}

/**
 * This function prepares object containing metadata required for writing
 * output data into Keboola (output files & manifests).
 */
export function getKeboolaStorageMetadata(tableOutDir, bucketName, tableName) {
  const incremental = IS_INCREMENTAL;
  const destination = `${bucketName}.${tableName}`;
  const fileName = `${tableOutDir}/${tableName}.csv`;
  const manifestFileName = `${fileName}.manifest`;
  return { tableName, fileName, incremental, destination, manifestFileName };
}

/**
 * This function just stores data to selected destination.
 * Data is appending to a file, the first one needs to have a header.
 */
export function createOutputFile(fileName, data) {
  return new Promise((resolve, reject) => {
    const headers = !isThere(fileName);
    const includeEndRowDelimiter = true;
    csv
      .writeToStream(fs.createWriteStream(fileName, {'flags': 'a'}), data, { headers, includeEndRowDelimiter })
      .on(EVENT_ERROR, () => reject('Problem with writing data into output!'))
      .on(EVENT_FINISH, () => resolve('File created!'));
  });
}

/**
 * This function simply create a manifest file related to the output data
 */
export function createManifestFile(fileName, data) {
  return new Promise((resolve, reject) => {
    jsonfile.writeFile(fileName, data, {}, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve('Manifest created!');
      }
    });
  });
}
