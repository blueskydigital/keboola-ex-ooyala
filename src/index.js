import path from 'path';
import isThere from 'is-there';
import request from 'request-promise';
import command from './lib/helpers/cliHelper';
import { getConfig } from './lib/helpers/configHelper';
import {
  size,
  first,
  isNull,
  flatten
} from 'lodash';
import {
  CONFIG_FILE,
  EXPIRATION_TIME,
  OUTPUT_TABLES_DIR
} from './lib/constants';
import {
  getOoyalaUri,
  parseDataArray,
  processOoyalaResult,
  getExpiresTimestamp
} from './lib/helpers/ooyalaHelper';
import {
  createOutputFile,
  createManifestFile,
  parseConfiguration,
  getKeboolaStorageMetadata
} from './lib/helpers/keboolaHelper';
/**
 * This is the main part of the program.
 */
(async() => {
  try {
    // Prepares the data directories.
    const dataDir = command.data;
    const dataOutDir = path.join(dataDir, OUTPUT_TABLES_DIR);
    // Read the input configuration.
    const {
      apiKey,
      bucket,
      endDate,
      pageSize,
      startDate,
      apiSecret,
      reportType,
      dimensions,
      timeSegment
    } = await parseConfiguration(getConfig(path.join(dataDir, CONFIG_FILE)));
    const expires = getExpiresTimestamp(EXPIRATION_TIME);
    const {
      fileName,
      destination,
      incremental,
      manifestFileName
    } = getKeboolaStorageMetadata(dataOutDir, reportType);

    let hasNext = true;
    let page = 0;
    do {
      const uri = getOoyalaUri({
        apiKey, expires, endDate, pageSize, timeSegment,
        startDate, dimensions, reportType, apiSecret, page
      });
      const options = { uri, json: true };
      const result = await request(options);
      const data = result['results'];
      if (size(data) > 0) {
        const test = flatten(processOoyalaResult(data, timeSegment));
        const output = createOutputFile(fileName, test);
      }
      ++page;
      hasNext = result.result_count === pageSize;
    } while (hasNext);

    const manifest = isThere(fileName)
      ? await createManifestFile(manifestFileName, { destination, incremental })
      : null;
    const outputMessage = !isNull(manifest)
      ? 'Data from Ooyala Analytics extracted!'
      : `No data from Ooyala Analytics extracted! Source dataset is empty!`;
    console.log(outputMessage);
    process.exit(0);
  } catch (error) {
    const message = error.message ? error.message : error;
    console.error(message);
    process.exit(1);
  }
})();
