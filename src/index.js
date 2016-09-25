import path from 'path';
import isThere from 'is-there';
import request from 'request-promise';
import command from './lib/helpers/cliHelper';
import { getConfig } from './lib/helpers/configHelper';
import {
  size,
  first,
  isNull
} from 'lodash';
import {
  CONFIG_FILE,
  EXPIRATION_TIME,
  OUTPUT_TABLES_DIR
} from './lib/constants';
import {
  getOoyalaUri,
  parseDataArray,
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
      table,
      apiKey,
      bucket,
      endDate,
      pageSize,
      startDate,
      apiSecret,
      reportType,
      dimensions
    } = await parseConfiguration(getConfig(path.join(dataDir, CONFIG_FILE)));
    const expires = getExpiresTimestamp(EXPIRATION_TIME);
    const {
      fileName,
      tableName,
      incremental,
      destination,
      manifestFileName
    } = getKeboolaStorageMetadata(dataOutDir, bucket, table);

    let hasNext = true;
    let page = 0;
    do {
      const uri = getOoyalaUri({
        page, apiKey, expires, endDate, pageSize,
        startDate, dimensions, reportType, apiSecret
      });
      const options = { uri, json: true };
      const result = await request(options);
      const data = first(result['results'])['data'];
      const output = size(data) > 0
        ? await createOutputFile(fileName, parseDataArray(data, startDate, endDate))
        : null;
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
