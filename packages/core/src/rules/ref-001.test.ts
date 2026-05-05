import { describe, it, expect } from "bun:test";
import { parseDocument, runRules } from "../index.js";
import type { ParsedDocument } from "../index.js";
import { ref001 } from "./ref-001.js";

import type { Ref001Options } from "./ref-001.js";

function lint(currentFile: string, filesMap: Record<string, string>, options?: Ref001Options) {
  const documents = new Map<string, ParsedDocument>();
  for (const [path, content] of Object.entries(filesMap)) {
    documents.set(path, parseDocument(content));
  }

  const rule = ref001(options);
  const doc = documents.get(currentFile);
  if (!doc) throw new Error("unreachable");
  return runRules([rule], doc, currentFile, { documents });
}

describe("REF-001", () => {
  it("passes when all link targets exist", () => {
    const messages = lint("/project/docs/overview.md", {
      "/project/docs/overview.md": "[requirements](./requirements.md)",
      "/project/docs/requirements.md": "# Requirements",
    });
    expect(messages).toEqual([]);
  });

  it("reports a broken link", () => {
    const messages = lint("/project/docs/overview.md", {
      "/project/docs/overview.md": "[old doc](./deleted.md)",
    });
    expect(messages).toHaveLength(1);
    expect(messages[0].ruleId).toBe("REF-001");
    expect(messages[0].severity).toBe("error");
    expect(messages[0].message).toContain("./deleted.md");
  });

  it("resolves relative paths with parent directories", () => {
    const messages = lint("/project/docs/zones/auth/spec.md", {
      "/project/docs/zones/auth/spec.md":
        "[users](../bulletin-board/table_contents.md)",
      "/project/docs/zones/bulletin-board/table_contents.md": "# Contents",
    });
    expect(messages).toEqual([]);
  });

  it("ignores external URLs", () => {
    const messages = lint("/project/docs/overview.md", {
      "/project/docs/overview.md":
        "[Google](https://google.com) and [HTTP](http://example.com)",
    });
    expect(messages).toEqual([]);
  });

  it("ignores anchor-only links", () => {
    const messages = lint("/project/docs/overview.md", {
      "/project/docs/overview.md": "[section](#some-section)",
    });
    expect(messages).toEqual([]);
  });

  it("handles links with anchors to existing files", () => {
    const messages = lint("/project/docs/overview.md", {
      "/project/docs/overview.md": "[section](./requirements.md#heading)",
      "/project/docs/requirements.md": "# Requirements",
    });
    expect(messages).toEqual([]);
  });

  it("reports links with anchors to non-existing files", () => {
    const messages = lint("/project/docs/overview.md", {
      "/project/docs/overview.md": "[section](./missing.md#heading)",
    });
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("./missing.md#heading");
  });

  it("handles reference-style links", () => {
    const messages = lint("/project/docs/overview.md", {
      "/project/docs/overview.md":
        "See [ref][link1]\n\n[link1]: ./requirements.md",
      "/project/docs/requirements.md": "# Requirements",
    });
    expect(messages).toEqual([]);
  });

  it("reports multiple broken links", () => {
    const messages = lint("/project/docs/overview.md", {
      "/project/docs/overview.md":
        "[a](./missing1.md) and [b](./missing2.md)",
    });
    expect(messages).toHaveLength(2);
  });

  it("does nothing when documents is not provided", () => {
    const rule = ref001();
    const doc = parseDocument("[link](./file.md)");
    const messages = runRules([rule], doc, "/project/test.md");
    expect(messages).toEqual([]);
  });

  it("skips links matching exclude patterns", () => {
    const messages = lint("/project/docs/overview.md", {
      "/project/docs/overview.md":
        "[ref repo](../../_references/other-repo/docs/spec.md) and [local](./missing.md)",
    }, { exclude: ["_references/**"] });
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("./missing.md");
  });

  it("supports multiple exclude patterns", () => {
    const messages = lint("/project/docs/overview.md", {
      "/project/docs/overview.md":
        "[ref](../../_references/spec.md) and [prisma](../../../prisma/seed/setup.ts)",
    }, { exclude: ["_references/**", "prisma/**"] });
    expect(messages).toHaveLength(0);
  });

  it("checks all links when exclude is not set", () => {
    const messages = lint("/project/docs/overview.md", {
      "/project/docs/overview.md":
        "[ref](../../_references/spec.md)",
    });
    expect(messages).toHaveLength(1);
  });

  it("resolves links with Japanese file names", () => {
    const messages = lint("/project/docs/概要.md", {
      "/project/docs/概要.md": "[要件](./要件定義.md)",
      "/project/docs/要件定義.md": "# 要件定義",
    });
    expect(messages).toEqual([]);
  });

  it("reports broken links with Japanese file names", () => {
    const messages = lint("/project/docs/概要.md", {
      "/project/docs/概要.md": "[要件](./要件定義.md)",
    });
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("要件定義.md");
  });

  it("resolves links with Korean file names", () => {
    const messages = lint("/project/docs/개요.md", {
      "/project/docs/개요.md": "[요구사항](./요구사항.md)",
      "/project/docs/요구사항.md": "# 요구사항",
    });
    expect(messages).toEqual([]);
  });

  it("reports broken links with Korean file names", () => {
    const messages = lint("/project/docs/개요.md", {
      "/project/docs/개요.md": "[요구사항](./요구사항.md)",
    });
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("요구사항.md");
  });

  it("resolves links with Chinese file names", () => {
    const messages = lint("/project/docs/概述.md", {
      "/project/docs/概述.md": "[需求](./需求文档.md)",
      "/project/docs/需求文档.md": "# 需求文档",
    });
    expect(messages).toEqual([]);
  });

  it("reports broken links with Chinese file names", () => {
    const messages = lint("/project/docs/概述.md", {
      "/project/docs/概述.md": "[需求](./需求文档.md)",
    });
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("需求文档.md");
  });
});

