'use strict';
import program from 'commander';
import { DEFAULT_DATA_DIR } from '../constants';

program
  .version('1.0.0')
  .option('-d, --data <path>', `set path to the config directory, defaults to ${DEFAULT_DATA_DIR}`, DEFAULT_DATA_DIR)
  .parse(process.argv);

export default program;
