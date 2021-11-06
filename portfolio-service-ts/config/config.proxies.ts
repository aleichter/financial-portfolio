// Stores the currently-being-typechecked object for error messages.
let obj: any = null;
export class AppConfigProxy {
  public readonly grpcConfig: GrpcConfigProxy;
  public readonly esdbConfig: EsdbConfigProxy;
  public readonly logger: LoggerProxy;
  public readonly testConfig: TestConfigProxy;
  public static Parse(d: string): AppConfigProxy {
    return AppConfigProxy.Create(JSON.parse(d));
  }
  public static Create(d: any, field: string = 'root'): AppConfigProxy {
    if (!field) {
      obj = d;
      field = "root";
    }
    if (d === null || d === undefined) {
      throwNull2NonNull(field, d);
    } else if (typeof(d) !== 'object') {
      throwNotObject(field, d, false);
    } else if (Array.isArray(d)) {
      throwIsArray(field, d, false);
    }
    d.grpcConfig = GrpcConfigProxy.Create(d.grpcConfig, field + ".grpcConfig");
    d.esdbConfig = EsdbConfigProxy.Create(d.esdbConfig, field + ".esdbConfig");
    d.logger = LoggerProxy.Create(d.logger, field + ".logger");
    d.testConfig = TestConfigProxy.Create(d.testConfig, field + ".testConfig");
    return new AppConfigProxy(d);
  }
  private constructor(d: any) {
    this.grpcConfig = d.grpcConfig;
    this.esdbConfig = d.esdbConfig;
    this.logger = d.logger;
    this.testConfig = d.testConfig;
  }
}

export class GrpcConfigProxy {
  public readonly bindAddress: string;
  public readonly port: string;
  public readonly proto: string;
  public static Parse(d: string): GrpcConfigProxy {
    return GrpcConfigProxy.Create(JSON.parse(d));
  }
  public static Create(d: any, field: string = 'root'): GrpcConfigProxy {
    if (!field) {
      obj = d;
      field = "root";
    }
    if (d === null || d === undefined) {
      throwNull2NonNull(field, d);
    } else if (typeof(d) !== 'object') {
      throwNotObject(field, d, false);
    } else if (Array.isArray(d)) {
      throwIsArray(field, d, false);
    }
    checkString(d.bindAddress, false, field + ".bindAddress");
    checkString(d.port, false, field + ".port");
    checkString(d.proto, false, field + ".proto");
    return new GrpcConfigProxy(d);
  }
  private constructor(d: any) {
    this.bindAddress = d.bindAddress;
    this.port = d.port;
    this.proto = d.proto;
  }
}

export class EsdbConfigProxy {
  public readonly connection: string;
  public readonly snapshotTrigger: number;
  public static Parse(d: string): EsdbConfigProxy {
    return EsdbConfigProxy.Create(JSON.parse(d));
  }
  public static Create(d: any, field: string = 'root'): EsdbConfigProxy {
    if (!field) {
      obj = d;
      field = "root";
    }
    if (d === null || d === undefined) {
      throwNull2NonNull(field, d);
    } else if (typeof(d) !== 'object') {
      throwNotObject(field, d, false);
    } else if (Array.isArray(d)) {
      throwIsArray(field, d, false);
    }
    checkString(d.connection, false, field + ".connection");
    checkNumber(d.snapshotTrigger, false, field + ".snapshotTrigger");
    return new EsdbConfigProxy(d);
  }
  private constructor(d: any) {
    this.connection = d.connection;
    this.snapshotTrigger = d.snapshotTrigger;
  }
}

export class LoggerProxy {
  public readonly level: string;
  public static Parse(d: string): LoggerProxy {
    return LoggerProxy.Create(JSON.parse(d));
  }
  public static Create(d: any, field: string = 'root'): LoggerProxy {
    if (!field) {
      obj = d;
      field = "root";
    }
    if (d === null || d === undefined) {
      throwNull2NonNull(field, d);
    } else if (typeof(d) !== 'object') {
      throwNotObject(field, d, false);
    } else if (Array.isArray(d)) {
      throwIsArray(field, d, false);
    }
    checkString(d.level, false, field + ".level");
    return new LoggerProxy(d);
  }
  private constructor(d: any) {
    this.level = d.level;
  }
}

export class TestConfigProxy {
  public readonly unmockAll: boolean;
  public static Parse(d: string): TestConfigProxy {
    return TestConfigProxy.Create(JSON.parse(d));
  }
  public static Create(d: any, field: string = 'root'): TestConfigProxy {
    if (!field) {
      obj = d;
      field = "root";
    }
    if (d === null || d === undefined) {
      throwNull2NonNull(field, d);
    } else if (typeof(d) !== 'object') {
      throwNotObject(field, d, false);
    } else if (Array.isArray(d)) {
      throwIsArray(field, d, false);
    }
    checkBoolean(d.unmockAll, false, field + ".unmockAll");
    return new TestConfigProxy(d);
  }
  private constructor(d: any) {
    this.unmockAll = d.unmockAll;
  }
}

function throwNull2NonNull(field: string, d: any): never {
  return errorHelper(field, d, "non-nullable object", false);
}
function throwNotObject(field: string, d: any, nullable: boolean): never {
  return errorHelper(field, d, "object", nullable);
}
function throwIsArray(field: string, d: any, nullable: boolean): never {
  return errorHelper(field, d, "object", nullable);
}
function checkNumber(d: any, nullable: boolean, field: string): void {
  if (typeof(d) !== 'number' && (!nullable || (nullable && d !== null && d !== undefined))) {
    errorHelper(field, d, "number", nullable);
  }
}
function checkBoolean(d: any, nullable: boolean, field: string): void {
  if (typeof(d) !== 'boolean' && (!nullable || (nullable && d !== null && d !== undefined))) {
    errorHelper(field, d, "boolean", nullable);
  }
}
function checkString(d: any, nullable: boolean, field: string): void {
  if (typeof(d) !== 'string' && (!nullable || (nullable && d !== null && d !== undefined))) {
    errorHelper(field, d, "string", nullable);
  }
}
function errorHelper(field: string, d: any, type: string, nullable: boolean): never {
  if (nullable) {
    type += ", null, or undefined";
  }
  throw new TypeError('Expected ' + type + " at " + field + " but found:\n" + JSON.stringify(d) + "\n\nFull object:\n" + JSON.stringify(obj));
}