describe("REF-001 with siteRouter (starlight preset)", () => {
  const starlightOptions: Ref001Options = {
    siteRouter: {
      preset: "starlight",
      contentDir: "/project/site/docs",
      defaultLocale: "root",
      locales: ["root", "ja", "ko", "zh"],
    },
  };

  it("resolves root locale URL to <contentDir>/<rest>/index.md", () => {
    const messages = lint(
      "/project/site/docs/index.md",
      {
        "/project/site/docs/index.md": "[get started](/docs/get-started/)",
        "/project/site/docs/docs/get-started/index.md": "# Get Started",
      },
      starlightOptions,
    );
    expect(messages).toEqual([]);
  });

  it("resolves ja locale URL to <contentDir>/ja/<rest>/index.md", () => {
    const messages = lint(
      "/project/site/docs/ja/index.md",
      {
        "/project/site/docs/ja/index.md": "[はじめに](/ja/docs/get-started/)",
        "/project/site/docs/ja/docs/get-started/index.md": "# はじめに",
      },
      starlightOptions,
    );
    expect(messages).toEqual([]);
  });

  it("resolves ko locale URL to <contentDir>/ko/<rest>/index.md", () => {
    const messages = lint(
      "/project/site/docs/ko/index.md",
      {
        "/project/site/docs/ko/index.md": "[시작하기](/ko/docs/get-started/)",
        "/project/site/docs/ko/docs/get-started/index.md": "# 시작하기",
      },
      starlightOptions,
    );
    expect(messages).toEqual([]);
  });

  it("resolves zh locale URL to <contentDir>/zh/<rest>/index.md", () => {
    const messages = lint(
      "/project/site/docs/zh/index.md",
      {
        "/project/site/docs/zh/index.md": "[入门](/zh/docs/get-started/)",
        "/project/site/docs/zh/docs/get-started/index.md": "# 入门",
      },
      starlightOptions,
    );
    expect(messages).toEqual([]);
  });

  it("reports broken Starlight URL when target file does not exist", () => {
    const messages = lint(
      "/project/site/docs/index.md",
      {
        "/project/site/docs/index.md": "[missing](/docs/missing-page/)",
      },
      starlightOptions,
    );
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("/docs/missing-page/");
  });

  it("resolves Starlight URL with .md fallback when no index.md", () => {
    const messages = lint(
      "/project/site/docs/index.md",
      {
        "/project/site/docs/index.md": "[direct](/docs/single-page/)",
        "/project/site/docs/docs/single-page.md": "# Single Page",
      },
      starlightOptions,
    );
    expect(messages).toEqual([]);
  });

  it("strips anchor from Starlight URL when checking", () => {
    const messages = lint(
      "/project/site/docs/index.md",
      {
        "/project/site/docs/index.md": "[heading](/docs/get-started/#section)",
        "/project/site/docs/docs/get-started/index.md": "# Get Started",
      },
      starlightOptions,
    );
    expect(messages).toEqual([]);
  });

  it("still resolves relative paths when siteRouter is set", () => {
    const messages = lint(
      "/project/site/docs/concepts/overview.md",
      {
        "/project/site/docs/concepts/overview.md": "[next](./details.md)",
        "/project/site/docs/concepts/details.md": "# Details",
      },
      starlightOptions,
    );
    expect(messages).toEqual([]);
  });

  it("treats absolute URL as filesystem path when siteRouter is NOT set", () => {
    // Regression: without siteRouter, /docs/get-started/ is filesystem-resolved
    // (existing behavior preserved)
    const messages = lint("/project/site/docs/index.md", {
      "/project/site/docs/index.md": "[get started](/docs/get-started/)",
      "/project/site/docs/docs/get-started/index.md": "# Get Started",
    });
    expect(messages).toHaveLength(1);
  });
});

describe("REF-001 with siteRouter (generic, no preset)", () => {
  it("resolves URL via urlPrefix + contentDir mapping", () => {
    const messages = lint(
      "/project/wiki/index.md",
      {
        "/project/wiki/index.md": "[page](/wiki/some-page/)",
        "/project/wiki/some-page/index.md": "# Some Page",
      },
      {
        siteRouter: {
          contentDir: "/project/wiki",
          urlPrefix: "/wiki",
        },
      },
    );
    expect(messages).toEqual([]);
  });

  it("reports broken URL with generic router", () => {
    const messages = lint(
      "/project/wiki/index.md",
      {
        "/project/wiki/index.md": "[missing](/wiki/missing/)",
      },
      {
        siteRouter: {
          contentDir: "/project/wiki",
          urlPrefix: "/wiki",
        },
      },
    );
    expect(messages).toHaveLength(1);
  });
});
