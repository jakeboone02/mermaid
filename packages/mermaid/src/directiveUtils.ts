import * as configApi from './config.js';
import { log } from './logger.js';

let currentDirective: { type?: string; args?: any } | undefined = {};

export const parseDirective = function (
  p: any,
  statement: string,
  context: string,
  type: string
): void {
  log.debug('parseDirective is being called', statement, context, type);
  try {
    if (statement !== undefined) {
      statement = statement.trim();
      switch (context) {
        case 'open_directive':
          currentDirective = {};
          break;
        case 'type_directive':
          if (!currentDirective) {
            throw new Error('currentDirective is undefined');
          }
          currentDirective.type = statement.toLowerCase();
          break;
        case 'arg_directive':
          if (!currentDirective) {
            throw new Error('currentDirective is undefined');
          }
          currentDirective.args = JSON.parse(statement);
          break;
        case 'close_directive':
          handleDirective(p, currentDirective, type);
          currentDirective = undefined;
          break;
      }
    }
  } catch (error) {
    log.error(
      `Error while rendering sequenceDiagram directive: ${statement} jison context: ${context}`
    );
    // @ts-ignore: TODO Fix ts errors
    log.error(error.message);
  }
};

const handleDirective = function (p: any, directive: any, type: string): void {
  log.info(`Directive type=${directive.type} with args:`, directive.args);
  switch (directive.type) {
    case 'init':
    case 'initialize': {
      ['config'].forEach((prop) => {
        if (directive.args[prop] !== undefined) {
          if (type === 'flowchart-v2') {
            type = 'flowchart';
          }
          directive.args[type] = directive.args[prop];
          delete directive.args[prop];
        }
      });
      configApi.addDirective(directive.args);
      break;
    }
    case 'wrap':
    case 'nowrap':
      if (p && p['setWrap']) {
        p.setWrap(directive.type === 'wrap');
      }
      break;
    case 'themeCss':
      log.warn('themeCss encountered');
      break;
    default:
      log.warn(
        `Unhandled directive: source: '%%{${directive.type}: ${JSON.stringify(
          directive.args ? directive.args : {}
        )}}%%`,
        directive
      );
      break;
  }
};
