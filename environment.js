"use strict";

let errors = require('./errors.js');
let util = require('util');

class EnvironmentMap {
  constructor(enclosing, kind) {
    this.enclosing = enclosing;
    this.kind = kind;
    this.entries = new Map();
  }

  forEachLocal(cb) {
    return this.entries.forEach((vs, name) => cb(vs.value, name));
  }

  getValueSource(id) {
    let vs = this.entries.get(id);
    if (vs != undefined) {
      return vs;
    }
    if (this.enclosing != null) {
      return this.enclosing.getValueSource(id);
    }
    return undefined;
  }

  get(id) {
    let vs = this.getValueSource(id);
    if (vs === undefined) {
      return undefined;
    } else {
      return vs.value;
    }
  }

  list() {
    let here = Array.from(this.entries.keys());
    if (this.enclosing != null) {
      return this.enclosing.list().concat(here);
    } else {
      return here;
    }
  }

  shadow(id, value, source) {
    this.entries.set(id, {value: value, source: source});
  }

  set(id, value, source) {
    let vs = this.getValueSource(id);
    if (vs != undefined) {
      throw new errors.Type(`Cannot shadow ${this.kind} ${id} ` +
        `(${vs.value} from ${vs.source}) with ${value} at ${source}`);
    }
    this.entries.set(id, {value: value, source: source});
  }
}

class Environment {
  constructor(enclosing) {
    if (enclosing == undefined) {
      this.enclosing = null;
      this.types = new EnvironmentMap(null, 'type');
      this.vars = new EnvironmentMap(null, 'variable');
      this.functions = new EnvironmentMap(null, 'function');
    } else {
      this.enclosing = enclosing;
      this.types = new EnvironmentMap(this.enclosing.types, 'type');
      this.vars = new EnvironmentMap(this.enclosing.vars, 'variable');
      this.functions = new EnvironmentMap(this.enclosing.functions, 'function');
    }
  }

  toString() {
    return util.inspect(this);
  }

  // The following are deprectated.
  // Use env.types, env.vars, env.functions directly.
  assignType(id, decl) {
    return this.types.set(id, decl, 'none');
  }
  getType(id) {
    return this.types.get(id);
  }
  getTypeNames() {
    return this.types.list();
  }
  assignVar(id, decl, source) {
    return this.vars.set(id, decl, 'none');
  }
  getVar(id) {
    return this.vars.get(id);
  }
  getVarNames() {
    return this.vars.list();
  }
}

class GlobalEnvironment extends Environment {
  constructor(enclosing) {
    super(enclosing);
    this.rules = new Map();
  }

  getRule(id) {
    return this.rules.get(id);
  }

  assignRule(id, decl) {
    let v = this.rules.get(id);
    if (v != undefined) {
      throw new errors.Type(`Cannot shadow rule ${id} (${v}) with ${decl}`);
    }
    this.rules.set(id, decl);
  }

  listRules() {
    return Array.from(this.rules.keys());
  }
}

module.exports = {
  Environment: Environment,
  GlobalEnvironment: GlobalEnvironment,
};
