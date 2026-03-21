export type Locale = "en" | "ja" | "zh" | "ko";

export interface Messages {
  readonly init: {
    readonly welcome: string;
    readonly existingConfig: string;
    readonly cancelled: string;
    readonly selectInclude: string;
    readonly selectCategories: string;
    readonly created: string;
    readonly includedRules: string;
    readonly configHint: string;
    readonly docsUrl: string;
  };
  readonly categories: {
    readonly tbl: string;
    readonly sec: string;
    readonly str: string;
    readonly ref: string;
    readonly chk: string;
    readonly ctx: string;
    readonly grp: string;
  };
}
