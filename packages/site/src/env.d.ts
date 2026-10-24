// Starlight 0.42 ships compiled JavaScript. Its published entry no longer
// triple-slash references virtual.d.ts, so this import needs a local declaration.
declare module "virtual:starlight/user-config" {
  const Config: import("@astrojs/starlight/types").StarlightConfig;
  export default Config;
}
