import fs from 'fs';
import {
  BannableWord,
  Config,
  MuteableWord,
  ParseResult,
  configGuard,
} from '../models/types';

/**
 * Function that validates if the given object is Config
 * @param o
 */
function isConfig(o: any): o is Config {
  let result = true;
  configGuard.forEach((config) => {
    if (!(config in o)) {
      result = false;
    }
  });
  return result;
}

/**
 * Function that validates if the given object is MuteableWords
 * @param o
 */
function isMuteableWords(o: any): o is MuteableWord {
  return 'muteableWords' in o;
}

/**
 * Function that validates if the given object is BannableWords
 * @param o
 */
function isBannableWords(o: any): o is BannableWord {
  return 'bannableWords' in o;
}

/**
 * Function that parses the JSON file and validates it
 * @param guard function that checks object
 */
const safeJsonParse = <T>(guard: (o: any) => o is T) => (text: string):
  ParseResult<T> => {
  const parsed = JSON.parse(text);
  return guard(parsed) ? { parsed, hasError: false } : { hasError: true };
};

/**
 * Get the config data from config.json
 * @throws {Error} If an attribute is missing from the config.json
 */
export function getConfig(): Config {
  const configFile = fs.readFileSync('./config/config.json', 'utf-8');

  const result = safeJsonParse(isConfig)(configFile);

  if (result.hasError) {
    throw new Error("Couldn't parse config file");
  } else {
    return result.parsed;
  }
}

/**
 * Get the muteable words from muteable-words.json
 * @throws {Error} If an attribute is missing from the muteable-words.json
 */
export function getConfigMuteable(): MuteableWord {
  const configFile = fs.readFileSync('./config/muteable-words.json', 'utf-8');

  const result = safeJsonParse(isMuteableWords)(configFile);

  if (result.hasError) {
    throw new Error("Couldn't parse muteable words");
  } else {
    return result.parsed;
  }
}

/**
 * Get the muteable words from bannable-words.json
 * @throws {Error} If an attribute is missing from the bannable-words.json
 */
export function getConfigBannable(): BannableWord {
  const configFile = fs.readFileSync('./config/bannable-words.json', 'utf-8');

  const result = safeJsonParse(isBannableWords)(configFile);

  if (result.hasError) {
    throw new Error("Couldn't parse bannable words");
  } else {
    return result.parsed;
  }
}
