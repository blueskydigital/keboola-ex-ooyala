'use strict';
import path from 'path';
import nconf from 'nconf';
import isThere from 'is-there';

export function getConfig(configPath) {
  // A quick check whether the config file exists (has been generated by KBC).
  // Return a parsed configuration if things are going well.
  let config = nconf.env();
  if (isThere(configPath)) {
    config.file(configPath);
    return config;
  } else {
    console.error('No configuration specified!');
    process.exit(1);
  }
}