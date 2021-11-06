export interface AppConfig {
  grpcConfig: GrpcConfig;
  esdbConfig: EsdbConfig;
  logger: Logger;
  testConfig: TestConfig;
}
export interface GrpcConfig {
  bindAddress: string;
  port: string;
  proto: string;
}
export interface EsdbConfig {
  connection: string;
  snapshotTrigger: number;
}
export interface Logger {
  level: string;
}
export interface TestConfig {
  unmockAll: boolean;
}
