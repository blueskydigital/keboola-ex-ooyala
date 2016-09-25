import path from 'path';
import isThere from 'is-there';
import request from 'request-promise';
import command from './lib/helpers/cliHelper';
import urlencode from 'urlencode';
import { getConfig } from './lib/helpers/configHelper';
import {
  size,
  first,
  isNull
} from 'lodash';
import {
  CONFIG_FILE,
  OOYALA_API_URL,
  EXPIRATION_TIME,
  OUTPUT_TABLES_DIR
} from './lib/constants';
import {
  getSignature,
  parseDataArray,
  getExpiresTimestamp,
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

    const ooyalaParams = Object.assign({}, {
      api_key: apiKey,
      expires: expires,
      report_type: reportType,
      limit: 1000,
      page: 0,
      start_date: startDate,
      end_date: endDate,
      dimensions: dimensions
    });

    const uri = `${OOYALA_API_URL}/v3/analytics/reports?` +
      `report_type=${reportType}` +
      `&start_date=${startDate}` +
      `&end_date=${endDate}` +
      `&dimensions=${dimensions}` +
      `&limit=1000` +
      `&page=0` +
      `&api_key=${apiKey}` +
      `&expires=${expires}`+
      `&signature=${urlencode(getSignature('GET', `/v3/analytics/reports`, ooyalaParams, apiSecret ))}`;

    const options = {
      uri: uri,
      method: 'GET',
      headers: { 'User-Agent': 'Request-Promise'  },
      json: true
    };
    const result = await request(options);
    const data = first(result['results'])['data'];
    const output = size(data) > 0
      ? await createOutputFile(fileName, parseDataArray(data, startDate, endDate))
      : null;
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
