const { Parcel } = require("@parcel/core");
const { ensureDir, emptyDir } = require("fs-extra");
const { relative, join } = require(`path`);

const COMPILED_CACHE_DIR = `dist`;
const PARCEL_CACHE_DIR = `.parcel-cache`;
const fileRegex = `*.ts`;

async function getSourceToOutput(siteRoot) {
  const parcel = new Parcel({
    entries: [`${siteRoot}/**/${fileRegex}`],
    mode: `production`,
    defaultConfig: "@parcel/config-default",
    targets: {
      root: {
        outputFormat: `commonjs`,
        includeNodeModules: false,
        sourceMap: false,
        engines: {
          node: `>= 14.15.0`,
        },
        distDir: `${siteRoot}/${COMPILED_CACHE_DIR}`,
      },
    },
    cacheDir: `${siteRoot}/${PARCEL_CACHE_DIR}`,
  });
  const distDir = `${siteRoot}/${COMPILED_CACHE_DIR}`;
  await ensureDir(distDir);
  await emptyDir(distDir);
  const build = await parcel.run();

  const sourceToOutput = new Map();
  for (const bundle of build.bundleGraph.getBundles()) {
    const outputFilePath = bundle?.filePath;
    const sourceFilePath = bundle?.getMainEntry()?.filePath;

    if (outputFilePath && sourceFilePath) {
      sourceToOutput.set(
        relative(siteRoot, sourceFilePath),
        relative(siteRoot, outputFilePath)
      );
    }
  }
  return sourceToOutput;
}

describe(`scenarios`, () => {
  it(`baseline`, async () => {
    expect(await getSourceToOutput(join(__dirname, `fixtures/baseline`)))
      .toMatchInlineSnapshot(`
        Map {
          "nested/file.ts" => "dist/file.js",
        }
      `);
  });

  it(`with plugin`, async () => {
    expect(await getSourceToOutput(join(__dirname, `fixtures/with-plugin`)))
      .toMatchInlineSnapshot(`
        Map {
          "nested/file.ts" => "dist/nested/file.js",
        }
      `);
  });
});
